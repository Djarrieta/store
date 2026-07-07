---
name: frontend-design
description: Create bold, production-grade UI aligned with this project visual language.
---

When working on UI in this repository, follow these rules:

- Build expressive, intentional interfaces. Avoid default boilerplate layouts.
- Respect the CRISTA formal visual language (see below) defined in `src/app/globals.css`, `src/app/themes/default.css`, and shared components.
- Prefer reusable components in src/app/components before adding one-off markup.
- Keep pages responsive across mobile and desktop.
- Use accessible semantics (headings, labels, button text, alt text).
- Keep motion purposeful and lightweight.
- Avoid introducing new design systems unless explicitly requested.

## CRISTA visual language

CRISTA (“Naturalmente tú”) is a formal, elegant, natural/botanical women's clothing brand. The UI is refined and understated — **not** heavy or brutalist:

- **Borders**: hairline (`border`, `border-b`, `border-t`) using `--border`. Never thick (`border-2`+) borders except functional cases (e.g. spinner rings).
- **Shadows**: soft, blurred — `shadow-[var(--shadow-soft-sm)]`, `shadow-[var(--shadow-soft)]`, `shadow-[var(--shadow-soft-lg)]`. Never hard offset shadows.
- **Palette**: ivory/warm-neutral surfaces (`--bg`, `--card`, `--surface`) with a burgundy accent (`--accent`) and ivory accent text.
- **Typography**: Playfair Display for headings (`font-display`, `font-medium tracking-tight`) and Montserrat for body (`font-sans`). Avoid heavy `font-bold` uppercase treatments.
- **Buttons**: primary is a filled burgundy button with ivory text; secondary is a hairline outline. No press-in translate effects.

## Reusable Components — ALWAYS prefer these over raw HTML

Never use raw HTML elements when a reusable component exists. The components below
live in `src/app/components/` and enforce the CRISTA visual language.

### `Button` (`Button.tsx`)
- **Replaces**: `<button>`, `<a>` used as a button, inline `<Link>` styled as a button.
- Renders as `<button>` or Next.js `<Link>` depending on whether `href` is passed.
- Props: `variant` (`primary` | `secondary` | `ghost` | `danger` | `success`), `size` (`sm` | `md` | `lg` | `xl` | `icon`), `shadow`, `fullWidth`, `confirm`, `loading`.
- Use `confirm` for destructive actions (shows "¿Seguro?" on first click).
- Never use a raw `<button>` or styled `<a>` / `<Link>` that acts as a button.

### `Badge` (`Badge.tsx`)
- **Replaces**: `<span>` used as a status chip or tag label.
- Props: `variant` (`primary` | `secondary` | `danger` | `success` | `warning` | `muted`), `size` (`sm` | `md` | `lg`), `shadow`, `className`.
- Use for status indicators, tags, stock labels, etc.
- Never use a raw `<span>` with manual border/background/padding to mimic a badge.

### `Input`, `Textarea`, `Select` (`Input.tsx`)
- **Replaces**: `<input>`, `<textarea>`, `<select>`.
- All accept a `label` prop that wraps the field in a styled `<label>` — no need for a separate label element.
- Also accept `shadow`, `fullWidth` (default `true`).
- Exception: `<input type="hidden">` should remain a raw element (styles are irrelevant).

### `FormCard` + `FormActions` (`FormCard.tsx`)
- **Replaces**: plain `<form>` with manual card styling, and `<div>` button rows at the bottom of forms.
- `FormCard` wraps a `<form>` in the CRISTA card style; pass `action` directly.
- `FormActions` is the button row wrapper inside a form.

### `PageHeader` (`PageHeader.tsx`)
- **Replaces**: manual `<section>` + `<h1>` + create-button patterns at the top of list pages.
- Props: `title`, `createHref`, `createLabel`, `isEmpty`, `emptyText`, `children`.

### `Breadcrumb` (`Breadcrumb.tsx`)
- **Replaces**: manual breadcrumb `<nav>` markup.
- Pass an array of `{ label, href? }` items; the last item is rendered as plain text.

### `FilterableList` (`FilterableList.tsx`)
- **Replaces**: manual search + tag filter + pagination composition on list pages.

### `ProductCard` (`ProductCard.tsx`)
- **Replaces**: one-off product tile markup. Pass `product` + optional `items` array.

### `AddToCartButton` / `BuyNowButton`
- **Replaces**: custom cart/buy buttons. Use these for all add-to-cart and buy-now actions.

---

Implementation guidance:

- For page composition: prefer server components where possible.
- For forms and interactions: isolate client logic in "use client" components.
- Keep class names readable and grouped by layout, spacing, and state.
- Reuse existing patterns from ItemCard, ItemForm, PageHeader, and FilterableList.
