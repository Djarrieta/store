# Feature Flags Plan

## Approach

Simple key-value table in Supabase. Each row is a flag with a `key` (text, unique) and `enabled` (boolean). Server-side check — no client exposure of disabled features.

## Database

Table: `feature_flags`

| Column | Type | Notes |
|--------|------|-------|
| `key` | `text PRIMARY KEY` | Snake_case identifier (e.g. `customizable_products`) |
| `enabled` | `boolean NOT NULL DEFAULT false` | On/off |
| `description` | `text` | Human-readable note for admin |
| `updated_at` | `timestamptz` | Auto-updated |

RLS: public read (anon + authenticated), write restricted to admins.

## Helper

`src/lib/flags.ts` — single function:

```ts
export async function isFeatureEnabled(key: string): Promise<boolean>
```

Reads from `feature_flags` table using the server Supabase client. Returns `false` if key not found.

## Admin UI

Add a simple `/admin/flags` page to toggle flags (optional, can start with direct DB edits).

## First Flag: `customizable_products`

When **disabled**, the entire customization feature is removed from the storefront — not hidden, not rendered at all.

### Implementation Steps

- [ ] Create migration `20_feature_flags.sql`
- [ ] Seed initial flag: `customizable_products` → `false`
- [ ] Create `src/lib/flags.ts` helper
- [ ] Gate storefront UI (see list below)
- [ ] 404 gated pages when flag is off

### Storefront elements to NOT render when flag is off

| Location | What to remove | How |
|----------|---------------|-----|
| `src/app/products/[id]/page.tsx` | "Diseña tu producto" section (`<CustomizationFlow>`) | Don't render; treat product as non-customizable |
| `src/app/components/ProductCard.tsx` | "Personalizar" button / `<VariantSelector customizable>` | Render normal Add-to-Cart instead |
| `src/app/components/FilterableList.tsx` | "Solo personalizables" checkbox | Don't render the filter |
| `src/app/components/CartDrawer.tsx` | "Editar diseño" link + custom preview thumbnail | Show normal item image, no edit link |
| `src/app/components/BuyNowButton.tsx` | `persistPendingCustomizations` call | Skip persist logic |
| `src/app/page.tsx` | `?customizable=1` param handling | Ignore/strip the param |

### Pages that should 404 when flag is off

| Page | Reason |
|------|--------|
| `/admin/customization-kinds` (and sub-routes) | No point managing kinds if feature is off |

### How to pass the flag to Client Components

The flag is checked once in the Server Component (page or layout) and passed down as a prop. Client Components like `ProductCard`, `CartDrawer`, `FilterableList` receive `customizable={false}` and conditionally skip rendering those elements. No direct DB call from the client.

## Usage Pattern

```tsx
// In a Server Component
import { isFeatureEnabled } from "@/lib/flags";

export default async function ProductPage() {
  const customizable = await isFeatureEnabled("customizable_products");

  return (
    <div>
      {/* ... product info ... */}
      {customizable && <CustomizationSection />}
    </div>
  );
}
```

## Notes

- No caching for now — single row lookup is fast enough via PostgREST.
- If performance becomes a concern, add `unstable_cache` with a short TTL.
- Flags are server-only; no need to ship flag state to the client bundle.
