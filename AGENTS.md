<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Store — Agent Guide

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 5 · Supabase (Postgres + Auth + Storage + RLS) · CRISTA formal theme (Playfair Display + Montserrat, hairline borders + soft shadows) + Tailwind CSS 4 · Wompi (payments) · DeepSeek (AI assistant)

Full technical spec: [TECH_SPEC.md](./TECH_SPEC.md)

---

## Commands

| Task | Command |
|------|---------|
| Dev server (port 5000) | `npm run dev` |
| Lint (zero warnings) | `npm run lint:check` |
| Type check | `npm run typecheck` |
| Reset local DB | `npm run db:reset` |

## Required Checks After Changes

- **Database / schema changes**: Edit the existing file in `supabase/migrations/` for that module. Only create a new migration file when adding a brand-new module (use the next available `NN` prefix). Then run `npm run db:reset`.
- **Any code change**: Run `npm run lint:check` (zero warnings allowed).

---

## Architecture

- **Server Components by default** — all pages/layouts are `async` Server Components.
- **Server Actions for all mutations** (`"use server"` files in `src/app/<module>/actions.ts`). No custom API routes for CRUD.
- **No ORM** — use Supabase JS client directly (PostgREST).
- **No extra state management** — use React state + `revalidatePath`.
- **Admin area** — `/admin/*` routes are protected by `requireAdmin()`.

### Auth helpers (`src/lib/auth.ts`)

> ⚠️ This file does NOT start with `"use server"`. Adding it would expose all exports as public RPC endpoints.

| Helper | Use case |
|--------|----------|
| `getUser()` | Read-only pages — returns `null` if unauthenticated |
| `requireAuth()` | Mutation pages — redirects to `/login` if unauthenticated |
| `requireAdmin()` | Admin pages/actions — redirects to `/` if not admin |

### Supabase clients

| Client | File | When to use |
|--------|------|-------------|
| Server | `src/lib/supabase/server.ts` | Server Components, Server Actions, route handlers |
| Browser | `src/lib/supabase/client.ts` | Client Components only |
| Service role | `src/lib/supabase/service.ts` | Bypasses RLS — admin-only server code |

### Server Actions pattern

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth"; // or requireAuth()
import { createClient } from "@/lib/supabase/server";

export async function createFoo(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("foos").insert({ ... });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/foos");
  redirect("/admin/foos");
}
```

### Constants (`src/lib/constants.ts`)

`PAGE_SIZE = 24` · `MAX_TITLE_LENGTH = 120` · `MAX_DESCRIPTION_LENGTH = 2000` · `CART_STORAGE_KEY = "store:cart"` · `GUEST_CHAT_COOKIE = "guest_chat_id"` · `WA_REF_COOKIE = "wa_ref"`

### Feature Flags (`src/lib/flags.ts`)

`isFeatureEnabled(key)` checks the `feature_flags` table. Returns `false` if the key doesn't exist. Server-side only.

Current flags:
- `customizable_products` — gates the entire customization pipeline (editor, cart previews, admin customization-kinds)

Pass the flag value from Server Components as a prop to Client Components. No direct DB call from the client.

---

## Database Conventions

- Migrations: `supabase/migrations/NN_<module>.sql` — zero-padded two-digit prefix, each file is idempotent (`DROP TABLE IF EXISTS … CASCADE` at top). Edit the existing file for a module; only create a new file when adding a brand-new module.
- Every table has `id uuid PK`, `user_id`, `title`, `description`, `tags text[]`, `created_at`, `updated_at`.
- Auto-update trigger: `set_updated_at()` — defined in `01_profiles.sql`, reused everywhere.
- RLS on every table. Admin catalog tables (products, items, orders) use `is_admin` check instead of `auth.uid() = user_id`.
- Accent-insensitive search: generated columns `title_search`, `description_search` (lowercase + unaccent). Query via `.ilike()` on these columns.
- Images stored as `jsonb` array: `[{ url: string, description?: string }]`.

---

## Key Pitfalls

1. **`searchParams` is a Promise in Next.js 16** — always `await searchParams` before destructuring in page components.
2. **`src/lib/auth.ts` has no `"use server"`** — do not add it.
3. **Image `unoptimized`** — use `<Image unoptimized />` for arbitrary user-provided URLs (unknown domains). Configured domains: `*.supabase.co` and `lh3.googleusercontent.com`.
4. **`revalidatePath` before `redirect`** — always call `revalidatePath` first in Server Actions.
5. **Tags normalization** — tags are always comma-split, trimmed, lowercased before storage.
6. **Service client bypasses RLS** — `createServiceClient()` is for admin-only server code (e.g., order approval stored procedures). Never use in client-facing code.
7. **`"use server"` in actions files, not in `src/lib/auth.ts`** — see above.
8. **Chat guest ID validation** — always call `supabase.rpc('user_exists', { p_id: guestId })` before accepting a guest ID to prevent impersonation of authenticated users.
9. **Chat messages use service client** — `chat_messages` has `USING (false)` RLS (no public access). All reads/writes go through `createServiceClient()` in `src/lib/assistant/chatHistory.ts`.

---

## Shared UI Components (`src/app/components/`)

| Component | Purpose |
|-----------|---------|
| `FilterableList` | Search + tag filter + pagination wrapper for list pages |
| `PageHeader` | Page title + action button (e.g. "New item") |
| `Breadcrumb` | Navigation breadcrumbs |
| `ProductCard` | Card tile for product grid |
| `ProductImageCarousel` | Image carousel for product detail |
| `VariantSelector` | Item variant selector with customization support |
| `AddToCartButton` | Client Component — adds item to cart context |
| `BuyNowButton` | Client Component — direct purchase flow |
| `CartDrawer` | Slide-out cart panel |
| `CartIcon` | Cart icon with item count badge |
| `ChatFAB` | Floating action button to open chat |
| `ChatMigration` | Client Component — migrates guest chat to authenticated user on login (rendered in root layout) |
| `AddressModal` | Address form modal for checkout |
| `customization/` | Subfolder: `CustomizationEditor`, `KonvaStage`, types |

---

## Customization Architecture

Products can have customizable variants. The pipeline:

1. **Admin defines customization kinds** (`/admin/customization-kinds`) — schema-driven (JSON schema for transforms)
2. **Product links to a print template** with customization kind
3. **User edits in `CustomizationFlow`** (`/products/[id]`) using a Konva canvas editor
4. **Local persistence**: source image in IndexedDB, metadata in localStorage (7-day TTL)
5. **On order creation**: `persistPendingCustomizations()` uploads assets to Supabase Storage
6. **Saved as `customizations` table** entries linked to order lines

### Key files

| File | Role |
|------|------|
| `src/app/products/[id]/CustomizationFlow.tsx` | Editor UI (Konva canvas) |
| `src/lib/customizations/indexedDb.ts` | Blob storage (source images) |
| `src/lib/customizations/localStore.ts` | Metadata store (transforms, preview) |
| `src/lib/customizations/persist.ts` | Upload to server on order |
| `src/app/actions/customizations.ts` | Server action for file upload |
| `src/app/components/customization/` | Shared editor components |

---

## Chat / Assistant Architecture

The AI assistant supports **multi-channel guest persistence** with automatic migration to authenticated accounts.

### Key concepts

- **`channel` column** on `chat_messages`: `'auth'` (authenticated), `'web_guest'` (browser guest), `'whatsapp'` (WhatsApp bot guest).
- **Guest identity (web)**: client-generated UUID stored in `guest_chat_id` cookie (30-day, non-HttpOnly).
- **Guest identity (WhatsApp)**: bot-generated UUID keyed by phone number.
- **Migration**: on login, `migrateChatSession(guestRef, authUserId)` moves all guest messages to the auth user and logs the mapping in `chat_migration_log`.
- **Lazy linkage (WhatsApp)**: API route checks `chat_migration_log` before processing a message; if the guest was migrated, returns `{ migrated: true, authUserId }` so the bot updates its mapping.

### Files

| File | Role |
|------|------|
| `src/lib/assistant/chatHistory.ts` | `getHistory`, `addMessage(channel)`, `migrateChatSession` |
| `src/lib/assistant/buildPrompt.ts` | Builds LLM prompt — uses DB history for all channels |
| `src/lib/assistant/mcpService.ts` | `generateResponse(prompt, channel)` — blocks order tools for guests |
| `src/app/chat/actions.ts` | `sendMessage(msg, cart, guestId)`, `migrateGuestChat(guestId)` |
| `src/app/actions/chat-migration.ts` | `setWaRefCookie()` — HttpOnly cookie for WhatsApp login flow |
| `src/app/api/assistant/route.ts` | External API (WhatsApp bot) — accepts `channel`, detects migrations |
| `src/app/components/ChatMigration.tsx` | Root-level migration trigger (reads cookie, calls migrate action) |
---

## AI Agent Skills

Invoke via `/frontend-design` and `/supabase-postgres-best-practices` in chat:

| Skill | When to use |
|-------|-------------|
| `frontend-design` | All UI components, pages, layouts — enforces the CRISTA formal/elegant visual language |
| `supabase-postgres-best-practices` | Writing/reviewing queries, schema design, RLS policies, performance |
