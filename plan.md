# Plan — Kinds de personalización dinámicos (admin-editables)

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Representación de geometría | **PNG máscara** (alpha = región imprimible). Sin paths SVG. Sin enum `render_mode`. |
| Alcance de la geometría | **Per print_template** (como hoy). `mask_path` + `safe_area` viven en cada variante; el kind no lleva geometría. |
| Aspect-ratio máscara vs template | **Letterboxing automático**: si el aspect del PNG difiere del rect (`width_mm/height_mm`), se centra "contain" sin distorsionar; el área fuera del contain queda como no-imprimible. |
| `kind_id` en `print_templates` | **Eliminado**. El kind se deriva siempre vía `items.product_id → products.customization_kind_id`. Se elimina el trigger `print_templates_kind_match`. |
| Evolución del `attribute_schema` | **Permitido con advertencia** (count separado de templates "huérfanas" y "incompletas"). |
| Archivado de kind | **Bloqueado** mientras haya productos referenciándolo. |
| Compatibilidad legacy | **Ninguna**. Datos sólo desde seed. |
| Orden de migraciones | **Renumerar**: nueva `08_customization_kinds.sql`; las migraciones 08→18 actuales se renombran a 09→19. |

---

## Modelo objetivo

### Nueva tabla `customization_kinds`

Muy ligera — solo metadata semántica del tipo. Sin geometría.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text` UNIQUE | identificador estable (snake_case). Inmutable. Persistido en `OrderCustomizationSnapshot.template_kind.slug` como ID para reportes/auditoría — **no se usa en URLs admin** (las rutas siguen siendo por `id`). |
| `label` | `text` | nombre visible al admin (ej. "Funda de teléfono"). |
| `picker_label` | `text` | copy visible al cliente en el paso 1 del flujo (ej. "Elige tu teléfono"). |
| `attribute_schema` | `jsonb` | array de definiciones de campo (ver abajo). |
| `sort_order` | `int` | orden en el select admin. |
| `archived` | `bool` DEFAULT false | soft-hide del select admin. |
| `created_at` / `updated_at` | `timestamptz` | trigger `set_updated_at()`. |

**RLS**: lectura pública (la usa el storefront), escritura solo admin.

### Forma de `attribute_schema` (jsonb)

```jsonc
[
  { "key": "brand", "label": "Marca", "type": "text", "required": true, "placeholder": "ej. Apple" },
  { "key": "model", "label": "Modelo", "type": "text", "required": true, "placeholder": "ej. iPhone 15 Pro" },
  { "key": "placement", "label": "Ubicación", "type": "select", "required": true,
    "options": [{ "value": "front", "label": "Frente" }, { "value": "back", "label": "Espalda" }] }
]
```

Tipos soportados v1: `text`, `number`, `select`.

### Cambios en tablas existentes

**`products`** (en el archivo renumerado `09_products.sql`):
- Reemplazar `customization_kind text CHECK (... IN (...))` por
  `customization_kind_id uuid REFERENCES public.customization_kinds(id) ON DELETE RESTRICT`.
- Reescribir constraint: `CHECK (customizable = false OR customization_kind_id IS NOT NULL)`.

**`print_templates`** (en el archivo renumerado `17_print_templates.sql`):
- **Eliminar** la columna `kind` y el `CHECK` asociado.
- **Eliminar** el trigger `print_templates_kind_match` y su función (ya no hay nada que validar transversalmente).
- Conservar tal cual: `item_id` (PK), `label`, `attributes`, `width_mm`, `height_mm`, `print_dpi`, `mockup_path`, `mask_path`, `safe_area`.

### Snapshot en órdenes

`OrderCustomizationSnapshot` ([src/types/customization.ts](src/types/customization.ts#L34)) cambia mínimamente:

```ts
template_kind: { slug: string; label: string };  // antes: CustomizationKind enum string
// template.{mask_path, safe_area, mockup_path, width_mm, height_mm, print_dpi} sin cambio
```

`template_kind` se construye haciendo JOIN del print_template al producto al kind, y se denormaliza en el snapshot.

---

## Renumeración de migraciones

Estado actual: 01 → 18. Insertamos `08_customization_kinds.sql` y desplazamos:

| Antes | Después |
|---|---|
| `08_products.sql` | `09_products.sql` |
| `09_items.sql` | `10_items.sql` |
| `10_chat_messages.sql` | `11_chat_messages.sql` |
| `11_orders.sql` | `12_orders.sql` |
| `12_assistant_role.sql` | `13_assistant_role.sql` |
| `13_approve_order.sql` | `14_approve_order.sql` |
| `14_addresses.sql` | `15_addresses.sql` |
| `15_ships.sql` | `16_ships.sql` |
| `16_print_templates.sql` | `17_print_templates.sql` |
| `17_customizations.sql` | `18_customizations.sql` |
| `18_print_storage.sql` | `19_print_storage.sql` |

Acciones:

1. `git mv` de los 11 archivos.
2. Crear `supabase/migrations/08_customization_kinds.sql`:
   - `DROP TABLE IF EXISTS public.customization_kinds CASCADE`.
   - `CREATE TABLE ...` con las columnas de arriba.
   - Trigger `customization_kinds_updated_at`.
   - RLS (lectura pública, escritura admin).
3. Editar `09_products.sql` (renombrado): swap de columna + nuevo constraint.
4. Editar `17_print_templates.sql` (renombrado): drop columna `kind` + drop trigger/función `print_templates_kind_match`.
5. Confirmar que `19_print_storage.sql` (renombrado) sigue sirviendo sin cambios.
6. Revisar que ningún script en `supabase/*.js` (`reset.js`, `seed-*.js`) referencie migraciones por número.

## Seeds

`supabase/seed/` (orden actual: `01_categories` → `02_products` → `03_items` → `04_admin` → `05_content` → `06_ships` → `07_addresses`). Como `02_products` ya necesita FK al kind, el nuevo seed debe correr primero:

1. **Nuevo** `00_customization_kinds.sql`:
   ```sql
   INSERT INTO public.customization_kinds (slug, label, picker_label, attribute_schema, sort_order)
   VALUES
     ('phone_case', 'Funda de teléfono', 'Elige tu teléfono',
        '[
          {"key":"brand","label":"Marca","type":"text","required":true,"placeholder":"ej. Apple"},
          {"key":"model","label":"Modelo","type":"text","required":true,"placeholder":"ej. iPhone 15 Pro"}
        ]'::jsonb, 1),
     ('tshirt', 'Camiseta', 'Elige tu talla',
        '[
          {"key":"placement","label":"Ubicación","type":"select","required":true,
           "options":[{"value":"front","label":"Frente"},{"value":"back","label":"Espalda"}]}
        ]'::jsonb, 2),
     ('mug', 'Mug', 'Elige el mug',
        '[
          {"key":"wrap","label":"Wrap","type":"select","required":true,
           "options":[{"value":"full","label":"Completo"},{"value":"partial","label":"Parcial"}]}
        ]'::jsonb, 3);
   ```
2. Convertir la silueta SVG actual de t-shirt (`supabase/seed/images/tshirt-blank.svg`, hoy renderizada por `drawTshirtClip`) en un PNG máscara. Subirla al bucket `print-templates` desde `seed-storage.js` y usar su path como `mask_path` en los `print_templates` semilla de variantes de camiseta.
3. Editar `02_products.sql` y demás seeds que insertaban con string kind: usar subquery
   `(SELECT id FROM public.customization_kinds WHERE slug = 'phone_case')`.
4. `print_templates` semilla: ya no llevan columna `kind`.

---

## Tipos (`src/types/`)

Eliminar union `CustomizationKind`. Reemplazar:

```ts
// print-template.ts
export interface SafeArea { x: number; y: number; width: number; height: number }

export type KindAttributeField =
  | { key: string; label: string; type: "text" | "number"; required: boolean; placeholder?: string }
  | { key: string; label: string; type: "select"; required: boolean;
      options: { value: string; label: string }[] };

export interface CustomizationKind {
  id: string;
  slug: string;
  label: string;
  picker_label: string;
  attribute_schema: KindAttributeField[];
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrintTemplate {
  item_id: string;
  label: string;
  attributes: Record<string, string | number>;
  width_mm: number;
  height_mm: number;
  print_dpi: number;
  mockup_path: string | null;
  mask_path: string | null;
  safe_area: SafeArea | null;
  created_at: string;
  updated_at: string;
}
```

**Eliminar** `PhoneCaseAttributes`, `TshirtAttributes`, `MugAttributes`, `PrintTemplateAttributes`.

`Product` ([src/types/product.ts](src/types/product.ts)): reemplazar `customization_kind: CustomizationKind | null` por `customization_kind_id: string | null`. Exponer derivado `ProductWithKind = Product & { customization_kind: CustomizationKind | null }` para queries con JOIN.

`OrderCustomizationSnapshot` ([src/types/customization.ts](src/types/customization.ts#L34)): `template_kind` se vuelve `{ slug: string; label: string }`. El resto del bloque `template` queda igual.

---

## Server actions

### Nuevo módulo: `src/app/admin/customization-kinds/actions.ts`

```ts
"use server";
// requireAdmin en todas
- createKind(formData)
- updateKind(id, formData)   // devuelve { orphaned: number; incomplete: number } para warning UI
- archiveKind(id)            // throw si SELECT count(*) FROM products WHERE customization_kind_id = id > 0
- unarchiveKind(id)
- deleteKind(id)             // FK RESTRICT lo respalda; double-check antes
```

Validaciones:
- `slug`: snake_case, único, inmutable después de crear.
- `attribute_schema`: parsear JSON, validar shape (cada campo tiene `key` única dentro del array, `type` ∈ {text,number,select}, `select` requiere `options` no vacío).
- En `updateKind`, calcular sobre `print_templates` cuyos productos usan este kind:
  - `orphaned`: templates con keys en `attributes` que **ya no están** en el nuevo schema.
  - `incomplete`: templates a las que les **falta** un campo `required` nuevo.
  - Devolver ambos counts; no bloquea.

### Editar `src/app/admin/products/actions.ts`

- Eliminar `VALID_KINDS` y `parseKind`. Leer `customization_kind_id` del form, SELECT contra `customization_kinds` para validar existencia y no-archivado.
- **Preservar la lógica destructiva al cambiar de kind** (hoy borra items cuando cambia `customization_kind`): renombrar la variable a `customization_kind_id` y mantener el wipe. Sigue siendo necesario porque el `attribute_schema` cambia.
- `upsertPrintTemplate`: cargar el kind del producto, iterar `attribute_schema` para validar `formData.get("attr_<key>")` (presencia si `required`, valor permitido si `select`). Eliminar las ramas `if (kind === "phone_case") …`. **Conservar** parsing de `mask_path` / `safe_area` (siguen siendo per-template).

### Editar `src/app/actions/customizations.ts`

- Eliminar `VALID_KINDS`. La carga del `print_template` ahora hace JOIN al producto al kind para obtener `slug` + `label` del kind y armar `template_kind` del snapshot. `mask_path`/`safe_area` se siguen leyendo del template directamente.

Convención: `requireAdmin()` + `revalidatePath("/admin/customization-kinds")` + revalidar `/admin/products` y `/products/[id]` cuando afecte productos.

---

## Admin UI

### Nuevo módulo `/admin/customization-kinds`

Patrón del skill `new-module`:

- `page.tsx` — lista con columnas: `label`, `slug`, `# campos`, `# productos`, `archived`.
- `new/page.tsx` — formulario de creación; `slug` editable.
- `[id]/edit/page.tsx` — formulario de edición; `slug` deshabilitado.
- `KindForm.tsx` — Client Component:
  - `label`, `picker_label`, `sort_order`.
  - **Schema editor** (sub-componente cliente): lista dinámica de campos con add/remove/reorder; cada fila tiene `key`, `label`, `type`, `required`, y según `type` muestra `placeholder` o sub-editor de `options`. Serializa todo a un `<input type="hidden" name="attribute_schema" />` JSON.
  - Si está editando y el cambio rompe templates existentes, mostrar warning con los dos counts (`orphaned`, `incomplete`) calculados server-side y pasados como prop.
- Botón "Archivar" en la lista: server action; si hay productos referenciando, error con count.
- Link nuevo en [src/app/admin/AdminNav.tsx](src/app/admin/AdminNav.tsx).

### Editar `ProductForm.tsx`

- Eliminar `KIND_LABELS` hard-coded.
- Recibir prop `kinds: CustomizationKind[]` desde el server component padre (no archivados; si el producto actual usa uno archivado, agregarlo deshabilitado al final).
- El `<Select name="customization_kind_id">` itera `kinds`.

### Editar `PrintTemplateFields.tsx`

- Recibir `kind: CustomizationKind` (objeto completo).
- Eliminar bloques `if (kind === "phone_case") …` y la función `kindPlaceholder`.
- Generar inputs en loop sobre `kind.attribute_schema`:
  - `text`/`number` → `<Input name="attr_<key>" type=... />`.
  - `select` → `<Select name="attr_<key>">` con `options`.
- Pre-poblar valores desde `defaultValue?.attributes?.[field.key]`.
- Mostrar advertencia inline si `defaultValue.attributes` tiene keys huérfanas, o si faltan keys `required`.
- **Conservar** los inputs de `mockup_path`, `mask_path`, `safe_area` y el uploader cliente con `uploadStorageObject` (patrón actual, sin nueva action de upload).

---

## Cliente — flujo de personalización

### `src/app/products/[id]/page.tsx`

- Cambiar el gate: `product.customizable && product.customization_kind_id !== null`.
- Cargar el kind (JOIN) y pasar el objeto completo a `CustomizationFlow`.

### `CustomizationFlow.tsx`

- Eliminar `KIND_PICKER_LABEL`. Usar `kind.picker_label`.
- `EditorVariant` sigue llevando `template.mask_path` / `template.safe_area` desde el `print_template` (no cambia).

### `KonvaStage.tsx` — letterboxing

- **Eliminar `drawTshirtClip` y la dependencia de `tshirt-blank.svg`**. Sin código kind-specific.
- Cargar `template.mask_path` como `Konva.Image` cuando exista; aplicar como clip por alpha usando `globalCompositeOperation = 'destination-in'`. Sin `mask_path` ⇒ clip rectangular completo (sin máscara).
- **Letterboxing**: calcular `maskAspect = maskPx.w / maskPx.h` vs `templateAspect = width_mm / height_mm`. Centrar la máscara con estrategia "contain":
  - Si `maskAspect > templateAspect` (máscara más ancha): escalar al ancho del rect; centrar vertical; las bandas top/bottom fuera del contain quedan transparentes ⇒ no imprimibles.
  - Si `maskAspect < templateAspect`: escalar al alto; centrar horizontal; bandas izq/der no imprimibles.
- El editor (drag/scale de la imagen del cliente) sigue operando en el rect completo del template; el clip por alpha de la máscara recorta el resultado al render. El `safe_area` (rect normalizado al template, no a la máscara) sigue dibujándose como guía.

### `ProductCard.tsx` ([src/app/components/ProductCard.tsx](src/app/components/ProductCard.tsx#L39))

- Cambiar `product.customizable && !!product.customization_kind` por `product.customizable && !!product.customization_kind_id`.

### `localStore.ts` / `persist.ts`

- `LocalCustomization.kind`: pasa de `CustomizationKind` (string union) a `{ slug: string; label: string }`. Suficiente para el carrito; al re-editar, el editor recarga el kind completo desde el server.
- Sin compat: si al hidratar se detecta forma vieja (`typeof kind === "string"`), descartar la entrada silenciosamente. El sweep de 7 días limpia residuos.

---

## Validaciones y políticas RLS

| Acción | Quién | Política |
|---|---|---|
| SELECT `customization_kinds` | público | RLS público |
| INSERT/UPDATE/DELETE `customization_kinds` | admin | `is_admin(auth.uid())` |
| Subir/borrar PNG máscara (cliente sube directo al bucket `print-templates`) | admin | ya cubierto por `19_print_storage.sql` (renombrado) |

Reglas de negocio en server actions:
- `archiveKind` / `deleteKind`: bloquear si `SELECT count(*) FROM products WHERE customization_kind_id = $1 > 0`.
- `updateKind`: calcular `{ orphaned, incomplete }` y devolver para warning.
- `upsertPrintTemplate`: validar `attributes` contra `attribute_schema` del kind del producto padre.
- `updateProduct` con cambio de `customization_kind_id`: wipe de items (preservar lógica destructiva actual).

---

## Tareas (orden de implementación)

1. **Migraciones**: `git mv` 08→09 … 18→19; crear `08_customization_kinds.sql`; editar `09_products.sql` (swap columna + constraint) y `17_print_templates.sql` (drop `kind` + drop trigger).
2. **Seeds**: nuevo seed de kinds; convertir t-shirt SVG → PNG máscara y subirla en `seed-storage.js`; actualizar inserts de productos.
3. **Tipos**: refactor de `src/types/print-template.ts`, `product.ts`, `customization.ts`.
4. **Server actions**: nuevo `admin/customization-kinds/actions.ts`; refactor de `admin/products/actions.ts` y `actions/customizations.ts`.
5. **UI admin**: módulo `/admin/customization-kinds` con schema editor; link en `AdminNav`.
6. **UI admin productos**: refactor de `ProductForm.tsx` y `PrintTemplateFields.tsx`.
7. **Storefront**: refactor de `products/[id]/page.tsx`, `CustomizationFlow.tsx`, `KonvaStage.tsx` (letterboxing), `ProductCard.tsx`, `localStore.ts`, `persist.ts`.
8. **Verificación**: `npm run db:reset` + `npm run lint:check` + `npm run typecheck`. Flujo manual: crear kind nuevo, asignarlo a un producto, crear print_template con su máscara, comprar.
9. **Docs (post-impl)**: agregar sección "Customization" a [TECH_SPEC.md](TECH_SPEC.md) describiendo `customization_kinds` + `print_templates` + flujo. Actualizar [supabase/seed/images/README.md](supabase/seed/images/README.md) con el nuevo PNG máscara de t-shirt. README.md raíz no requiere cambios.

## Fuera de alcance v1

- Tipos de campo extra (`color`, `file`, `multi-select`, `boolean`).
- Validación condicional entre campos.
- Versionado del `attribute_schema` por print_template (la decisión "permitir con warning" asume edición destructiva).
- i18n de labels.
- Editor visual de la máscara dentro del admin (se sube PNG ya generado).
- Reuso de máscara entre templates (cada template referencia su propio path; cero deduplicación).
