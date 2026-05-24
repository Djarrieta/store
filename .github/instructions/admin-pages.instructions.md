---
applyTo: "src/app/admin/**/page.tsx"
---

# Admin Page Conventions

Admin pages are **Server Components** rendered inside [src/app/admin/layout.tsx](../../src/app/admin/layout.tsx), which already calls `requireAdmin()`. Do not repeat it in the page — but Server Actions invoked from the page **must** still call `requireAdmin()` themselves (the layout guard does not protect actions).

## Page shape

```tsx
import Button from "@/app/components/Button";
import FilterableList from "@/app/components/FilterableList";
import PageHeader from "@/app/components/PageHeader";
import { PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Foo } from "@/types";

import { deleteFoo } from "./actions";

export default async function AdminFoosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tags?: string; page?: string }>;
}) {
  const { q, tags: tagsParam, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const activeTags = (tagsParam ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const supabase = await createClient();
  let query = supabase
    .from("foos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    const term = `%${q.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}%`;
    query = query.or(`title_search.ilike.${term},description_search.ilike.${term}`);
  }
  if (activeTags.length > 0) query = query.contains("tags", activeTags);

  const { data: rawFoos, count } = await query.range(from, to);
  const foos = rawFoos as Foo[] | null;
  const total = count ?? 0;

  return (
    <PageHeader
      title="Gestionar foos"
      createHref="/admin/foos/new"
      createLabel="Nuevo foo"
      isEmpty={total === 0 && !q && activeTags.length === 0}
      emptyText="Aún no hay foos."
    >
      <FilterableList q={q} tags={tagsParam} page={page} total={total} pageSize={PAGE_SIZE}>
        {/* list rows */}
      </FilterableList>
    </PageHeader>
  );
}
```

## Rules

- **`searchParams` and `params` are Promises** in Next.js 16 — always `await` before destructuring.
- **No `requireAdmin()` in `page.tsx`** — the admin layout already enforces it. Add it only to Server Actions and to non-admin pages.
- **`PageHeader` + `FilterableList`** for every list page. Use the [PAGE_SIZE](../../src/lib/constants.ts) constant — never hardcode `24`.
- **Server-side Supabase client** only (`@/lib/supabase/server`). Never import the browser client here.
- **Type-cast destructured data** as `T | null` — do not use the deprecated `.returns<T>()`.
- **Search** uses `title_search` / `description_search` generated columns with `.ilike()`, with the term normalized (`.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`).
- **Tag filter** uses `.contains("tags", activeTags)`.
- **Pagination** uses `.range(from, to)` with `count: "exact"` in `.select`.

## Inline delete forms

Delete buttons in list rows use a form that wraps a Server Action — never a client `onClick`. Use the [`Button`](../../src/app/components/Button.tsx) component with `confirm` for destructive actions:

```tsx
<form
  action={async () => {
    "use server";
    await deleteFoo(foo.id);
  }}
>
  <Button variant="danger" size="sm" shadow type="submit" confirm>
    Eliminar
  </Button>
</form>
```

Edit links use `<Button href={...} variant="secondary" size="sm" shadow>`.

## Create / Edit / Detail pages

| File | Notes |
|------|-------|
| `new/page.tsx` | Renders `<FooForm action={createFoo} />` |
| `[id]/edit/page.tsx` | Fetches the row server-side, renders `<FooForm foo={foo} action={updateFoo} />` — return [`notFound()`](https://nextjs.org/docs/app/api-reference/functions/not-found) on 404 |
| `[id]/page.tsx` | Detail view, no admin-specific layout shell beyond the inherited `AdminNav` |

## UI components

All visual elements must come from `src/app/components/` (`Button`, `Badge`, `Input`, `Textarea`, `Select`, `FormCard`, `Form`, `PageHeader`, `FilterableList`, `Breadcrumb`). Never use raw `<button>`, `<input>`, `<select>`, `<textarea>`, or `<span>` styled as a badge. See the `frontend-design` skill for the full component catalog.

## Nav

After adding a new admin module, register its top-level entry in [src/app/admin/AdminNav.tsx](../../src/app/admin/AdminNav.tsx).
