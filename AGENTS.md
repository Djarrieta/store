<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Store — Agent Guide

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 5 · Supabase (Postgres + Auth + Storage + RLS) · RetroUI/NeoBrutalism + Tailwind CSS 4

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

`PAGE_SIZE = 24` · `MAX_TITLE_LENGTH = 120` · `MAX_DESCRIPTION_LENGTH = 2000`

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

---

## Shared UI Components (`src/app/components/`)

| Component | Purpose |
|-----------|---------|
| `FilterableList` | Search + tag filter + pagination wrapper for list pages |
| `PageHeader` | Page title + action button (e.g. "New item") |
| `Breadcrumb` | Navigation breadcrumbs |
| `ProductCard` | Card tile for product grid |
| `AddToCartButton` | Client Component — adds item to cart context |
| `CartDrawer` | Slide-out cart panel |

---

## AI Agent Skills

Invoke via `/frontend-design` and `/supabase-postgres-best-practices` in chat:

| Skill | When to use |
|-------|-------------|
| `frontend-design` | All UI components, pages, layouts — enforces RetroUI/NeoBrutalism style |
| `supabase-postgres-best-practices` | Writing/reviewing queries, schema design, RLS policies, performance |
