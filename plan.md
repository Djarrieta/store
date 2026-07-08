# Plan — CRISTA brand as the default theme

Goal: turn the current **NeoBrutalism** default theme into a **formal, traditional, elegant**
theme that matches the CRISTA brand board (`public/default-theme-patterns.jpeg`) and the canonical
logo (`public/logo.jpeg`), tagline *"Naturalmente Tú"*. This is a design-language shift, so several
shared components must be rethought. **Planning only — no implementation in this document.**

> **Scope constraint: UI only, with ONE exception.** Do NOT change functionality, data flow,
> server actions, routing, props contracts, or behavior — **except** the admin-managed **Home hero
> section** (§4), which is the *only* intentional functionality change in this plan. Everything else
> is purely visual (styles, tokens, fonts, layout markup). Component APIs stay the same.

> **Canonical logo**: only `public/logo.jpeg` is approved (the "C" monogram-with-leaf + `CRISTA` +
> `Naturalmente Tú`). The six "IDEAS DE LOGO" variations on the brand board are **not** to be used.
> The logo must be **shown wherever the brand identity is required** (see §5).

---

## 1. Brand tokens (from `default-theme-patterns.jpeg`)

### Palette — exact hex from the board

| Swatch | Hex | Role in theme |
|--------|-----|---------------|
| Ivory / off-white | `#F8F5F0` | `--bg` page background |
| Sand / beige | `#E9DFD1` | `--card` / secondary surface, section bands |
| Sage green | `#AAB7A0` | accent / success, botanical touches |
| Terracotta | `#C47D5A` | warm accent (badges, highlights) |
| Warm brown / taupe | `#6B5648` | `--fg` body text (warm near-black) |
| Golden brown | `#8B6F4D` | `--muted` secondary text, hairlines |
| Burgundy / wine | `#7B1E2E` | **`--accent` primary** (buttons, wordmark, links) |

Derived: `--surface: #FFFFFF` or `#FDFBF7`; primary hover ≈ `#651825` (darker burgundy);
`--border` = hairline in `#E9DFD1` / `#D8CCBB`; `--shadow` = soft translucent brown.

### Typography (confirmed by the board's "TIPOGRAFÍAS" panel)

The board explicitly specifies two families — use these exact fonts, both available on Google Fonts:

| Role | Font | CSS var | Where |
|------|------|---------|-------|
| **Títulos / display** | **Playfair Display** (serif) | `--font-display` | wordmark, `h1–h3`, hero title, product names, page headers |
| **Textos / body** | **Montserrat** (sans) | `--font-sans` | body copy, nav links, buttons, labels, prices, badges |

Load via `next/font/google` in [layout.tsx](src/app/layout.tsx#L17-L25) (replacing `Outfit`/`Inter`):

- `Playfair_Display` → `variable: "--font-display"`, subset `latin`, weights `400/500/600/700`
  (optionally `italic` for the tagline flourish).
- `Montserrat` → `variable: "--font-sans"`, subset `latin`, weights `300/400/500/600`.

The `@theme inline` bindings in [globals.css](src/app/globals.css#L6-L11) already map
`--font-display` / `--font-sans`, so the variable names stay the same — only the imported families
change. Add a base rule so `h1–h3` default to Playfair.

**Tracking / case conventions (from the board):**
- Wordmark `CRISTA` and hero title → Playfair with **wide letter-spacing** (`tracking-[0.2em]`-ish),
  not bold-heavy.
- Nav links and buttons (`VER COLECCIÓN`, `DESCUBRIR`) → Montserrat **uppercase, small tracked,
  medium weight** — elegant, NOT the heavy NeoBrutalism uppercase.
- Body/subline (`ropa para mujeres que florecen`) → Montserrat, light/regular, sentence or small-caps.

### Feel

Airy, minimal, hairline strokes, generous whitespace, soft/no shadows. **No thick black borders,
no hard offset shadows, no yellow, no press-in button effect.**

---

## 2. Current state to reconcile (cleanup first)

These are broken/stale references left after deleting the other themes:

- [globals.css](src/app/globals.css#L1-L5) imports **three deleted files**:
  `ten-lemmon.css`, `3d-cases.css`, `clean-slate.css` → remove these imports.
- [layout.tsx](src/app/layout.tsx#L63) sets `data-theme={process.env.THEME ?? "ten-lemmon"}`
  → default to the single theme (drop `data-theme`, or hardcode `"default"`).
- `.env.local` / `.env.local.example` still document `THEME=ten-lemmon` → update or remove.
- [default.css](src/app/themes/default.css#L3-L5) comments reference the deleted themes → clean up.

---

## 3. Reference web layout (the mock browser on the board)

The board shows the intended storefront chrome — mirror this structure (UI only):

- **Header**: serif `CRISTA` wordmark top-left (or the `logo.jpeg`); to the right, three quiet line
  icons: **search, user, bag** (cart). Below the wordmark, a **horizontal nav row** of uppercase
  small-tracked links: `INICIO · NUEVA COLECCIÓN · VESTIDOS · BLUSAS · BÁSICOS · BOHO EDIT ·
  NOSOTROS · CONTACTO`. (Our real routes differ — keep our actual links, only adopt the *style*.)
- **Hero**: large Playfair headline (`Naturalmente tú`), a short Montserrat subline, and a solid
  **burgundy rectangular button** with uppercase tracked label (`DESCUBRIR` / `VER COLECCIÓN`).
- **Overall**: lots of cream whitespace, thin rules, no cards-with-borders shouting.
- **Slogans** available for copy: *Naturalmente tú · Vestir con calma · Simple. Natural. Femenina.*
  *· La belleza de lo esencial · Romántica por naturaleza.*

---

## 4. Home hero section — admin-managed (the one functionality change)

A new **`Hero`** component for the home page, with content owned by the admin **content module**.

### Data model (reuse the `content` table — no schema migration)

The [content](supabase/migrations/06_content.sql) table is a `key → text value` store. Store the
hero under a single key **`home_hero`** whose `value` is a **JSON string**:

```json
{ "title": "Naturalmente tú", "description": "…", "images": [{ "url": "…" }] }
```

This matches the existing image convention (jsonb `[{ url, description? }]`) used by products, and
needs **no migration** — just a new key. Optionally seed an empty/example `home_hero` in
[supabase/seed/05_content.sql](supabase/seed/05_content.sql).

### Admin editing (in the content module)

The generic content editor ([[key]/edit](src/app/admin/content/[key]/edit/page.tsx)) is a single
textarea — not enough for title + description + image array. Add a **dedicated hero editor**:

- Special-case the `home_hero` key (or a sub-route like `/admin/content/hero`) to render a
  structured form: **title** (`Input`), **description** (`Textarea`), and an **image manager**.
- Reuse the product image pattern: [uploadImage(file, bucket)](src/lib/supabase/storage.ts#L3)
  from a `"use client"` component, appending returned URLs, serialized to a hidden JSON field —
  exactly like [ProductForm.tsx](src/app/components/../admin/products/ProductForm.tsx#L55-L74)
  (bucket: reuse `item-images`, or add a `content-images` bucket in `04_storage.sql`).
- On save, the server action writes the JSON string to `content.value` for `home_hero`
  (extend [content/actions.ts](src/app/admin/content/actions.ts) with a typed hero update, or
  reuse `updateContent` with the pre-serialized value). `revalidatePath("/")` so the home page
  refreshes.

### Public `Hero` component

- New `src/app/components/Hero.tsx` (server component). Read `home_hero` from `content`, parse the
  JSON, and **render only if it exists and has content** (e.g. a title and/or ≥1 image); otherwise
  return `null`.
- Rendered at the top of [src/app/page.tsx](src/app/page.tsx) above the product grid.
- Visual: Playfair title, Montserrat description, burgundy CTA styling, images as a carousel/banner
  (may reuse [ProductImageCarousel.tsx](src/app/components/ProductImageCarousel.tsx) or a simple
  banner) — matching the board's hero. Falls back gracefully to text-only if no images.

---

## 5. Logo usage — show the CRISTA logo where required

Surface `public/logo.jpeg` (via `next/image`, `unoptimized` not needed — it's a local asset)
everywhere the brand identity belongs:

- **Header** ([layout.tsx](src/app/layout.tsx#L66-L78)) — primary placement; logo/wordmark linking home.
- **Favicon / app icon** — derive from the logo (`src/app/icon` or `public/`), plus `metadata`.
- **Login page** ([src/app/login](src/app/login)) — logo above the sign-in form.
- **Auth/empty states & footer** (if present) — small logo mark for brand consistency.
- **Hero fallback** (§4) — optional: when no hero images are set, the logo can anchor the section.
- Keep the logo crisp on cream: it already sits on an ivory background, so no extra plate needed.

> Add a small reusable `Logo` component (image + optional Playfair wordmark) so placements stay
> consistent — presentational only.

---

## 6. Design tokens — `src/app/themes/default.css`

Rewrite the token values. Structure stays the same so components keep reading the same vars.

- **Palette**: apply the exact hex table from §1. Replace `--accent: #ffca3a` (yellow)
  with burgundy `#7B1E2E`; set `--accent-foreground` to ivory (`#F8F5F0`) for light-on-burgundy
  buttons.
- **Structural**: `--border` from pure black → botanical hairline (`#a98d7a` or a soft burgundy
  tint); `--shadow` from `#111` → a soft translucent brown (used with real blur, see below).
- **Gradients** (`--gradient-1/2`): soften to barely-there warm tints, or remove the radial
  glows entirely in [globals.css](src/app/globals.css#L15-L22) for a flatter, formal canvas.
- **Radii**: keep small/refined (traditional = modest rounding, not pill-shaped).
- **Shadows**: the NeoBrutalism `--shadow-btn-*` / `--shadow-card` are hard **offset** values
  (e.g. `2px`,`4px`) consumed as `shadow-[Xpx_Ypx_0_0_var(--shadow)]` (zero blur).
  Formal look needs **soft blurred** shadows. This requires a component change, not just a token
  swap (see §7), because the `_0_0_` (no blur) is hardcoded in class strings.
- **Semantic** (danger/success/warning, error/ok): re-tune to muted, desaturated tones that sit
  well on cream (avoid neon `#86efac` / `#fde047`).

---

## 7. Shared components — remove NeoBrutalism traits (UI only)

The offset-shadow + thick-border + uppercase pattern is hardcoded in class strings (not fully
tokenized), so each of these needs edits. Strategy: replace hard offset shadows with soft blurred
shadows, thin the borders, drop the heavy uppercase/bold styling, apply Playfair to headings.
**Component props/APIs and behavior stay identical.**

- **[Button.tsx](src/app/components/Button.tsx#L54-L74)**
  - `variantClasses`: `border-2 border-[var(--border)]` → hairline `border` (1px) or borderless
    filled burgundy for primary. Primary text becomes ivory. Rectangular/modest radius per board.
  - `shadowClasses`: replace `shadow-[Xpx_Xpx_0_0_...] + hover:translate` (press-in effect) with
    a subtle soft shadow + gentle hover (slight darken/lift). Keep the `shadow` prop API.
  - Lighter weight; elegant uppercase tracking on `lg`/`xl` CTAs (board style).
- **[Badge.tsx](src/app/components/Badge.tsx#L16-L33)** — `border-2` → hairline; drop hard offset
  shadow; softer fills (sage/terracotta/muted) for status variants.
- **[Input.tsx](src/app/components/Input.tsx)** — thin borders, soft burgundy focus ring,
  remove hard shadow; Montserrat label typography.
- **[FormCard.tsx](src/app/components/FormCard.tsx)** — card border/shadow → hairline + soft
  shadow; Playfair heading.
- **[ProductCard.tsx](src/app/components/ProductCard.tsx#L47-L52)** — hardcoded
  `border-4 ... shadow-[6px_6px_0_0_...]` and `rounded-2xl` → hairline border, soft shadow,
  refined radius; product name in Playfair, price in Montserrat.
- **[CartDrawer.tsx](src/app/components/CartDrawer.tsx#L62)** — `border-l-4` +
  `shadow-[-6px_0_0_0_...]` → hairline + soft shadow; dashed-border chips softened.
- **[PageHeader.tsx](src/app/components/PageHeader.tsx)** — heading to Playfair; de-emphasize
  uppercase/bold.
- **[Breadcrumb.tsx](src/app/components/Breadcrumb.tsx)** — quieter, muted styling.
- **[CartIcon.tsx](src/app/components/CartIcon.tsx)**, **[UserMenu.tsx](src/app/components/UserMenu.tsx)**,
  **[ChatFAB.tsx](src/app/components/ChatFAB.tsx)**, **[AddressModal.tsx](src/app/components/AddressModal.tsx)**,
  **[VariantSelector.tsx](src/app/components/VariantSelector.tsx)** — audit each for `border-2/4`,
  `shadow-[..._0_0_...]`, `uppercase`, yellow accents; align to the new language.

> A grep for `border-4|border-2|shadow-\[.*_0_0_|uppercase|rounded-2xl` across `src/app/**`
> is the checklist — every hit is a candidate edit.

---

## 8. Navbar — rethink as a proper nav with accordion (UI only)

Current [NavLinks.tsx](src/app/components/NavLinks.tsx) is just a row of `Button`s (Nosotros /
Admin / Ingresar). The target (board header) is a real store nav.

- **Desktop**: horizontal inline link row under the wordmark, uppercase small-tracked Montserrat,
  burgundy hover/underline — matching the board's `INICIO · NUEVA COLECCIÓN · …` bar. Reuse our
  actual routes; only adopt the styling.
- **Mobile**: a **normal accordion** menu (the explicit request) — a hamburger/trigger that
  expands a vertical collapsible list, replacing any brutalist toggle. Standard accordion
  interaction (expand/collapse a panel), accessible (`button` + `aria-expanded`/`aria-controls`).
- This is presentational only: same links, same auth/admin conditionals, same destinations — no
  routing or data changes. Likely a small `"use client"` component for the accordion open/close
  state; keep server-rendered links inside.
- Header actions (search/user/cart icons) arranged top-right per the board.

---

## 9. Layout & branding — `src/app/layout.tsx`

- **Fonts**: replace `Outfit` (display) + `Inter` (sans) with **`Playfair_Display`** →
  `--font-display` and **`Montserrat`** → `--font-sans` (both via `next/font/google`, with the
  weights/subsets in §1's typography spec). The `@theme inline` `--font-display` / `--font-sans`
  bindings stay valid.
- **Header** ([layout.tsx](src/app/layout.tsx#L66-L78)):
  - Replace the hardcoded wordmark `"Tienda"` with the CRISTA identity — the `Logo` component
    (§5) using `public/logo.jpeg` and/or a Playfair wordmark.
  - Header container `border-4 ... shadow-[6px_6px_0_0_...] rounded-2xl` → hairline + soft shadow.
  - Restructure to wordmark + nav row + action icons (see §3, §8).
- **Metadata** ([layout.tsx](src/app/layout.tsx#L27-L30)): `title: "Tienda"` → `"CRISTA"`,
  description to brand copy (e.g. a slogan). `lang` stays `es`.
- Add a favicon / touch icon derived from `logo.jpeg` (under `public/` or `src/app/icon`).

---

## 10. Global styles — `src/app/globals.css`

- Remove dead `@import` lines (§2).
- Body gradient: remove/soften the two radial glows for a flat cream (`#F8F5F0`) canvas.
- Confirm `--font-display` (Playfair) / `--font-sans` (Montserrat) bindings map after the swap.
- Optionally add a base rule so `h1–h3` default to Playfair.

---

## 11. Content & copy (optional, brand-consistency)

- Seed/content strings still say generic "tienda de ropa" — e.g.
  [supabase/seed/05_content.sql](supabase/seed/05_content.sql#L3) `about_paragraph`.
  Decide whether to update `about_paragraph` and other copy to CRISTA voice / slogans.
  **Out of scope for this pass — flagged for the owner** (the hero content in §4 is the only
  content-related change we implement).

---

## 12. Docs to update (keep guides truthful)

- **[.agents/skills/frontend-design/SKILL.md](.agents/skills/frontend-design/SKILL.md)** — it
  explicitly says components "enforce the **NeoBrutalism** visual language." Rewrite to describe
  the CRISTA formal/traditional language (Playfair + Montserrat, burgundy/ivory, hairlines).
- **[TECH_SPEC.md](TECH_SPEC.md#L1306)** — update the font section (Outfit → Playfair/Montserrat);
  note the new admin-managed `home_hero` content key.
- **[AGENTS.md](AGENTS.md)** — mentions "RetroUI/NeoBrutalism"; update the stack line.

---

## 13. Suggested execution order

1. Cleanup broken theme references (§2) so the app builds cleanly on one theme.
2. Rewrite `default.css` tokens (§6) — get the burgundy/ivory palette live.
3. Swap fonts + header/branding + `Logo` component in `layout.tsx` + `globals.css` (§5, §9, §10).
4. Rebuild the navbar with desktop row + mobile accordion (§8).
5. Update shared components to shed NeoBrutalism traits (§7) — Button/Badge/Input/Card first,
   then the long tail.
6. Build the admin hero editor + public `Hero` component (§4) — the one functionality change.
7. Place the logo everywhere required (§5).
8. Update docs (§12); flag copy/content (§11).
9. `npm run lint:check` (zero warnings) and `npm run typecheck`; visually verify home (with and
   without hero content), product detail, cart drawer, a form page, mobile nav accordion, and admin.

---

## 14. Resolved decisions (from the brand board)

- ✅ **Palette** — exact hex confirmed (§1).
- ✅ **Fonts** — Playfair Display (display) + Montserrat (body).
- ✅ **Logo** — only `public/logo.jpeg`; shown wherever required (§5); ignore the six board "ideas".
- ✅ **Navbar** — desktop inline row + mobile **accordion**.
- ✅ **Hero** — admin-managed via `home_hero` content key; the **only** functionality change (§4).
- ✅ **Scope** — UI only apart from the hero; broader copy/content rebrand deferred (§11).

### Still to confirm

1. **Border philosophy** — hairline borders everywhere, or borderless cards relying on soft shadow?
2. **Header logo form** — image `logo.jpeg`, Playfair wordmark, or both together?
3. **Hero storage shape** — single `home_hero` JSON key (recommended, no migration) vs. three
   separate keys (`hero_title`/`hero_description`/`hero_images`)?
4. **Hero image bucket** — reuse `item-images`, or add a dedicated `content-images` bucket?
5. **Nav link set** — keep current routes styled per board (no routing change), or add the board's
   category links (Vestidos/Blusas/…) — the latter needs real routes, so out of scope unless asked.
