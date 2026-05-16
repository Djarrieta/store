# AI Assistant Plan

Implement a WhatsApp-ready AI assistant for the store, exposed as a Next.js API Route (`POST /api/assistant`) and a web chat UI. The assistant answers questions about products, stock, categories, and store policies — and can **create orders on behalf of the user** that an admin then approves.

Uses **DeepSeek** (via `@langchain/openai` with base URL override) and **MCP** (`mcp-use`) for tool-calling, mirroring the architecture of the reference project.

---

## Reference Architecture (other project)

The reference uses:
- `AssistantController` — orchestrates prompt building, AI call, and history persistence
- `ResponseGenerator` (MCP) — abstracts the AI provider call
- `ChatHistoryRepository` — stores per-user conversation turns
- `UsersRepository` — get-or-create user by external ID
- `fetchContextTopics` — dynamic context injected into the prompt (e.g. promotions, low-stock)
- A prompt template with `{{userId}}`, `{{userInfo}}`, `{{schema}}`, `{{contextTopics}}`, `{{conversationHistory}}`, `{{userMessage}}`

This project adapts the same pattern to Next.js App Router + Supabase.

---

## 1. New Supabase Migrations

### `10_chat_messages.sql`

Persists conversation history keyed by `user_ref` (phone number for WhatsApp, Supabase user ID for web):

```sql
CREATE TABLE public.chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ref   text NOT NULL,          -- phone number or Supabase user ID
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_user_ref_idx ON public.chat_messages (user_ref, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages: no public access"
  ON public.chat_messages FOR ALL USING (false);
```

### `11_orders.sql`

Orders created by the assistant, pending human approval:

```sql
CREATE TABLE public.orders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ref   text NOT NULL,          -- phone or Supabase user ID
  user_name  text,
  status     text NOT NULL DEFAULT 'pending_approval'
               CHECK (status IN ('pending_approval', 'approved', 'rejected', 'fulfilled')),
  items      jsonb NOT NULL DEFAULT '[]',
             -- [{product_id, title, qty, unit_price, sku}]
  total      numeric(10,2) NOT NULL DEFAULT 0,
  notes      text,                   -- extra instructions captured in conversation
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX orders_status_idx ON public.orders (status, created_at);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Bot creates orders via service role key (bypasses RLS)
CREATE POLICY "orders: no public access"
  ON public.orders FOR ALL USING (false);

-- Admins can read and update via dashboard (uses is_admin check)
CREATE POLICY "orders: admin all"
  ON public.orders FOR ALL
  USING (public.is_admin(auth.uid()));
```

> Both tables use the **service role key** server-side. History is never exposed to the client.

### `12_assistant_role.sql`

Creates a least-privilege Postgres role for the MCP server — no direct table writes, no access to other users' data:

```sql
-- Create the role (password set out-of-band via Supabase dashboard or env-driven script,
-- never hardcoded in version-controlled migrations)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'assistant_bot') THEN
    CREATE ROLE assistant_bot WITH LOGIN NOINHERIT;
  END IF;
END $$;

-- Revoke all default public schema privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM assistant_bot;
REVOKE ALL ON SCHEMA public FROM assistant_bot;
GRANT USAGE ON SCHEMA public TO assistant_bot;

-- Read-only access to public catalog tables only
GRANT SELECT ON public.products  TO assistant_bot;
GRANT SELECT ON public.categories TO assistant_bot;
GRANT SELECT ON public.items      TO assistant_bot;
GRANT SELECT ON public.content    TO assistant_bot;
-- NOTE: NO direct access to orders or chat_messages

-- Controlled write: create an order (validates & inserts, returns order id)
CREATE OR REPLACE FUNCTION public.bot_create_order(
  p_user_ref  text,
  p_user_name text,
  p_items     jsonb,
  p_total     numeric,
  p_notes     text DEFAULT NULL
) RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.orders (user_ref, user_name, items, total, notes)
  VALUES (p_user_ref, p_user_name, p_items, p_total, p_notes)
  RETURNING id;
$$;
GRANT EXECUTE ON FUNCTION public.bot_create_order TO assistant_bot;

-- Controlled read: fetch only the requesting user's orders
CREATE OR REPLACE FUNCTION public.bot_get_my_orders(p_user_ref text)
RETURNS TABLE(
  id uuid, status text, items jsonb, total numeric, notes text, created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, status, items, total, notes, created_at
  FROM public.orders
  WHERE user_ref = p_user_ref
  ORDER BY created_at DESC
  LIMIT 20;
$$;
GRANT EXECUTE ON FUNCTION public.bot_get_my_orders TO assistant_bot;

-- Controlled read: single order status (own orders only)
CREATE OR REPLACE FUNCTION public.bot_get_order_status(p_order_id uuid, p_user_ref text)
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT status FROM public.orders
  WHERE id = p_order_id AND user_ref = p_user_ref;
$$;
GRANT EXECUTE ON FUNCTION public.bot_get_order_status TO assistant_bot;
```

> **Password management:** After running the migration, set the password with
> `ALTER ROLE assistant_bot WITH PASSWORD '...';` via the Supabase SQL editor (not in git).
> Store the resulting `ASSISTANT_DB_URL` in your secrets manager only.

### `13_approve_order.sql`

Atomic stock deduction + status transition when an admin approves an order:

```sql
CREATE OR REPLACE FUNCTION public.approve_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order  public.orders;
  v_item   jsonb;
  v_rows   int;
BEGIN
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF v_order.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Order % is not pending approval (current: %)', p_order_id, v_order.status;
  END IF;

  -- Deduct stock for every line item atomically
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_order.items)
  LOOP
    UPDATE public.items
    SET stock = stock - (v_item->>'qty')::int
    WHERE product_id = (v_item->>'product_id')::uuid
      AND stock >= (v_item->>'qty')::int;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_id';
    END IF;
  END LOOP;

  UPDATE public.orders SET status = 'approved' WHERE id = p_order_id;
END;
$$;

-- Only admins can call this (via server action using service role key)
```

> The `approveOrder(id)` server action calls `supabase.rpc('approve_order', { p_order_id: id })`. All stock deductions and the status change happen in a single transaction — if any item is out of stock the whole operation rolls back.

---

## 2. New Files

```
src/
  app/
    api/
      assistant/
        route.ts              # POST handler for WhatsApp bot
    chat/
      page.tsx               # Web chat UI (Server Component shell)
      ChatWidget.tsx         # Client component — message input + history
      actions.ts             # Server Action: sendMessage() for web users
    admin/
      orders/
        page.tsx             # List pending/all orders
        actions.ts           # approveOrder, rejectOrder, fulfillOrder
        [id]/
          page.tsx           # Order detail
  lib/
    assistant/
      prompt.ts              # ASSISTANT_PROMPT template string
      buildPrompt.ts         # Assembles the final prompt from DB context
      mcpService.ts          # MCPService (wraps mcp-use MCPAgent)
      deepseekProvider.ts    # DeepSeekLLMProvider (ChatOpenAI + base URL)
      chatHistory.ts         # Supabase helpers: getHistory, addMessage
      contextTopics.ts       # Dynamic context: sales, low stock, new arrivals
  types/
    order.ts                 # Order, OrderItem, CreateOrderInput types
mcp.config.json              # MCP server — uses @modelcontextprotocol/server-postgres
                             #   connected as assistant_bot (limited role)
supabase/
  migrations/
    10_chat_messages.sql
    11_orders.sql
    12_assistant_role.sql    # assistant_bot role + SECURITY DEFINER functions
    13_approve_order.sql     # approve_order() DB function (atomic stock deduction)
```

---

## 3. API Route — `src/app/api/assistant/route.ts`

**Method:** `POST`
**Path:** `/api/assistant`

### Request body
```ts
{
  message: string;   // user's question
  userRef: string;   // stable identifier, e.g. WhatsApp phone number
  name?: string;     // display name (optional, for first contact)
}
```

### Response
```ts
{ response: string }
// or
{ error: string }  // 400 / 500
```

### Flow
1. Validate `message` and `userRef` are present.
2. Verify the shared secret header (`X-Assistant-Secret`) matches `ASSISTANT_SECRET` env var — reject with 401 if not.
3. Load the last **N** messages from `chat_messages` for `userRef` (e.g. last 20).
4. Load dynamic context via `fetchContextTopics()`.
5. Load store schema context (product list with category, price, stock) from Supabase.
6. Build the final prompt using `buildPrompt()`.
7. Save the incoming `message` as `role: 'user'` in `chat_messages`.
8. Call `generateResponse(prompt)` to get the AI reply.
9. Save the AI reply as `role: 'assistant'` in `chat_messages`.
10. Return `{ response }`.

---

## 4. Prompt Template — `src/lib/assistant/prompt.ts`

```
You are a helpful assistant for [Store Name], an online store.

Today's date: {{date}}

## Store Information
{{storeContent}}

## Product Catalog
{{productCatalog}}

## Active Context
{{contextTopics}}

## Conversation History
{{conversationHistory}}

## Current Question
{{userMessage}}

Answer in Spanish. Be concise and friendly. If you don't know something, say so.
If asked about a product, always mention its price and stock availability.
Never make up prices or availability.
```

Placeholders:
| Placeholder | Source |
|---|---|
| `{{date}}` | `new Date().toLocaleDateString()` |
| `{{storeContent}}` | `content` table rows (store name, policies, hours, etc.) |
| `{{productCatalog}}` | Products joined with categories + items (stock) |
| `{{contextTopics}}` | `fetchContextTopics()` — e.g. "Products on discount: X, Y" |
| `{{conversationHistory}}` | Last N `chat_messages` rows for `userRef` |
| `{{userMessage}}` | The incoming message |

---

## 5. Context Building — `src/lib/assistant/buildPrompt.ts`

Queries to run (all server-side with service role key):

```ts
// 1. Store content (policies, name, etc.)
supabase.from('content').select('key, value')

// 2. Product catalog with categories and stock
supabase
  .from('products')
  .select('title, price, discount, tags, category:category_id(name), items(stock)')

// 3. Chat history
supabase
  .from('chat_messages')
  .select('role, message, created_at')
  .eq('user_ref', userRef)
  .order('created_at', { ascending: true })
  .limit(20)
```

Format the product catalog as a compact text list to keep the prompt token-efficient:
```
- [Title] | Category: [name] | Price: $[price] | Stock: [total_stock] | Tags: [tags]
```

---

## 6. Dynamic Context — `src/lib/assistant/contextTopics.ts`

Examples of dynamic context to highlight:
- Products with discount > 0 ("Products currently on sale: ...")
- Products with low stock (stock < 5)
- Newest products (created in last 7 days)

Returns a plain text string injected into `{{contextTopics}}`.

---

## 7. AI Provider — MCP + DeepSeek

Mirrors the reference project architecture exactly.

### Dependencies
```bash
npm install mcp-use @langchain/openai langchain
```

### `src/lib/assistant/deepseekProvider.ts`

Wraps `ChatOpenAI` to point at DeepSeek's OpenAI-compatible endpoint:

```ts
import { ChatOpenAI } from "@langchain/openai";

export class DeepSeekLLMProvider {
  private instance: ChatOpenAI | null = null;

  getInstance(): ChatOpenAI {
    if (!this.instance) {
      this.instance = new ChatOpenAI({
        modelName: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
        temperature: 0.2,
        apiKey: process.env.DEEPSEEK_API_KEY!,
        configuration: { baseURL: process.env.DEEPSEEK_BASE_URL },
      });
    }
    return this.instance;
  }
}
```

### `src/lib/assistant/mcpService.ts`

Adapts `MCPService` from the reference project — loads `mcp.config.json`, initialises a singleton `MCPAgent`, and exposes `generateResponse(prompt)`.

> **Serverless note:** The module-level singleton works in development and Node.js servers. On Vercel serverless each cold-start recreates the agent — this is acceptable but means MCP session handshake happens on every cold invocation. Use long-lived Node.js hosting (e.g. Vercel Functions with `maxDuration`, Railway, Fly.io) if latency matters.

### `mcp.config.json`

Uses `@modelcontextprotocol/server-postgres` connecting as the **`assistant_bot`** role — not the service role key. The bot cannot access any table or perform any action beyond what that role explicitly allows.

```json
{
  "mcpServers": {
    "store": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "${ASSISTANT_DB_URL}"],
      "env": {}
    }
  }
}
```

`ASSISTANT_DB_URL` is a Postgres connection string for the `assistant_bot` role:
```
postgresql://assistant_bot:<password>@db.<ref>.supabase.co:5432/postgres
```

> The `assistant_bot` role has **no direct table write access**. The only mutations it can perform are through the `bot_create_order(...)` SECURITY DEFINER function defined in the migration. The only rows it can read from `orders` are via `bot_get_my_orders(user_ref)`, which filters by `user_ref` in SQL — the agent physically cannot retrieve another user's orders.

### MCP capabilities exposed to the agent

| Capability | Mechanism | Access level |
|---|---|---|
| Browse products | Direct `SELECT` on `products` | All rows, read-only |
| Browse categories | Direct `SELECT` on `categories` | All rows, read-only |
| Check stock | Direct `SELECT` on `items` | All rows, read-only |
| Read store policies | Direct `SELECT` on `content` | All rows, read-only |
| Create order | `bot_create_order(user_ref, ...)` function | Insert only, own user_ref |
| View own orders | `bot_get_my_orders(user_ref)` function | Own rows only |
| Check order status | `bot_get_order_status(order_id, user_ref)` function | Own rows only |

---

## 8. Environment Variables

Add to `.env.local`:

```env
# DeepSeek (OpenAI-compatible)
DEEPSEEK_API_KEY=<your-deepseek-token>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Shared secret for the /api/assistant endpoint (WhatsApp bot auth)
ASSISTANT_SECRET=<random-secret>

# Supabase service role key — used ONLY by admin server actions (approve/reject orders)
# NEVER expose to client, NEVER pass to MCP
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Limited Postgres connection string for the assistant_bot role
# Used exclusively by the MCP server — read-only tables + controlled functions only
ASSISTANT_DB_URL=postgresql://assistant_bot:<password>@db.<ref>.supabase.co:5432/postgres
```

All vars must NOT have the `NEXT_PUBLIC_` prefix. Add an `.env.local.example` with these keys (empty values) for onboarding.

---

## 9. Orders Model

### Status flow
```
pending_approval → approved → fulfilled
               ↘ rejected
```
The bot always creates orders directly as `pending_approval`. Only admin server actions can transition status.

### `src/types/order.ts`
```ts
export interface OrderItem {
  product_id: string;
  title: string;
  qty: number;
  unit_price: number;
  sku: string | null;
}

export type OrderStatus = 'pending_approval' | 'approved' | 'rejected' | 'fulfilled';

export interface Order {
  id: string;
  user_ref: string;
  user_name: string | null;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateOrderInput = Omit<Order, 'id' | 'status' | 'created_at' | 'updated_at'>;
```

### Admin UI (`src/app/admin/orders/`)
- List page: shows all orders grouped by status, with `pending_approval` first
- Detail page: shows order items + `user_ref` + notes, with Approve / Reject / Fulfill buttons
- Server Actions use the **service role key** (not the MCP bot role):
  - `approveOrder(id)` — calls `supabase.rpc('approve_order', { p_order_id: id })`; the DB function deducts stock atomically and sets status to `approved`
  - `rejectOrder(id)` — sets status to `rejected` (no stock change)
  - `fulfillOrder(id)` — sets status to `fulfilled` (no stock change)
- RLS: only admins can read/update orders (enforced by the `orders: admin all` policy)

### Prompt instruction for order creation
Add to the prompt template:
```
When a user asks to place an order, call the create_order tool with the list of products
and quantities they specified. Confirm the order details with the user BEFORE calling
the tool. After the order is created, tell the user the order ID and that it is pending
approval by the store.
```

---

## 10. Security

### Layered model

```
[WhatsApp bot]  →  X-Assistant-Secret header  →  /api/assistant route
[Web user]      →  Supabase session cookie     →  sendMessage() Server Action
                                                       ↓
                                               buildPrompt() — service role (read-only queries)
                                                       ↓
                                               MCPAgent (DeepSeek)
                                                       ↓
                                    @modelcontextprotocol/server-postgres
                                    connected as assistant_bot role
                                                       ↓
                                    ┌───────────────────────────────────┐
                                    │  SELECT: products, categories,   │
                                    │         items, content           │
                                    │  EXECUTE: bot_create_order()     │
                                    │  EXECUTE: bot_get_my_orders()    │
                                    │  EXECUTE: bot_get_order_status() │
                                    │  ✗ NO access to other tables     │
                                    │  ✗ NO access to other users'    │
                                    │    orders (enforced in SQL)      │
                                    └───────────────────────────────────┘
```

### Threat table

| Concern | Mitigation |
|---|---|
| Unauthenticated WhatsApp callers | `X-Assistant-Secret` header matched against env var |
| Agent reads another user's orders | `bot_get_my_orders` and `bot_get_order_status` filter by `user_ref` in SQL — no other rows are ever returned |
| Agent writes to tables it shouldn't | `assistant_bot` has no `INSERT`/`UPDATE`/`DELETE` on any table directly |
| Agent runs arbitrary SQL | `@modelcontextprotocol/server-postgres` restricts to what the role can do; `assistant_bot` has no superuser privileges |
| Service role key leaks via MCP | MCP server uses `ASSISTANT_DB_URL` (limited role), not `SUPABASE_SERVICE_ROLE_KEY` |
| Prompt injection | User message is placed last in the prompt behind a clear `## Current Question` boundary; `message` is truncated at 2000 chars |
| Stock over-deduction | `approve_order()` DB function checks `stock >= qty` and raises an exception if not met — rolls back atomically |
| PII (`user_ref` = phone number) | Store only in `chat_messages` and `orders`; never log to console in production |
| Token cost runaway | History capped at last 20 messages; product catalog capped at 100 rows |

---

## 11. Web Chat UI

### Entry point
- New page at `/chat` — **requires login** (redirect to `/login` if unauthenticated, same pattern as other protected pages)
- Uses a **Server Action** (`sendMessage`) — no HTTP exposure, no `ASSISTANT_SECRET` needed
- `userRef` is always `auth.uid()` (Supabase user ID) — no anonymous fallback
- Returns `{ response }` to the client component which appends it to the local message list

### Auth split
| Channel | Auth mechanism | `userRef` value |
|---|---|---|
| WhatsApp bot | `X-Assistant-Secret` header | phone number |
| Web UI | Supabase session (Server Action) | `auth.uid()` (UUID) |

---

## 12. WhatsApp Bot Integration

The external WhatsApp bot (Twilio / Meta Cloud API / other) calls this endpoint:

```
POST https://your-store.com/api/assistant
Content-Type: application/json
X-Assistant-Secret: <ASSISTANT_SECRET>

{
  "message": "¿Tienen zapatillas Nike en talla 42?",
  "userRef": "+573001234567",
  "name": "Juan"
}
```

The bot receives `{ response: "..." }` and sends it back to the user.

---

## 13. Implementation Order

1. **Migrations** — `10_chat_messages.sql` + `11_orders.sql` + `12_assistant_role.sql` + `13_approve_order.sql` → `npx supabase db push`
2. **Set `assistant_bot` password** — via Supabase SQL editor: `ALTER ROLE assistant_bot WITH PASSWORD '...';`
3. **Env vars** — add all vars from Section 8 to `.env.local`; create `.env.local.example`
4. **Types** — `src/types/order.ts`
5. `src/lib/assistant/deepseekProvider.ts`
6. `src/lib/assistant/mcpService.ts`
7. **`mcp.config.json`** — wire `@modelcontextprotocol/server-postgres` with `ASSISTANT_DB_URL`
8. `src/lib/assistant/chatHistory.ts`
9. `src/lib/assistant/contextTopics.ts`
10. `src/lib/assistant/buildPrompt.ts`
11. `src/lib/assistant/prompt.ts`
12. `src/app/api/assistant/route.ts` — WhatsApp endpoint
13. Manual test with `curl` / Postman — verify bot cannot read other users' orders
14. **Admin orders UI** — `src/app/admin/orders/`
15. **Web chat UI** — `src/app/chat/` + Server Action
16. Connect WhatsApp bot

---

## 14. Out of Scope (for now)

- Streaming responses
- Chat history browsable in admin
- Conversation summarization for very long histories
- Webhooks for WhatsApp message delivery status
- Payment link generation from the bot
- Multi-language support (plan is Spanish-only)
