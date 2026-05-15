# Plan: Products + Items (Stock) Separation

## Overview

Split the current `items` table (which mixes product info with inventory) into two distinct concepts:

- **`categories`** — hierarchical taxonomy table (category → subcategory). Managed by admins.
- **`products`** — what the customer sees and buys. Shown on the public store at `/`. Linked to a subcategory (leaf node).
- **`items`** — stock references. Each item is a specific inventory unit linked to a product. Managed by admins only. This is the foundation for future product variations (e.g. size, color).

---

## Current State

The `items` table currently holds:
- `id`, `title`, `description`, `tags`, `images`, `price`, `category`
- Public read, admin write via RLS
- Displayed at `/` (home page)
- Managed at `/admin/items`

---

## Target State

### `categories` table (new)

Self-referential table to handle one level of nesting (category → subcategory). A row with `parent_id = NULL` is a top-level category. A row with a `parent_id` is a subcategory.

| Column        | Type              | Notes                                          |
|---------------|-------------------|------------------------------------------------|
| `id`          | `uuid` PK         |                                                |
| `name`        | `text NOT NULL`   | e.g. "Clothing", "T-Shirts"                    |
| `slug`        | `text NOT NULL`   | URL-safe unique identifier, e.g. "t-shirts"    |
| `parent_id`   | `uuid`            | FK → `categories.id` ON DELETE RESTRICT; NULL = top-level |
| `created_at`  | `timestamptz`     |                                                |

Constraints:
- `UNIQUE(slug)` — slugs are globally unique (avoids `/clothing/t-shirts` vs `/shoes/t-shirts` ambiguity).
- Depth is intentionally limited to 2 levels (category → subcategory). No recursive nesting.
- `parent_id` FK uses `ON DELETE RESTRICT` — a top-level category cannot be deleted while it still has subcategories. Admin must delete or reassign children first.

RLS: public read, admin write.

### `products` table (new)

| Column        | Type              | Notes                                      |
|---------------|-------------------|--------------------------------------------|
| `id`          | `uuid` PK         |                                            |
| `title`       | `text NOT NULL`   |                                            |
| `description` | `text`            |                                            |
| `price`       | `numeric(10,2)`   | Base price                                 |
| `discount`    | `numeric(5,2)`    | Percentage, default 0; `CHECK (discount >= 0 AND discount <= 100)` |
| `images`      | `jsonb`           | Array of `{ url, description? }` objects   |
| `category_id` | `uuid`            | FK → `categories.id` ON DELETE SET NULL; NULL = uncategorized; should point to a subcategory (leaf) |
| `tags`        | `text[]`          |                                            |
| `created_at`  | `timestamptz`     |                                            |
| `updated_at`  | `timestamptz`     | Auto-updated via trigger                   |

RLS: public read, admin write.

### `items` table (modified)

| Column        | Type              | Notes                                      |
|---------------|-------------------|--------------------------------------------|
| `id`          | `uuid` PK         |                                            |
| `product_id`  | `uuid NOT NULL`   | FK → `products.id` ON DELETE CASCADE       |
| `sku`         | `text`            | Optional reference code (e.g. "RED-L"); globally unique when set (partial unique index on non-NULL values) |
| `stock`       | `integer`         | Default 0, NOT NULL; `CHECK (stock >= 0)`                  |
| `created_at`  | `timestamptz`     |                                            |
| `updated_at`  | `timestamptz`     | Auto-updated via trigger                   |

RLS: admin-only read and write (stock is internal).

> Future variations (size, color, etc.) will be added to `items` as additional columns or via a separate `item_attributes` table — that decision is deferred.

---

## Database Migrations

### Migration 07 — categories table
- Create `categories` table with `parent_id` self-reference.
- Add `UNIQUE(slug)` constraint.
- Add RLS policies (public read, admin write).
- No `updated_at` trigger needed (categories are rarely updated and don't need cache invalidation).

### Migration 08 — products table
- Create `products` table with all product-facing fields.
- `category_id` FK references `categories.id`.
- Add RLS policies (public read, admin write).
- Add `updated_at` trigger.
- Add `title_search` and `description_search` generated columns (unaccent) for accent-insensitive search, following the pattern in `03_unaccent_search.sql`.

### Migration 09 — items refactor
- Drop existing `items` table (or `ALTER TABLE` to remove product fields and add new columns).
- Recreate `items` as a lean stock table with `product_id` FK, `sku`, and `stock`.
- Add `CHECK (stock >= 0)` constraint.
- Add partial unique index on `sku` where `sku IS NOT NULL`.
- Add RLS policies (admin-only).
- Add `updated_at` trigger.

> A DROP + recreate approach is cleanest for a dev environment reset workflow. If this ever runs against a populated database, a proper migration with data transfer would be needed.

> Migration numbering shifts: 07 → categories, 08 → products, 09 → items refactor. Existing migrations 07+ (if any) should be renumbered accordingly.

---

## TypeScript Types

### `src/types/category.ts` (new)
```ts
export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

// Category with its parent preloaded — used in product joined queries
export interface CategoryWithParent extends Category {
  parent: Category | null;
}

// Convenience type for a category with its children preloaded
export interface CategoryWithChildren extends Category {
  children: Category[];
}

export type CreateCategoryInput = Omit<Category, 'id' | 'created_at'>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
```

### `src/types/product.ts` (new)
```ts
export interface ProductImage {
  url: string;
  description?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  discount: number;
  images: ProductImage[];
  category_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Joined shape fetched via Supabase nested select:
// .select('*, category:category_id(*, parent:parent_id(*))')
// CategoryWithParent is imported from '@/types/category'
export interface ProductWithCategory extends Product {
  category: CategoryWithParent | null;
}

export type CreateProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProductInput = Partial<CreateProductInput>;
```

### `src/types/item.ts` (modified)
```ts
export interface Item {
  id: string;
  product_id: string;
  sku: string | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export type CreateItemInput = Omit<Item, 'id' | 'created_at' | 'updated_at'>;
export type UpdateItemInput = Partial<CreateItemInput>;
```

### `src/types/index.ts`
- Add re-export of `Category`, `CategoryWithParent`, `CategoryWithChildren`, `CreateCategoryInput`, `UpdateCategoryInput`.
- Add re-export of `Product`, `ProductWithCategory`, `CreateProductInput`, `UpdateProductInput`.
- Keep `Item` exports but update to new shape.

---

## App Modules

### `src/app/page.tsx` (home, modified)
- Switch from querying `items` to querying `products`.
- Display a new `ProductCard` component.
- This is the only public product list — there is no separate `/products/` route.

### `src/app/products/` (new — public product detail only)
- `[id]/page.tsx` — public product detail page.
- No list page, no form. All CRUD is admin-only.

### `src/app/components/ProductCard.tsx` (new)
- Card component used by `src/app/page.tsx`.
- Lives in the shared components folder since it is used by the root page, not within the products module.

### `src/app/items/` (removed)
- The existing public redirect (`/items` → `/`) can be deleted entirely.
- Items are never exposed publicly.

### `src/app/admin/categories/` (new — admin category management)
Following `/admin/items` pattern:
- `page.tsx` — list all categories grouped by parent
- `new/page.tsx` — create category (with optional parent selector)
- `[id]/edit/page.tsx` — edit category
- `actions.ts` — server actions (createCategory, updateCategory, deleteCategory)

### `src/app/admin/products/` (new — admin product management)
Following `/admin/items` pattern:
- `page.tsx` — list all products
- `new/page.tsx` — create product
- `[id]/edit/page.tsx` — edit product
- `actions.ts` — server actions (createProduct, updateProduct, deleteProduct)
- `ProductForm.tsx` — create/edit form (admin only; includes two-level category selector)

### `src/app/admin/items/` (modified — stock management)
- Update forms, actions, and list to use new `items` schema (product_id, sku, stock).
- Show product name alongside each item (join with `products`).

---

## Seed Data

All existing seed files are replaced. No retrocompatibility required — existing data is dropped with the migration.

| File | Replaces | Content |
|------|----------|---------|
| `01_categories.sql` | — | Top-level categories + subcategories with hardcoded UUIDs |
| `02_products.sql` | `01_items.sql` | 6 sample products referencing subcategory UUIDs |
| `03_items.sql` | _(current 01)_ | Stock entries referencing seeded products |
| `04_admin.sql` | `02_admin.sql` | Seed admin user (unchanged logic) |
| `05_content.sql` | `03_content.sql` | Seed content entries (unchanged logic) |

---

## Admin Navigation

- Add "Categories" link to admin nav.
- Add "Products" link to admin nav.
- Keep "Items" link for stock management.
- Suggested order: Categories → Products → Items.

---

## Open Questions / Deferred

- **Variation attributes**: When product variations are defined (e.g. size S/M/L), `items` will need attribute columns or a join table. This is out of scope for now.
- **Effective price**: Should `products.price - discount` be computed in SQL (generated column) or in the UI? Defer.
- **Stock aggregation**: Should the store show total stock across all items of a product? Defer — no stock visibility on the public store for now.
- **Category filter on home page**: Currently `/` filters by tags only. Whether subcategory filtering is added to the home page is deferred.

---

## Implementation Order

1. DB migrations (07_categories, 08_products, 09_items_refactor)
2. TypeScript types (category, product, item)
3. Seed data (01_categories, 02_products, 03_items)
4. `src/app/admin/categories/` module + actions
5. `src/app/admin/products/` module + actions
6. `src/app/admin/items/` updates
7. Update `src/app/page.tsx` to use products
8. `src/app/products/[id]/page.tsx` — public detail page
9. Admin nav update
10. `db:reset` + smoke test
