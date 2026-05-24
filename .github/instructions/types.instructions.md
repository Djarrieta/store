---
applyTo: "src/types/*.ts"
---

# Type File Conventions

One file per domain module, named `<module>.ts` (kebab-case for multi-word, e.g. `print-template.ts`). Ambient third-party declarations use `.d.ts` (e.g. `wompi.d.ts`) and are **not** re-exported from `index.ts`.

## Required shape per module

```ts
// 1. Base interface — mirrors DB columns exactly (snake_case, nullable as `T | null`)
export interface Foo {
  id: string;                       // uuid → string
  user_id: string;                  // when present in the table
  title: string;
  description: string | null;       // nullable column
  tags: string[];                   // text[]
  images: FooImage[];               // when the table has an images jsonb column
  created_at: string;               // timestamptz → string
  updated_at: string;
}

// 2. Images sub-type (only if the table stores images)
export interface FooImage {
  url: string;
  description?: string;
}

// 3. Joined shape(s) — name as `FooWith<Relation>`, include a comment with the .select() string
// Fetched via: .select('*, bar:bar_id(*)')
export interface FooWithBar extends Foo {
  bar: Bar | null;
}

// 4. Input types for Server Actions
export type CreateFooInput = Omit<Foo, "id" | "created_at" | "updated_at">;
export type UpdateFooInput = Partial<CreateFooInput>;
```

## Rules

- **DB columns are snake_case** in the base interface — never camelCase. They must match the migration exactly.
- **Nullable columns** use `T | null`, not `T | undefined` and not `T?`.
- **Timestamps and uuids** are typed as `string`.
- **Numbers** (`price`, `stock`, `discount`) are `number` — booleans are `boolean`.
- **Joined shapes** always `extends` the base and document the `.select()` string in a comment above.
- **Input types** are derived with `Omit` + `Partial` — never re-declare the fields.
- **`CreateFooInput`** excludes `id`, `created_at`, `updated_at` (and any DB-generated columns like `*_search`).

## Barrel export

After creating a new module type file, add it to [src/types/index.ts](../../src/types/index.ts):

```ts
export * from "./foo";
```

Keep the list alphabetically sorted. Do **not** export ambient `.d.ts` files from the barrel.

## Do not

- Do not add runtime code (functions, classes, constants) to files in `src/types/` — types only.
- Do not import from `@/lib/supabase/*` here — these files must remain dependency-free aside from other type modules.
- Do not include search-only columns (`title_search`, `description_search`) on the interface — they are query-only and never round-tripped to the client.
