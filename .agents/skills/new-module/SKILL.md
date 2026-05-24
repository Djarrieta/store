---
name: new-module
description: Scaffold a complete new domain module (migration, types, server actions, list/detail/edit/new pages) following the conventions in TECH_SPEC §10. Use when the user asks to "add a new module", "scaffold X", "create a new entity/resource", or describes a brand-new CRUD domain that doesn't exist yet in `src/app/`. Do NOT use for modifying or extending existing modules.
---

# New Module Scaffolding

Full reference: [TECH_SPEC.md §10](../../../TECH_SPEC.md#10-creating-a-new-module-step-by-step). This skill is the executable workflow — read TECH_SPEC §10 once before generating files, then follow the steps below.

## Step 1 — Clarify

Before writing any file, ask the user (single message, batched):

1. **Module name** — singular noun, kebab-case (e.g. `recipe`, `print-template`). The DB table is the plural snake_case form (`recipes`).
2. **Ownership model** — pick one:
   - `admin` → admin-managed catalog (like products, items, categories). RLS uses `is_admin(auth.uid())`. Actions call `requireAdmin()`. Lives under `/admin/<plural>/`.
   - `user` → user-owned data (like addresses, orders). RLS uses `auth.uid() = user_id`. Actions call `requireAuth()`. Lives under `/<plural>/` or `/perfil/<plural>/`.
3. **Features** (yes/no each):
   - Images column (`jsonb`, with `<Module>Image` sub-type)?
   - Searchable (adds `title_search` / `description_search` to `03_unaccent_search.sql`)?
   - Belongs to a parent entity (FK + `<Module>With<Parent>` joined type)?
4. **Module-specific columns** — list each as `name: pg_type` (e.g. `price: numeric`, `stock: integer`, `slug: text unique`).

Do not guess any of these. If the user gave the info already, skip the question.

## Step 2 — Plan (use `manage_todo_list`)

Create todos for every step below, then execute one at a time.

## Step 3 — Migration

Create `supabase/migrations/NN_<plural>.sql` using the next available `NN` prefix (check existing files in `supabase/migrations/`). Follow [.github/instructions/migrations.instructions.md](../../../.github/instructions/migrations.instructions.md):

- Start with `DROP TABLE IF EXISTS public.<plural> CASCADE;`
- Standard columns: `id`, `user_id`, `title`, `description`, `tags`, `created_at`, `updated_at`
- Add `images jsonb NOT NULL DEFAULT '[]'::jsonb` if requested
- Add module-specific columns from Step 1
- Attach `set_updated_at()` trigger
- Enable RLS + policies matching the ownership model (admin vs user)

If **searchable**: append the generated `*_search` columns to `supabase/migrations/03_unaccent_search.sql` (do not put them in the module migration).

## Step 4 — Types

Create `src/types/<module>.ts` per [.github/instructions/types.instructions.md](../../../.github/instructions/types.instructions.md):

- Base `interface <Module>` mirroring DB columns (snake_case, `T | null` for nullables)
- `<Module>Image` sub-type if images column exists
- `<Module>With<Relation>` joined shape with a `.select()` comment if FK
- `Create<Module>Input` via `Omit` (exclude `id`, `created_at`, `updated_at`, and DB-generated columns)
- `Update<Module>Input = Partial<Create<Module>Input>`

Add the barrel export to [src/types/index.ts](../../../src/types/index.ts), keeping alphabetical order.

## Step 5 — Server Actions

Create `src/app/<plural>/actions.ts` (or `src/app/admin/<plural>/actions.ts` for admin modules) per [.github/instructions/server-actions.instructions.md](../../../.github/instructions/server-actions.instructions.md):

- `"use server"` at the top
- Export `create<Module>`, `update<Module>`, `delete<Module>` — each starts with `requireAdmin()` or `requireAuth()`
- Parse `FormData`: title/description trimmed and sliced to `MAX_TITLE_LENGTH` / `MAX_DESCRIPTION_LENGTH`; tags comma-split + trim + lowercase + filter; images via `JSON.parse`
- Throw on Supabase error; call `revalidatePath` **before** `redirect`

## Step 6 — Pages

Create the four-page set under `src/app/<plural>/` (or `src/app/admin/<plural>/`):

| File | Purpose |
|------|---------|
| `page.tsx` | List — wrap in `FilterableList`; `await searchParams` (Promise in Next 16) |
| `[id]/page.tsx` | Detail — Server Component, `await params` |
| `[id]/edit/page.tsx` | Edit form — reuses `<Module>Form` |
| `new/page.tsx` | Create form — reuses `<Module>Form` |
| `<Module>Form.tsx` | Shared form, uses `FormCard`, `Input`, `Textarea`, `Button` from `src/app/components/` |
| `<Module>Card.tsx` | Card tile for list (skip if using `ProductCard` or similar) |

All UI must follow the `frontend-design` skill — use reusable components from `src/app/components/`, never raw `<button>` / `<input>` / `<span>` badges.

For admin modules, also add a nav entry in [src/app/admin/AdminNav.tsx](../../../src/app/admin/AdminNav.tsx).

## Step 7 — Verify

Run in order, fix issues before moving on:

1. `npm run db:reset` — applies the migration and verifies SQL.
2. `npm run typecheck` — catches type drift between migration, types, and actions.
3. `npm run lint:check` — zero warnings required.

## Completion criteria

- Migration file exists, idempotent, with correct RLS for the chosen ownership model.
- Type file created and re-exported from `src/types/index.ts`.
- Server actions file uses the correct auth helper and follows the FormData parsing pattern.
- All four page files exist and render without TypeScript or lint errors.
- `db:reset`, `typecheck`, and `lint:check` all pass.
- Admin modules have a nav entry in `AdminNav.tsx`.

## Pitfalls — verify each before reporting done

- `searchParams` and `params` are **Promises** in Next.js 16 — must be `await`ed.
- Generated `*_search` columns must **not** appear in the TypeScript interface.
- Service-role client (`createServiceClient`) is not used by default — only if the user explicitly needs to bypass RLS for an admin RPC.
- `revalidatePath` always comes **before** `redirect`.
- For user-owned modules with a `user_id` default of `auth.uid()`, you can still pass `user_id` explicitly in the insert — both work, but stay consistent with the existing modules in the same ownership class.
