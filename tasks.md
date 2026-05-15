# Store Project — Pre-Implementation Review

Issues found in the tech spec before translating it into concrete tasks.
Grouped by type: Contradictions, Missing Parts, Ambiguous Topics.
**Resolve these before implementation begins.**

---

## CONTRADICTIONS

**C-01 — Next.js version** ✅ RESOLVED
Next.js 16.x is correct (user-confirmed).

**C-02 — `name` vs `title` inconsistency** ✅ RESOLVED
Use `title` everywhere. Spec updated.

**C-03 — Text forced to lowercase in server actions** ✅ RESOLVED
Stored value keeps original casing; lowercase only inside the generated `*_search` column. Spec updated.

**C-04 — Storage migration number hard-coded** ✅ RESOLVED
Replaced with generic `NN_` prefix; numbering decided at write time. Spec updated.

**C-05 — `tags` field not in standard template but referenced everywhere** ✅ RESOLVED
Added `tags text[] NOT NULL DEFAULT '{}'` to the standard table template (§5), to the common-columns table, and to the base `<Entity>` type (§11). Removed the duplicate from the recipes example positioning (now follows the standard order: title/description/tags/images then module-specific). Spec updated.

**C-06 — `"use server"` at top of `src/lib/auth.ts`** ✅ RESOLVED
Removed `"use server"` from `src/lib/auth.ts` and added a note in §6 explaining these are server-only utility functions, not Server Actions. Spec updated.

**C-07 — `description_search` referenced but never created** ✅ RESOLVED
Added a second `ALTER TABLE … ADD COLUMN description_search …` to both §9 (generic) and §10 (recipes example), using `coalesce(description, '')` to handle nullable descriptions. Spec updated.

**C-08 — Pagination snippet drops the count** ✅ RESOLVED
Replaced `const [{ data, count }] = await Promise.all([query.range(...).returns<Recipe[]>()])` with a plain `const { data, count } = await query.range(...).returns<Recipe[]>()`. Spec updated.

**C-09 — `db-reset` execution order vs file numbering** ✅ RESOLVED
Updated §5 to require **zero-padded two-digit prefixes** (`01_…` through `99_…`) so alphabetical sort matches numeric order. Spec updated.

---

---

## MISSING PARTS

**M-01 — Items schema not defined**
The spec is generic. For a store `items` table we need to decide which domain-specific columns to add. Candidates: `price` (numeric), `sku` (text), `stock` (integer), `category` (text or FK). None appear in the spec.

**M-02 — Price / currency handling**
No guidance on the data type for price (`numeric(10,2)`, integer cents, etc.) or whether currency is stored per-item or is global. This affects DB schema, TypeScript type, form input, and display formatting.

**M-03 — Who can create / manage items (roles)**
The spec assumes any authenticated user can create entities (`auth.uid() = user_id`). A store usually has **admin-only** product management and **public** browsing. There is no concept of roles or admin guards. Decision needed: open marketplace (anyone can list) vs. admin-only catalog.

**M-04 — RetroUI / shadcn setup not covered**
You want to use [RetroUI](https://retroui.dev/docs) (shadcn-based) instead of the custom Tailwind theming in the spec. RetroUI targets **Tailwind v3** with shadcn conventions, but the spec uses **Tailwind v4** (`@tailwindcss/postcss`, `@theme {}` blocks). This is a potential hard conflict. Need to verify RetroUI's Tailwind version requirement and resolve before the project is bootstrapped.

**M-05 — Homepage content undefined**
The spec mentions `app/page.tsx` as "Landing / home page" with no further detail. For the store homepage we need to decide what it shows: latest items grid? hero banner? category navigation? This drives the initial query and layout.

**M-06 — No seed data for items**
The spec mentions a `seed@app.local` dev user but no seed items. Without seed data the homepage will be empty on first run, making verification impossible without manual data entry.

**M-07 — `EntityImage.description` is required, not optional**
The `EntityImage` interface defines `description: string` (non-nullable). For product images in a store a per-image description may be optional. Should be `description?: string`.

**M-08 — Constants values never specified** 🔴 NEW
`MAX_TITLE_LENGTH`, `MAX_DESCRIPTION_LENGTH`, `PAGE_SIZE` are imported across actions, forms, and list pages, but their numeric values are nowhere in the spec. Need defaults (suggested: 120 / 2000 / 24).

**M-09 — `package.json` scripts not defined** 🔴 NEW
The spec mentions `npm run db:reset` but never lists the expected `scripts` block (`dev`, `build`, `start`, `lint`, `db:reset`, `db:start`, `db:stop`, `typecheck`).

**M-10 — Google OAuth provider configuration not covered** 🔴 NEW
Spec shows `signInWithOAuth({ provider: 'google' })` and the callback handler, but does not document:
- Registering the OAuth client in Google Cloud Console
- Authorized redirect URI (`http://127.0.0.1:5002/auth/v1/callback` locally + production)
- `[auth.external.google]` block in `supabase/config.toml`
- Required env vars (`SUPABASE_AUTH_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_GOOGLE_SECRET`)

Without this, OAuth won't work even though the client code is correct.

**M-11 — Sign-out flow not specified** 🔴 NEW
`UserMenu` is described as "Avatar + dropdown with logout" but the spec never shows the `supabase.auth.signOut()` call, which client (browser vs. server action) it runs on, or post-logout redirect.

**M-12 — No login page example** 🔴 NEW
`src/app/login/page.tsx` is in the file tree but has no code example. Needs at least the OAuth button, callback URL construction, and the dev-login button gated on `NODE_ENV`.

**M-13 — Seed-user creation not documented** 🔴 NEW
Dev login uses `seed@app.local / password123`. The spec does not show how this user is created (SQL insert in `seed.sql`? `supabase auth users create`?). Without it, dev login fails on a fresh DB.

**M-14 — Storage bucket name convention vs. one-bucket-per-module** 🔴 NEW
§8 names buckets `<module>-images`. With only an `items` module that means one bucket `items-images`. Fine, but the per-module bucket policies (`public_read_<module>_images`, etc.) need to be created somewhere — the storage migration is described once but not made part of the per-module checklist as a required step. The "Quick Reference" lists it as **(Optional)** — but for items it's required.

**M-15 — Missing `display_name` and `email` on `Profile` type** 🔴 NEW
`src/types/index.ts` is described as "Re-exports + Profile type", but the `Profile` type itself is never defined. Used as `profile?: { display_name; avatar_url }` inline — no exported type.

---

## AMBIGUOUS TOPICS

**A-01 — RetroUI dark/light theme vs. spec's dark-only theme**
The spec is dark-theme only. RetroUI has its own theming conventions. Do you want dark-only, or use RetroUI's default (which may include both modes)?

**A-02 — Google OAuth only vs. email/password**
The spec implements Google OAuth + a dev password login. For production, should real users be able to register with **email/password**, or is Google OAuth the only sign-in method?

**A-03 — Public read scope for items**
The default RLS is `FOR SELECT USING (true)` — fully public. This is fine for browsing product names and prices. But if items ever include cost price or internal stock notes, those need a separate restricted policy. For now, are all item fields public?

**A-04 — `?mine=1` filter relevance for a store**
The list page has a `?mine=1` filter to show only the current user's items. In a marketplace this makes sense. In an admin-managed catalog it doesn't. Should this filter be included?

**A-05 — Image source: upload to Supabase vs. external URL**
The spec supports both uploading files to Supabase Storage and storing arbitrary external URLs. For store product images, should uploads be the only method (controlled), or can admins also paste external URLs?

**A-06 — Tags vs. categories**
The spec uses a free-form `text[]` tags array. For a store, "categories" are usually a fixed/controlled list (Electronics, Clothing, etc.). Should items use free-form tags, a fixed enum, or a separate `categories` table?

**A-07 — Middleware route protection**
The spec's middleware only refreshes the session — it does not block routes. Protected pages depend on `requireAuth()` inside the page component. Should the middleware also block unauthenticated access to `/items/new` and `/items/[id]/edit` at the edge?

**A-08 — Stale profile data**
`ensureProfile` uses `ignoreDuplicates: true`, so after first login the profile is never updated. If a user changes their Google name/avatar the stored profile will be stale indefinitely. Is this acceptable?

**A-09 — Image deletion when removed from an entity** 🔴 NEW
When a user removes an image from an entity (or deletes the entity), the spec uploads to Supabase Storage but never removes the storage object. Should orphaned images be deleted (storage delete in the same action), or is leaking acceptable for now?

**A-10 — `revalidatePath` granularity** 🔴 NEW
Server actions revalidate `/<entities>` (the list) but not `/<entities>/[id]`. After an `update` the detail page is not revalidated. Acceptable, or should we add `revalidatePath('/<entities>', 'layout')` / explicit detail revalidation?

**A-11 — `db.major_version = 17` vs Supabase hosted** 🔴 NEW
Local config pins Postgres 17. Supabase hosted projects may default to a different major. If the project will be deployed to hosted Supabase, the version needs to match (or migrations need to be tested against both).

**A-12 — Single image-upload entrypoint** 🔴 NEW
The upload helper takes a `bucket` argument but doesn't enforce content-type or size limits. Should the spec require client-side validation (max KB, MIME whitelist) for product images? RLS doesn't restrict upload size by default.

**A-13 — Profile `handle_new_user` trigger duplicates `ensureProfile` upsert** 🔴 NEW
The DB trigger inserts a profile row on auth.users insert, AND `requireAuth()` calls `ensureProfile()` which upserts on every authenticated request. The double write is harmless with `ignoreDuplicates`, but it's a redundancy worth confirming. Is the trigger enough on its own, or do we keep both as belt-and-suspenders?

---

## DECISIONS NEEDED (open items)

| ID | Question | Notes |
|----|----------|-------|
| C-05 | Tags in standard template? | Add to §5 OR remove from §13/§16 |
| C-06 | Fix `"use server"` in auth.ts | Drop directive OR split actions out |
| C-07 | `description_search` column | Add migration OR drop from query |
| C-08 | Fix pagination snippet | Drop `Promise.all`/`.returns<>()` |
| C-09 | Migration ordering scheme | Zero-pad NN to fixed width |
| M-01 | Items extra columns | price, sku, stock, category? |
| M-02 | Price data type | `numeric(10,2)` vs integer cents |
| M-03 | Who manages items | Open marketplace OR admin-only |
| M-04 | RetroUI + Tailwind v4 | Verify compatibility (BLOCKER) |
| M-05 | Homepage content | Latest items / hero / categories |
| M-06 | Seed items | How many, what shape |
| M-07 | `EntityImage.description` optional | Make nullable |
| M-08 | Constants values | MAX_TITLE / MAX_DESCRIPTION / PAGE_SIZE defaults |
| M-09 | `package.json` scripts | Define dev/build/lint/db:reset/etc. |
| M-10 | Google OAuth setup | Document Console + config.toml + env vars |
| M-11 | Sign-out flow | Where does signOut live |
| M-12 | Login page example | Provide reference implementation |
| M-13 | Seed user creation | SQL insert vs CLI command |
| M-14 | Items needs storage bucket | Promote from "optional" to required for items |
| M-15 | `Profile` type definition | Export single canonical type |
| A-01 | Theme mode | Dark-only or RetroUI default |
| A-02 | Auth methods | Google-only or also email/password |
| A-03 | Item field privacy | All public? Hide cost/stock? |
| A-04 | `?mine=1` on items | Keep or drop |
| A-05 | Image source | Upload only OR external URL allowed |
| A-06 | Tags vs categories | Free-form vs controlled |
| A-07 | Middleware route guards | Edge protection or per-page only |
| A-08 | Refresh stale profile | Update on each login? |
| A-09 | Orphan image cleanup | Delete on removal / on entity delete? |
| A-10 | Revalidate detail pages | Add explicit detail revalidate? |
| A-11 | Postgres version match | Local 17 vs hosted default |
| A-12 | Upload validation | Size/MIME limits on client? |
| A-13 | Profile trigger + upsert | Keep both or drop one |
