# Product Personalization Plan (Print-on-Demand)

> Goal: let a customer customize **multiple kinds of products** (phone cases, t-shirts, mugs, …) by picking a variation, uploading or selecting an image, positioning + scaling it on a printable area, and have the **exact** print-ready specification travel through cart → order → admin for fulfillment.
>
> Architecture is **kind-agnostic** at the data layer (one template row per customizable item, one customizations row per design) with `kind`-specific UI on top.

---

## 0. Decisions baked into this plan

| # | Topic | Decision |
|---|---|---|
| 1 | Template ownership | **1:1 with `items`** — each customizable variation carries its own template. Stock = existing `items.stock`. |
| 2 | Guest customization | **Client-only until checkout.** Source image lives in **IndexedDB** as a Blob; design metadata + preview dataURL live in `localStorage`. Nothing is uploaded or written to DB until login at checkout. |
| 3 | Kind change with existing data | **One-click confirm** — server deletes affected items + their templates and switches `customization_kind`. |
| 4 | Disable `customizable` | Preserve `customization_kind` (greyed in UI). Items + templates remain. Re-enable restores everything. |
| 5 | Print render on approval | **Server Action wraps the SP**: call `approve_order` → re-`select` the order → render print files (`@napi-rs/canvas`) → persist `print_path` on both row and snapshot. |
| 6 | Rotation | **Arbitrary rotation** via `@napi-rs/canvas` (not `sharp`). Pivot = image **top-left** (`transform.x/y` are top-left coordinates). |
| 7 | Source storage | Private bucket, store **object path**; signed URL generated on read. |
| 8 | Re-edit from cart | **v1.** Cart line carries `customizationId` (logged-in) or `customizationLocalKey` (guest). For logged-in users the row is updated; for guests the IndexedDB blob + localStorage entry are mutated. |
| 9 | Moderation | None (rely on ToS); admin can flag/cancel orders manually. |
| 10 | Pricing | **Flat** — uses the item's price; no per-template surcharge. |
| 11 | Editor library | **`react-konva`** (Konva.js). |
| 12 | Print format | PNG with alpha. |
| 13 | Scale model | **Uniform only** — `transform.scale` is a single number; no skewing. |
| 14 | Fit-to-template | **Contain** — whole image visible, may leave empty edges. |
| 15 | Checkout auth | **v1: login required at checkout.** Guest customizations are persisted at login (`persistGuestCustomizations`). |
| 16 | Storage policies | **Relaxed** — match existing `04_storage.sql` convention (`auth.uid() IS NOT NULL`). No per-user prefix enforcement in v1. |
| 17 | Order snapshot | `OrderItem.customization` carries **everything needed to render** (transform + source path + full template fields). Renders survive item/template deletion. |
| 18 | UI language | **Spanish** (matches existing storefront/admin). |
| 19 | Storefront badge | "Personalizable" badge on product cards in `/products` and category lists, plus a filter chip. |
| 20 | Preview file | **PNG**, max 1024 px on long edge, ≤ 500 KB. |
| 21 | Stock model | `approve_order` SP is fixed to deduct by **`item_id`** (pre-existing bug surfaced by this feature). All new orders carry `item_id` per line. |

---

## 1. How this is normally done (industry context)

Mainstream POD shops (Casetify, Printful, Caseapp, Gelato, Custom Ink) share these patterns; we adapt them to this codebase:

1. **One variant per device/size carrying its own print template** — dimensions in mm, target DPI (typically 300), mockup PNG, safe area, optional alpha mask. We map this onto our existing `items` (variations) by attaching a 1:1 `print_templates` row.
2. **Canvas-based editor** with serializable JSON state (Konva/Fabric). We use `react-konva`.
3. **Design state is stored, not the rendered image.** The persisted blob is `{ source_image_path, transform }`. Previews are derived; the final print file is server-rendered from the same transform at print resolution.
4. **Two artifacts per personalized line item:**
   - **Preview** (≤ 1024 px PNG, ≤ 500 KB) — generated **client-side in v1**; cheap to recompute.
   - **Print file** (PNG, alpha, full bleed at template DPI) — generated **server-side on order approval**.
5. **Variation-level template, line-item-level design.** Template lives on the item (reusable across customers); design lives on the `customizations` row (one per cart line, then snapshot on the order line).
6. **Validation** in the editor: file type/size, min source resolution, safe-area warning, low-effective-DPI warning.

### Library choices

| Concern | Library | Why |
|---|---|---|
| Editor | **`react-konva`** + `konva` | Declarative React, serializable transforms, touch support. |
| Server render | **`@napi-rs/canvas`** | Arbitrary rotation, `drawImage` + `setTransform` + `globalCompositeOperation = 'destination-in'` for masks. Pure JS install. `sharp` is rejected because non-90° rotation + translate composition is fiddly. |
| Source-image dimensions (server) | **`image-size`** | Read width/height from a Buffer server-side. |
| Source-image dimensions (client) | **`new Image()` / `createImageBitmap`** | No `image-size` in the browser. |
| Guest source blob storage | **IndexedDB** (`idb` wrapper) | LocalStorage is too small (5 MB) for 20 MB photos. |

---

## 2. Data model changes

### 2.1 `products` — module flag (edit `08_products.sql`)

```sql
ALTER TABLE products
  ADD COLUMN customizable boolean NOT NULL DEFAULT false,
  ADD COLUMN customization_kind text
    CHECK (customization_kind IN ('phone_case', 'tshirt', 'mug')),
  ADD CONSTRAINT products_customizable_requires_kind
    CHECK (customizable = false OR customization_kind IS NOT NULL);
```

`customization_kind` is preserved across `customizable` toggling (decision #4) and used by the kind-match trigger in §2.2.

### 2.2 New table: `print_templates` — 1:1 with `items` (`16_print_templates.sql`)

```sql
DROP TABLE IF EXISTS public.print_templates CASCADE;

CREATE TABLE public.print_templates (
  item_id      uuid PRIMARY KEY REFERENCES public.items(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('phone_case', 'tshirt', 'mug')),
  label        text NOT NULL,        -- 'iPhone 15 Pro', 'Talla M — Frente', 'Mug 11oz'
  attributes   jsonb NOT NULL DEFAULT '{}',
                                     -- phone_case: { brand: string, model: string }   REQUIRED
                                     -- tshirt:     { placement: 'front'|'back' }      REQUIRED
                                     -- mug:        { wrap: 'full'|'partial' }         REQUIRED
  width_mm     numeric NOT NULL,
  height_mm    numeric NOT NULL,
  print_dpi    integer NOT NULL DEFAULT 300,
  mockup_path  text,                 -- object path in 'print-templates' bucket
  mask_path    text,                 -- object path; optional
  safe_area    jsonb,                -- { x, y, width, height } normalized 0..1
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER print_templates_updated_at
BEFORE UPDATE ON public.print_templates
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
```

Key points:
- **PK is `item_id`** — strict 1:1 with the variation. Stock lives on `items.stock`.
- `mockup_path` / `mask_path` store **object paths**, not URLs.
- Per-kind required keys in `attributes` are enforced in the Server Action (not the DB) so the JSON stays flexible.
- **Silhouette clipping (editor + render).** v2 will add a `clip_path text` column holding an SVG `d` string (in normalized 0..1 or template-mm coordinates) used by both the Konva editor (`clipFunc`) and the server renderer to keep the user image inside the product body. v1 sandbox hardcodes the t-shirt silhouette derived from the seed mockup.
- **Kind-match trigger** (cross-table):
  ```sql
  CREATE FUNCTION public.print_templates_kind_match() RETURNS trigger AS $$
  DECLARE pk text;
  BEGIN
    SELECT p.customization_kind INTO pk
    FROM public.items i JOIN public.products p ON p.id = i.product_id
    WHERE i.id = NEW.item_id;
    IF pk IS NULL OR pk <> NEW.kind THEN
      RAISE EXCEPTION 'print_templates.kind (%) must match parent product.customization_kind (%)', NEW.kind, pk;
    END IF;
    RETURN NEW;
  END $$ LANGUAGE plpgsql;

  CREATE TRIGGER print_templates_kind_match_trg
  BEFORE INSERT OR UPDATE ON public.print_templates
  FOR EACH ROW EXECUTE PROCEDURE public.print_templates_kind_match();
  ```

RLS:
- `select`: public.
- `insert/update/delete`: admin only (`is_admin(auth.uid())`).

### 2.3 New table: `customizations` (`17_customizations.sql`)

```sql
DROP TABLE IF EXISTS public.customizations CASCADE;

CREATE TABLE public.customizations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id            uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  source_image_path  text NOT NULL,        -- 'customizations-source' bucket
  source_width_px    integer NOT NULL,
  source_height_px   integer NOT NULL,
  transform          jsonb NOT NULL,       -- { x, y, scale, rotation }  normalized 0..1; pivot = top-left
  preview_path       text NOT NULL,        -- 'customizations-preview' bucket
  print_path         text,                 -- 'customizations-print' bucket; filled on approval
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER customizations_updated_at
BEFORE UPDATE ON public.customizations
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX customizations_user_idx ON public.customizations (user_id, created_at DESC);
CREATE INDEX customizations_item_idx ON public.customizations (item_id);
```

Per decision #2 + #15: rows only exist for **logged-in users**. RLS:
- `select`: `auth.uid() = user_id` OR admin.
- `insert`: `auth.uid() = user_id`.
- `update`/`delete`: `auth.uid() = user_id` OR admin.

### 2.4 `approve_order` SP — fix stock deduction (edit `13_approve_order.sql`)

Replace `WHERE product_id = …` with `WHERE id = …`:

```sql
FOR v_item IN SELECT value FROM jsonb_array_elements(v_order.items)
LOOP
  UPDATE public.items
  SET stock = stock - (v_item->>'qty')::int
  WHERE id = (v_item->>'item_id')::uuid
    AND stock >= (v_item->>'qty')::int;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Insufficient stock for item %', v_item->>'item_id';
  END IF;
END LOOP;
```

SP signature stays `RETURNS void`. The wrapping Server Action `select`s the order after the RPC succeeds.

> **Precondition for v1 personalization:** all order-create paths must include `item_id` per line. This affects non-customizable products too; the cart already needs `itemId` to know which variation to deduct.

### 2.5 Cart and order changes

`CartItem` (`src/lib/cart.tsx`):

```ts
type CartItem = {
  // existing
  id: string;             // RULE BELOW
  title: string;
  price: number;
  amountInCents: number;
  quantity: number;
  image?: string;

  // new
  itemId: string;                          // the variation (now required)
  customizationId?: string;                // logged-in: customizations.id
  customizationLocalKey?: string;          // guest: IndexedDB key (uuid)
  customizationPreviewDataUrl?: string;    // small dataURL for thumbnails
};
```

**Cart line id rule** (replaces existing dedup-by-id):

- Non-customized: `id = itemId`
- Customized: `id = ${itemId}:${customizationId ?? customizationLocalKey}`

`ADD_ITEM` increments qty only when `id` matches exactly. Re-adding the same customization increments qty; adding a different customization on the same item creates a distinct line.

`OrderItem` (`src/types/order.ts` + persisted JSON in `orders.items`) — self-contained render-ready snapshot:

```ts
type OrderItem = {
  // existing
  product_id: string;
  title: string;
  qty: number;
  unit_price: number;
  sku: string | null;

  // new
  item_id: string;        // REQUIRED on all new orders (precondition above)

  customization?: {
    id: string;                          // customizations.id
    item_id: string;
    template_kind: 'phone_case' | 'tshirt' | 'mug';
    template_label: string;
    // source
    source_image_path: string;
    source_width_px: number;
    source_height_px: number;
    transform: { x: number; y: number; scale: number; rotation: number };
    // template snapshot (decision #17) — render survives item/template deletion
    template: {
      width_mm: number;
      height_mm: number;
      print_dpi: number;
      mockup_path: string | null;
      mask_path: string | null;
      safe_area: { x: number; y: number; width: number; height: number } | null;
    };
    // artifacts
    preview_path: string;
    print_path: string | null;            // filled on approval
  };
};
```

### 2.6 Storage buckets (`04_storage.sql`)

| Bucket | Public? | Holds | Path stored in |
|---|---|---|---|
| `print-templates` | public | mockup + mask PNGs | `print_templates.mockup_path` / `mask_path` |
| `customizations-source` | private | user uploads | `customizations.source_image_path` |
| `customizations-preview` | private | client-rendered PNG previews | `customizations.preview_path` |
| `customizations-print` | private | server-rendered print PNGs | `customizations.print_path` |

Policies (decision #16 — relaxed):

- `print-templates`: `select` public; `insert`/`delete` require `is_admin(auth.uid())`.
- `customizations-source` / `customizations-preview`: `select`/`insert`/`delete` require `auth.uid() IS NOT NULL` (matches existing `item-images` policy).
- `customizations-print`: `select` requires `is_admin(auth.uid())`; `insert` uses service role only (writes happen from the approval Server Action via `createServiceClient()`).

Helpers in `src/lib/supabase/storage.ts`:

```ts
export async function signStoragePath(bucket: string, path: string, expiresIn?: number): Promise<string>
```

---

## 3. UX flow — customer

```
Product detail page (customizable product)
        │
        ▼
[ Paso 1 ] Elige tu variación   ──► items where product is customizable AND
                                    a print_template exists (kind-aware picker)
                                    (phone model / talla / mug variant)
        │
        ▼
[ Paso 2 ] Sube tu imagen       ──► drag/drop or file picker
                                    Client checks: type, ≤ 20 MB, ≥ 1000 × 1000 px
                                    Guest: store Blob in IndexedDB, key = uuid
                                    Logged-in: upload to 'customizations-source'
                                                under any path (relaxed policy)
        │
        ▼
[ Paso 3 ] Editor (Konva canvas)
        ├─ Background: mockup (signed URL) scaled to canvas
        ├─ User image: drag, resize (uniform scale), arbitrary rotation
        │              (pivot = image top-left → keep editor + renderer in lockstep)
        │              Clipped to the product silhouette via Konva <Group clipFunc>
        │              so the image never spills outside the shirt/case/mug body.
        ├─ Overlay: dashed safe-area rectangle
        ├─ Controls: zoom slider, rotación, Reiniciar, "Ajustar a la plantilla" (CONTAIN)
        ├─ Live warning: DPI bajo (formula in §3.2)
        └─ Live warning: la imagen sale del área segura
        │
        ▼
[ Paso 4 ] Confirmar + Añadir al carrito
        ├─ Client renders preview PNG (Konva stage → toBlob; max 1024 px, ≤ 500 KB)
        ├─ Logged-in: createCustomization(itemId, sourcePath, transform, previewBlob)
        │             → server uploads preview, returns customizationId
        │             → cart line: { id: `${itemId}:${customizationId}`, itemId,
        │                            customizationId, customizationPreviewDataUrl }
        └─ Guest:     keep IndexedDB blob + localStorage record:
                       { localKey, itemId, transform, sourceWidth, sourceHeight,
                         previewDataUrl }
                       Cart line: { id: `${itemId}:${localKey}`, itemId,
                                    customizationLocalKey: localKey,
                                    customizationPreviewDataUrl }
        │
        ▼
Checkout (login required — decision #15)
        ├─ Guest path: on login, persistGuestCustomizations() iterates every cart line
        │              with customizationLocalKey:
        │                1. Read source Blob from IndexedDB.
        │                2. Upload source to 'customizations-source'.
        │                3. Upload preview PNG to 'customizations-preview'.
        │                4. Insert customizations row.
        │                5. Swap cart line: drop customizationLocalKey, set
        │                   customizationId; new cart line id is updated too.
        │                6. Delete IndexedDB entry on success.
        ├─ Logged-in: rows already exist.
        └─ Order is created with the full customization snapshot (§2.5) per line.
        │
        ▼
Order approval (admin)
        └─ Server Action: rpc('approve_order') → re-select order → for each
           line with .customization, render print PNG (@napi-rs/canvas) using
           the SNAPSHOT (not a fresh table lookup) → upload to
           'customizations-print' → write print_path back to the customization
           row AND the order snapshot.
```

### 3.1 Per-kind editor presets

| Kind | Step-1 label | Picker layout | Required `attributes` |
|---|---|---|---|
| `phone_case` | "Elige tu teléfono" | searchable grid grouped by `attributes.brand` | `brand`, `model` |
| `tshirt` | "Elige talla" (placement is preset on the template) | size pills | `placement: 'front' \| 'back'` |
| `mug` | "Elige el mug" | small grid | `wrap: 'full' \| 'partial'` |

Presets live in `src/app/products/[id]/customization/presets.ts` keyed by `customization_kind`.

### 3.2 DPI warning formula

Given source `sw × sh` (px) and uniform `transform.scale` (normalized 0..1 where 1 = template width):

```
printable_width_px = (width_mm / 25.4) * print_dpi
drawn_width_px     = scale * printable_width_px
effective_dpi      = (sw / drawn_width_px) * print_dpi
```

- Warn (yellow) when `effective_dpi < 150`.
- Block "Añadir al carrito" (red) when `effective_dpi < 72`.

### 3.3 Re-edit from cart

`CartDrawer` renders an **"Editar diseño"** button on lines where `customizationId` or `customizationLocalKey` is set. Click navigates to:

- `/products/[productId]?edit=cust:<uuid>` (logged-in)
- `/products/[productId]?edit=local:<uuid>` (guest)

The prefix tells the editor which source to hydrate (DB row vs IndexedDB). On confirm:
- Logged-in: `updateCustomization(id, transform, previewBlob)` — re-uploads preview, updates row.
- Guest: rewrite IndexedDB blob (if image was changed) + localStorage record.

---

## 4. UX flow — admin

All admin UI for a customizable product lives on **one page**: `/admin/products/[id]/edit`. Templates live inside each item row, mirroring how stock & categories already live on items.

```
Admin → "Nuevo producto" → /admin/products/new
        │
        ▼
[ Crear producto ]   título, precio, imágenes, categoría, etiquetas  → Guardar
        │
        ▼
/admin/products/[id]/edit
        │
        ├──► <ProductForm> (existente) + bloque Personalización:
        │       ├─ [ ✓ ] Personalizable
        │       └─ Tipo: ( Funda de teléfono | Camiseta | Mug )
        │            • Disabled while toggle is off.
        │            • Changing tipo with existing items prompts:
        │              "Esto borrará N variaciones y sus plantillas. ¿Continuar?"
        │              On confirm, server deletes affected items (templates cascade)
        │              and updates customization_kind.
        │
        └──► <ProductItemsSection> (existente) — extended:
                Each item row in <ProductItemsAccordion> gains a
                **"Plantilla de impresión"** subsection, ONLY when product.customizable = true.
                │
                ├─ Fila de variación (categorías, stock)
                └─ Plantilla de impresión:
                     • etiqueta (requerido)
                     • atributos kind-aware via <PrintTemplateFields>
                     • width_mm, height_mm, print_dpi (default 300)
                     • subir mockup → uploadImage(file, 'print-templates')
                     • subir máscara → uploadImage(file, 'print-templates')
                     • safe_area x/y/w/h (numérico en v1)
                     • [Guardar plantilla] / [Eliminar plantilla]
                     • Píldora de estado: "Plantilla faltante — variación oculta"
                       cuando product.customizable=true pero el item no tiene plantilla.
```

### Admin behaviors

- **Personalización + tipo** live inside `<ProductForm>`. While off, per-item plantilla sub-forms hide.
- **Validation before publish:** product cannot be saved with `customizable = true` and 0 items with templates. Server action returns inline error.
- **Storefront filter:** customer-facing picker only shows items where the product is customizable AND has a `print_templates` row. Items without a template are silently hidden.
- **Disabling personalizable:** preserves `customization_kind` (greyed), preserves all items/templates. Re-enabling restores intact.
- **Changing tipo:** items have kind-specific templates (via trigger); the only safe path is delete-and-recreate. UI shows one-click confirm; server action does it transactionally.
- **Historical orders:** never touched. `OrderItem.customization` snapshot keeps them rendering even if the underlying item/template is later deleted.

### 4.1 Per-item plantilla subsection — concrete contract

Implementation contract for step 4 (todo: *Per-item plantilla subsection + actions*). Soft validation in v1 — admin can save a `customizable=true` product with templateless items; those items are just hidden on the storefront. (Plan §4 "Validation before publish" downgraded to a UI hint to keep step 4 self-contained.)

#### `PrintTemplateFields.tsx` (client component)

Props: `{ kind: CustomizationKind, defaultValue: PrintTemplate | null }`. Renders:

| Field | Input | Required |
|---|---|---|
| `label` | text | yes |
| Attributes (kind-aware) | see below | yes |
| `width_mm` / `height_mm` | number | yes |
| `print_dpi` | number, default `300` | yes |
| Mockup (`mockup_path`) | file → uploads to `print-templates` bucket, hidden input holds object path | optional |
| Mask (`mask_path`) | file → same | optional |
| `safe_area_{x,y,width,height}` | numbers 0..1 | optional (all four together) |

Kind-aware attributes:

- `phone_case` → `attr_brand` (text), `attr_model` (text) — both required.
- `tshirt` → `attr_placement` (select: `front` / `back`) — required.
- `mug` → `attr_wrap` (select: `full` / `partial`) — required.

Upload pattern mirrors `ProductForm`: client `uploadImage(file, 'print-templates')` returns a public URL, but we store the **object path** (per §2.6). To get the path we add a sibling client helper `uploadStorageObject(file, bucket): Promise<{ path, publicUrl }>` in `src/lib/supabase/storage.ts` and use that here.

#### Server actions (add to `src/app/admin/products/actions.ts`)

```ts
export async function upsertPrintTemplate(
  productId: string,
  itemId: string,
  formData: FormData,
): Promise<void>
export async function deletePrintTemplate(
  productId: string,
  itemId: string,
): Promise<void>
```

Behavior:

- `requireAdmin()`.
- `upsertPrintTemplate` reads `products.customization_kind` for `productId` (single source of truth — never trust the client). Throws if null.
- Builds `attributes` jsonb from per-kind form keys; validates required keys.
- Parses `safe_area` into `{x,y,width,height}` only if all four are present and finite.
- Upserts into `print_templates` with `item_id` as conflict target. The DB kind-match trigger from §2.2 provides the safety net.
- `deletePrintTemplate` deletes the row by `item_id`.
- Both `revalidatePath('/admin/products/<id>/edit')` and `revalidatePath('/products/<id>')`.

#### `ProductItemsSection.tsx` (server component) extensions

- Also `select` `customizable, customization_kind` from `products` (already on the product, but pass explicitly to the accordion).
- Join `print_templates` per item: extend the items query to `items(*, print_template:print_templates(*))`.
- Pass `customizable`, `customizationKind`, and the joined `printTemplate` per item to `<ProductItemsAccordion>`.

#### `ProductItemsAccordion.tsx` changes

- New props: `customizable: boolean`, `customizationKind: CustomizationKind | null`, plus each item carries an optional `printTemplate`.
- Header pill: if `customizable && customizationKind && !item.printTemplate` → render a "Plantilla faltante — variación oculta" red pill.
- Inside the expanded body, when `customizable && customizationKind`, render a new bordered subsection titled **"Plantilla de impresión"** containing `<PrintTemplateFields>` inside a `Form` whose action is `upsertPrintTemplate.bind(null, productId, item.id)`. Below it, a separate `Form` with `deletePrintTemplate` and `confirm`, only when `item.printTemplate` exists.

#### Edit page wiring

`/admin/products/[id]/edit` already passes `hasItems`. Add `customizationKind` to the data it forwards to the section. No new fetches beyond what `ProductItemsSection` already does.

---

### Storefront list pages (decision #19)

- "Personalizable" badge on `ProductCard` when `product.customizable && product.customization_kind`.
- Filter chip on `/products` and category pages: "Solo personalizables" (toggles a `?customizable=1` URL param).

---

## 5. Server-side render pipeline (print files)

Triggered by the order-approval Server Action (decision #5), not by a route handler.

```ts
// src/app/admin/orders/actions.ts
export async function approveOrder(orderId: string) {
  await requireAdmin();
  const supabase = await createServiceClient();

  // 1. Atomic stock deduction + status flip
  const { error: rpcErr } = await supabase.rpc("approve_order", { p_order_id: orderId });
  if (rpcErr) throw new Error(rpcErr.message);

  // 2. Re-select the order (SP returns void)
  const { data: order, error: selErr } = await supabase
    .from("orders").select("*").eq("id", orderId).single();
  if (selErr || !order) throw new Error(selErr?.message ?? "order not found");

  // 3. Render each customized line from the SNAPSHOT (decision #17)
  const items = order.items as OrderItem[];
  let mutated = false;
  for (let i = 0; i < items.length; i++) {
    const c = items[i].customization;
    if (!c || c.print_path) continue;
    const printPath = await renderPrintFile(c, orderId, i);
    c.print_path = printPath;
    mutated = true;
    await supabase.from("customizations").update({ print_path: printPath }).eq("id", c.id);
  }
  if (mutated) {
    await supabase.from("orders").update({ items }).eq("id", orderId);
  }
  revalidatePath(`/admin/orders/${orderId}`);
}
```

`renderPrintFile(snapshot, orderId, lineIndex)` lives in `src/lib/print/render.ts`:

1. From snapshot: `targetW = round((template.width_mm / 25.4) * template.print_dpi)`; same for `targetH`.
2. Download source from `customizations-source` via signed URL into a `Buffer`.
3. With `@napi-rs/canvas` (top-left pivot, uniform scale):
   ```ts
   const canvas = createCanvas(targetW, targetH);
   const ctx = canvas.getContext("2d");
   const img = await loadImage(sourceBuffer);
   const drawnW = transform.scale * targetW;
   const drawnH = (img.height / img.width) * drawnW;

   ctx.save();
   ctx.translate(transform.x * targetW, transform.y * targetH);
   ctx.rotate(transform.rotation);                       // around top-left (decision #6)
   ctx.drawImage(img, 0, 0, drawnW, drawnH);
   ctx.restore();

   if (template.mask_path) {
     const mask = await loadImage(await fetchSigned(template.mask_path));
     ctx.globalCompositeOperation = "destination-in";
     ctx.drawImage(mask, 0, 0, targetW, targetH);
   }
   return canvas.encode("png");
   ```
4. Upload PNG to `customizations-print/<orderId>/<lineIndex>.png`; return the object path.

A separate admin **"Regenerar archivo de impresión"** button on the order page calls `renderPrintFile()` for a single line — useful if the first render fails or for re-prints.

---

## 6. Admin surface — `/admin/orders/[id]`

For each `OrderItem.customization`:

- Badge de tipo + etiqueta de plantilla.
- Miniatura de la imagen original (signed URL).
- Vista previa (signed URL desde `customizations-preview`).
- Botón **"Descargar archivo de impresión"** — signed URL a `customizations-print/<orderId>/<i>.png`. Si `print_path` es null, dice **"Generar archivo"** y llama la acción de §5 para esa línea.

---

## 7. File / module changes summary

| File | Change |
|---|---|
| `supabase/migrations/08_products.sql` | Add `customizable`, `customization_kind` + CHECK |
| `supabase/migrations/09_items.sql` | (no change — `items.stock` already covers stock) |
| `supabase/migrations/13_approve_order.sql` | **Edit** — deduct stock by `item_id` instead of `product_id` |
| `supabase/migrations/16_print_templates.sql` | **NEW** — 1:1 with `items`, kind-match trigger, RLS, `set_updated_at` trigger |
| `supabase/migrations/17_customizations.sql` | **NEW** — table + indexes + RLS (auth-only) + `set_updated_at` trigger |
| `supabase/migrations/04_storage.sql` | Add 3 buckets + relaxed policies (print bucket admin/service) |
| `supabase/seed/08_print_templates.sql` | **NEW** — seed templates for seeded customizable items |
| `src/types/product.ts` | Add `customizable`, `customization_kind` |
| `src/types/item.ts` | Optional `print_template?: PrintTemplate` joined shape |
| `src/types/print-template.ts` | **NEW** |
| `src/types/customization.ts` | **NEW** — `Customization`, `CustomizationTransform`, snapshot type |
| `src/types/order.ts` | Add `item_id` to `OrderItem`; add `customization` snapshot |
| `src/lib/supabase/storage.ts` | Add `signStoragePath(bucket, path, expiresIn?)`; ensure `uploadImage` accepts a bucket param |
| `src/lib/print/render.ts` | **NEW** — `renderPrintFile()` (`@napi-rs/canvas`, `image-size` server) |
| `src/lib/cart.tsx` | Require `itemId`; add customization fields; new line-id rule; persist new shape to localStorage |
| `src/lib/customizations/indexedDb.ts` | **NEW** — guest blob store (`put`, `get`, `delete`, `list`) using `idb` |
| `src/app/components/CartDrawer.tsx` | Show preview thumbnail + "Editar diseño" button on customized lines |
| `src/app/components/ProductCard.tsx` | Show "Personalizable" badge when applicable |
| `src/app/components/FilterableList.tsx` (or list pages) | Add "Solo personalizables" chip (URL param `customizable=1`) |
| `src/app/admin/products/ProductForm.tsx` | Add personalización toggle + tipo select; one-click confirm on tipo change |
| `src/app/admin/products/ProductItemsAccordion.tsx` | Add per-item plantilla subsection (visible when product is customizable) |
| `src/app/admin/products/PrintTemplateFields.tsx` | **NEW** — kind-aware sub-form (validates `attributes` per kind) |
| `src/app/admin/products/actions.ts` | Add template upsert/delete, tipo-change cleanup action, no-empty-templated-items validation |
| `src/app/admin/orders/actions.ts` | **NEW** `approveOrder` Server Action (wraps SP + renders); `regeneratePrintFile(orderId, lineIndex)` |
| `src/app/admin/orders/[id]/page.tsx` | Show customization info + download/generate buttons |
| `src/app/products/[id]/page.tsx` | If `customizable`, render `<CustomizationFlow />`; otherwise existing flow |
| `src/app/products/[id]/CustomizationFlow.tsx` | **NEW** — picker → upload → Konva editor → confirm; supports `?edit=cust:<id>` / `?edit=local:<id>` |
| `src/app/products/[id]/customization/presets.ts` | **NEW** — per-kind editor presets |
| `src/app/actions/customizations.ts` | **NEW** — `createCustomization`, `updateCustomization`, `getCustomizationForEdit`, `persistGuestCustomizations` |
| `src/app/login/LoginActions.tsx` (or callback) | After successful login, run `persistGuestCustomizations` for any localStorage entries |
| `src/app/actions/orders.ts` | Order create: include `item_id` and `customization` snapshot per line |
| `package.json` | Add `react-konva`, `konva`, `@napi-rs/canvas`, `image-size`, `idb` |

---

## 8. Implementation order

1. **Schema + types + seed**: migrations 08 (alter), 13 (SP fix), 16 (print_templates), 17 (customizations), 04 (buckets/policies); seed; `npm run db:reset`.
2. **Order create path**: add `item_id` to every cart line + every `OrderItem`. Non-customizable orders must work after this.
3. **Product form**: personalizable toggle + tipo select with one-click confirm on tipo change.
4. **Per-item plantilla subsection** in `<ProductItemsAccordion>` + CRUD actions; storage helpers; per-kind `attributes` validation.
5. **Konva editor sandbox** at `/admin/products/[id]/preview-editor` — validate UX with phone_case first, then tshirt + mug. Includes silhouette clipping (hardcoded path for the seed mockup); the per-template `clip_path` field is deferred to v2.
6. **Customer flow** on product detail page (`<CustomizationFlow />`); client-side preview; IndexedDB for guests; `createCustomization` for logged-in.
7. **Cart integration**: extended `CartItem` shape + new line-id rule + thumbnail + "Editar diseño". Re-edit via `?edit=cust:<id>` / `?edit=local:<id>`.
8. **Login persistence**: `persistGuestCustomizations` runs from login callback; swaps cart line keys.
9. **Order snapshot** wiring in order create; admin order page rendering.
10. **`approveOrder` Server Action** wrapping `approve_order` SP + print render; `regeneratePrintFile` action.
11. **Storefront polish**: "Personalizable" badge + filter chip; DPI/safe-area warnings; storage cleanup job.

---

## 9. Storage cleanup

- `customizations` rows created and never referenced by an order older than 30 days → delete row + source + preview (extend `supabase/remove-orphans.js`).
- Guest IndexedDB entries: client-side TTL of 7 days; sweep on app mount.
- Print files for cancelled/rejected orders: kept 90 days, then purged.

---

## 10. Open questions (remaining)

1. **Min source resolution.** Defaulting to 1000 × 1000 px. Confirm.
2. **Max upload size.** Defaulting to 20 MB. Confirm.
3. **Safe-area editor.** v1 numeric inputs; v2 visual rectangle drawer — confirm v1 is OK.
4. **Multi-layer designs** (text, stickers, multi-image) — v2 stretch. v1 = single image.
5. **Template duplication** ("Duplicar plantillas desde otro producto") — v2 nice-to-have for phone-case families.
