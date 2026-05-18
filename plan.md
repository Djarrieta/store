# Theme Switching Plan

## Overview

Add a `THEME` environment variable (server-side only, no `NEXT_PUBLIC_` prefix) that controls which CSS custom-property palette the app loads at startup. Supported values:

- `ten-lemmon` — warm citrus/lemon NeoBrutalism (default; closest to the current palette)
- `3d-cases` — bolder, more vivid palette aimed at a phone-case product line

The theme is baked in at **server render time** via a `data-theme` attribute on `<html>`. No client-side switching, no JavaScript color toggling — pure CSS.

---

## Open Questions (decide before implementing)

1. **Exact palettes** — the token values below are placeholders. Confirm or replace:

   | Token       | `ten-lemmon`       | `3d-cases`         |
   |-------------|--------------------|--------------------|
   | `--bg`      | `#f5f0e7` (warm beige) | `#f0f4ff` (cool off-white) |
   | `--fg`      | `#111111`          | `#0a0a1a`          |
   | `--card`    | `#fff9ee`          | `#ffffff`          |
   | `--muted`   | `#5c564d`          | `#4a4a7a`          |
   | `--accent`  | `#ffca3a` (lemon yellow) | `#ff3cac` (hot pink / neon) |
   | body gradient | warm yellows + pinks | cool purples + blues |

2. **Shadow color** — NeoBrutalism shadows are currently hardcoded to `#111` throughout `Button.tsx`, `FormCard.tsx`, and layout. For `3d-cases`, should the shadow stay black or become a dark version of the accent?

3. **Fallback** — what should the default theme be when `THEME` is unset? (Suggested: `ten-lemmon`)

---

## Files to Change

### 1. `.env.local.example`
Add one line in the "App" section:
```
# UI theme: "ten-lemmon" | "3d-cases"
THEME=ten-lemmon
```
(`.env.local` is gitignored — each developer/deployment sets this separately.)

### 2. `src/app/globals.css`
Restructure theme tokens:

- Remove the bare `:root` block that defines the five CSS variables.
- Add two `[data-theme]` blocks, one per theme, each defining `--bg`, `--fg`, `--card`, `--muted`, `--accent`.
- Keep a `:root` fallback that mirrors `ten-lemmon` in case `data-theme` is ever absent.
- Move the `body {}` radial-gradient background into per-theme rules (or use `[data-theme] body` selectors) so the gradient also switches.

```css
/* ── Fallback (mirrors ten-lemmon) ───────────────────────── */
:root {
  --bg: #f5f0e7;
  --fg: #111111;
  --card: #fff9ee;
  --muted: #5c564d;
  --accent: #ffca3a;
}

/* ── ten-lemmon ─────────────────────────────────────────── */
[data-theme="ten-lemmon"] {
  --bg: #f5f0e7;
  --fg: #111111;
  --card: #fff9ee;
  --muted: #5c564d;
  --accent: #ffca3a;
}

[data-theme="ten-lemmon"] body {
  background:
    radial-gradient(circle at 10% 10%, #fff2c6 0, transparent 25%),
    radial-gradient(circle at 90% 90%, #ffd7ce 0, transparent 25%),
    var(--bg);
}

/* ── 3d-cases ───────────────────────────────────────────── */
[data-theme="3d-cases"] {
  --bg: #f0f4ff;
  --fg: #0a0a1a;
  --card: #ffffff;
  --muted: #4a4a7a;
  --accent: #ff3cac;
}

[data-theme="3d-cases"] body {
  background:
    radial-gradient(circle at 10% 10%, #d4e0ff 0, transparent 25%),
    radial-gradient(circle at 90% 90%, #ffc8f0 0, transparent 25%),
    var(--bg);
}
```

The rest of `globals.css` (`@import "tailwindcss"`, `@theme inline`, `button`, `.font-display`) stays unchanged.

### 3. `src/app/layout.tsx`
Read the env var in the async Server Component and pass it to `<html data-theme>`:

```tsx
const theme = (process.env.THEME ?? "ten-lemmon") as string;

// in JSX:
<html lang="es" data-theme={theme} className={`${outfit.variable} ${inter.variable} antialiased`}>
```

No import needed — `process.env` is available everywhere server-side.

---

## What Does NOT Change

- All component-level class names (`bg-[var(--accent)]`, `text-[var(--muted)]`, etc.) already use CSS variables — they pick up the new values automatically.
- Hardcoded shadow colors (`#111`) in `Button.tsx` and layout headers stay black for now. This can be a follow-up if `3d-cases` needs a different shadow tone.
- Tailwind's `@theme inline` block in `globals.css` maps `--color-background` and `--color-foreground` — it reads from CSS variables, so it inherits the theme automatically.

---

## Implementation Order

1. Decide final palette values (fill in the table above).
2. Update `.env.local.example`.
3. Refactor `globals.css` with the two `[data-theme]` blocks.
4. Update `layout.tsx` with `data-theme={theme}`.
5. Set `THEME=3d-cases` in local `.env.local`, restart dev server, and visually verify.
6. Run `npm run lint:check` and `npm run typecheck` — both must pass with zero warnings/errors.

---

## Known Limitations

- **Build-time only**: switching themes requires a server restart (or re-deploy). There is no runtime/user-selectable toggle.
- **Hardcoded shadow `#111`**: NeoBrutalism offsets in `Button`, `Badge`, `FormCard`, and the nav header are hardcoded. They will look fine on `ten-lemmon`; for `3d-cases` a very dark `--fg` keeps them readable.
- **RetroUI component styles**: If any RetroUI library classes inject their own color variables, those may not be overridden by this approach — audit after first render.
