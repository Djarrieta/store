/**
 * Custom MCP server for the store assistant.
 * Uses @supabase/supabase-js (HTTPS/IPv4) instead of a direct Postgres connection,
 * which avoids the IPv6-only direct-DB hostname issue on Windows.
 *
 * Tools exposed (mirrors the assistant_bot role permissions):
 *   - query_products       : read product catalog with stock
 *   - query_categories     : read categories
 *   - query_items          : read items (stock variants)
 *   - query_content        : read store content entries
 *   - bot_create_order     : create a new order (calls DB function)
 *   - bot_get_my_orders    : list a user's orders (calls DB function)
 *   - bot_get_order_status : get status of one order (calls DB function)
 */

"use strict";

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.stderr.write("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const TOOLS = [
  {
    name: "query_products",
    description: "Returns the full product catalog with stock information.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "query_categories",
    description: "Returns all product categories.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "query_items",
    description: "Returns all stock items (variants) for all products.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "query_content",
    description: "Returns store content entries (store info, policies, etc.).",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "bot_create_order",
    description: "Creates a new pending order and returns its UUID.",
    inputSchema: {
      type: "object",
      properties: {
        user_ref:  { type: "string",  description: "User UUID" },
        user_name: { type: "string",  description: "User display name" },
        items:     { type: "object",  description: "Order line items as JSON (e.g. [{product_id, title, qty, unit_price}])" },
        total:     { type: "number",  description: "Total order amount" },
        notes:     { type: "string",  description: "Optional delivery or order notes" },
      },
      required: ["user_ref", "user_name", "items", "total"],
    },
  },
  {
    name: "bot_get_my_orders",
    description: "Returns the 20 most recent orders for a given user.",
    inputSchema: {
      type: "object",
      properties: {
        user_ref: { type: "string", description: "User UUID" },
      },
      required: ["user_ref"],
    },
  },
  {
    name: "bot_get_order_status",
    description: "Returns the status string of a single order owned by the user.",
    inputSchema: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "Order UUID" },
        user_ref: { type: "string", description: "User UUID" },
      },
      required: ["order_id", "user_ref"],
    },
  },
];

const server = new Server(
  { name: "store-assistant-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let data, error;

    switch (name) {
      case "query_products":
        ({ data, error } = await supabase
          .from("products")
          .select("id, title, description, price, discount, tags, category:category_id(name), items(id, stock, attributes)")
          .order("title"));
        break;

      case "query_categories":
        ({ data, error } = await supabase
          .from("categories")
          .select("id, name, description")
          .order("name"));
        break;

      case "query_items":
        ({ data, error } = await supabase
          .from("items")
          .select("id, stock, attributes, product:product_id(title, price)")
          .order("id"));
        break;

      case "query_content":
        ({ data, error } = await supabase
          .from("content")
          .select("key, value")
          .order("key"));
        break;

      case "bot_create_order":
        ({ data, error } = await supabase.rpc("bot_create_order", {
          p_user_ref:  String(args.user_ref),
          p_user_name: String(args.user_name),
          p_items:     args.items,
          p_total:     Number(args.total),
          p_notes:     args.notes ?? null,
        }));
        data = { order_id: data };
        break;

      case "bot_get_my_orders":
        ({ data, error } = await supabase.rpc("bot_get_my_orders", {
          p_user_ref: String(args.user_ref),
        }));
        break;

      case "bot_get_order_status":
        ({ data, error } = await supabase.rpc("bot_get_order_status", {
          p_order_id: String(args.order_id),
          p_user_ref: String(args.user_ref),
        }));
        data = { status: data };
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    if (error) throw error;

    return { content: [{ type: "text", text: JSON.stringify(data ?? []) }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
