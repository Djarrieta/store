import { type BaseMessage,HumanMessage, ToolMessage } from "@langchain/core/messages";

import { createServiceClient } from "@/lib/supabase/service";

import { DeepSeekLLMProvider } from "./deepseekProvider";

const MAX_STEPS = 10;

// ---------------------------------------------------------------------------
// Tool definitions (OpenAI function-calling format, works with DeepSeek too)
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "query_products",
      description: "Returns the full product catalog with current stock information.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_categories",
      description: "Returns all product categories.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_items",
      description: "Returns all stock items (variants) for all products.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_shipping_rates",
      description: "Returns shipping rates by department/city and the free-shipping threshold. Use when the user asks about shipping costs, delivery times, or whether their city is covered.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_content",
      description: "Fetches the value of a specific store content entry by key. Use the available keys listed in the prompt to choose the right one.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "The content key to fetch (e.g. 'logistics_payment', 'logistics_shipping')." },
        },
        required: ["key"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bot_create_order",
      description: "Creates a new pending order and returns its UUID.",
      parameters: {
        type: "object",
        properties: {
          user_ref:  { type: "string", description: "User UUID" },
          user_name: { type: "string", description: "User display name" },
          items: {
            type: "array",
            description: "Order line items",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string", description: "Item/product UUID" },
                title:      { type: "string", description: "Product name" },
                qty:        { type: "integer", description: "Quantity ordered" },
                unit_price: { type: "number", description: "Unit price in COP" },
                sku:        { type: "string", description: "SKU (optional)" },
              },
              required: ["product_id", "title", "qty", "unit_price"],
            },
          },
          total: { type: "number", description: "Total order amount in COP" },
          notes: { type: "string", description: "Optional delivery or order notes" },
        },
        required: ["user_ref", "user_name", "items", "total"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bot_get_my_orders",
      description: "Returns the 20 most recent orders for a given user.",
      parameters: {
        type: "object",
        properties: {
          user_ref: { type: "string", description: "User UUID" },
        },
        required: ["user_ref"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bot_get_order_status",
      description: "Returns the status of a single order owned by the user.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "Order UUID" },
          user_ref: { type: "string", description: "User UUID" },
        },
        required: ["order_id", "user_ref"],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers — all use the service Supabase client (HTTPS, IPv4-safe)
// ---------------------------------------------------------------------------

type Args = Record<string, unknown>;
type Handler = (args: Args) => Promise<string>;

const HANDLERS: Record<string, Handler> = {
  query_products: async () => {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("products")
      .select("id, title, description, price, discount, tags, category:category_id(name), items(id, stock, item_categories(category:category_id(id, name)))")
      .order("title");
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  },

  query_categories: async () => {
    const sb = createServiceClient();
    const { data, error } = await sb.from("categories").select("id, name, slug").order("name");
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  },

  query_items: async () => {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("items")
      .select("id, stock, item_categories(category:category_id(id, name)), product:product_id(title, price)")
      .order("id");
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  },

  query_shipping_rates: async () => {
    const sb = createServiceClient();
    const [{ data: rates, error: e1 }, { data: config, error: e2 }] = await Promise.all([
      sb.from("ships").select("department, city, price_cop, estimated_days").order("department").order("city"),
      sb.from("ships_config").select("free_above_cop").single(),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return JSON.stringify({ free_above_cop: config?.free_above_cop ?? null, rates: rates ?? [] });
  },

  query_content: async (args) => {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("content")
      .select("key, value")
      .eq("key", String(args.key))
      .single();
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? {});
  },

  bot_create_order: async (args) => {
    const sb = createServiceClient();
    // Normalize items to the canonical OrderItem schema regardless of LLM field naming
    const rawItems = (args.items as Array<Record<string, unknown>>) ?? [];
    const normalizedItems = rawItems.map((item) => ({
      product_id: item.product_id ?? item.id ?? null,
      title: item.title ?? item.producto ?? item.name ?? null,
      qty: Number(item.qty ?? item.cantidad ?? item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? item.precio_unitario ?? item.price ?? 0),
      sku: item.sku ?? null,
    }));
    const { data, error } = await sb.rpc("bot_create_order", {
      p_user_ref:  String(args.user_ref),
      p_user_name: String(args.user_name),
      p_items:     normalizedItems,
      p_total:     Number(args.total),
      p_notes:     (args.notes as string | undefined) ?? null,
    });
    if (error) throw new Error(error.message);
    return JSON.stringify({ order_id: data });
  },

  bot_get_my_orders: async (args) => {
    const sb = createServiceClient();
    const { data, error } = await sb.rpc("bot_get_my_orders", {
      p_user_ref: String(args.user_ref),
    });
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? []);
  },

  bot_get_order_status: async (args) => {
    const sb = createServiceClient();
    const { data, error } = await sb.rpc("bot_get_order_status", {
      p_order_id: String(args.order_id),
      p_user_ref: String(args.user_ref),
    });
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? { status: null, tracking_code: null });
  },
};

// ---------------------------------------------------------------------------
// LLM instance (reused across calls within the same server process)
// ---------------------------------------------------------------------------

const llmWithTools = new DeepSeekLLMProvider().getInstance().bindTools(TOOLS);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateResponse(prompt: string, userRef: string | null = null): Promise<string> {
  if (!prompt?.trim()) throw new Error("Prompt is empty");

  const GUEST_BLOCKED_TOOLS = new Set(["bot_create_order", "bot_get_my_orders", "bot_get_order_status"]);

  const messages: BaseMessage[] = [new HumanMessage(prompt)];

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await llmWithTools.invoke(messages);
    messages.push(response);

    if (!response.tool_calls?.length) break;

    for (const toolCall of response.tool_calls) {
      let result: string;
      if (userRef === null && GUEST_BLOCKED_TOOLS.has(toolCall.name)) {
        result = JSON.stringify({ error: "Esta acción requiere que el usuario haya iniciado sesión." });
      } else {
        const handler = HANDLERS[toolCall.name];
        if (!handler) {
          result = JSON.stringify({ error: `Unknown tool: ${toolCall.name}` });
        } else {
          try {
            result = await handler(toolCall.args as Args);
          } catch (err) {
            result = JSON.stringify({ error: (err as Error).message });
          }
        }
      }
      messages.push(new ToolMessage({ content: result, tool_call_id: toolCall.id! }));
    }
  }

  const last = messages.at(-1);
  if (!last) throw new Error("No response from AI");
  const content = typeof last.content === "string" ? last.content : JSON.stringify(last.content);
  
  return content;
}
