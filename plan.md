# Plan: Módulo de Envíos

## Decisiones capturadas

| Pregunta | Decisión |
|----------|----------|
| Sin dirección al pagar | Modal inline dentro del carrito (sin salir) |
| Múltiples direcciones | Sí — lista guardada, elige una al checkout |
| Costo de envío | Precio fijo por ciudad (tabla `ships`) |
| Umbral envío gratis | Columna `free_above_cop` en tabla `ships_config` (global, 1 fila) |
| Admin gestiona tarifas | CRUD completo en `/admin/ships` |
| Dirección en orden | JSON snapshot + costo de envío dentro de `orders` |
| Botón Buy Now producto | Mismo flujo que el carrito |
| Granularidad ciudad | Texto libre (admin escribe departamento/ciudad) |
| Campos de dirección | recipient_name, department, city, address_line, neighborhood (opcional), phone |
| Ciudad sin cobertura | Permitir igual — `shipping_cost = 0`, mostrar "Envío a coordinar"; el admin gestiona manualmente |
| `/perfil` contenido | Direcciones de envío + historial de órdenes del usuario |
| Borrar dirección default | Auto-promover la más reciente (trigger SQL) |
| Cargar direcciones en modal | Server Action al abrir el modal (bajo demanda) |
| `selectedAddress` en localStorage | Sí — persistir junto con el carrito |

---

## Fase 1 — Base de datos

### 1.1 Nueva migración `14_addresses.sql`

Tabla `addresses` — direcciones de envío del usuario.

```
id            uuid PK
user_id       uuid FK → auth.users ON DELETE CASCADE
recipient_name text NOT NULL
department    text NOT NULL
city          text NOT NULL
address_line  text NOT NULL        -- e.g. "Cra 7 # 45-20 Apto 301"
neighborhood  text                 -- nullable
phone         text NOT NULL
is_default    boolean NOT NULL DEFAULT false
created_at    timestamptz
updated_at    timestamptz
```

- Trigger `set_updated_at`.
- RLS: el usuario solo ve y modifica sus propias direcciones.
- Lógica de `is_default`:
  - Al marcar default → trigger actualiza las demás del mismo `user_id` a `false`.
  - Al eliminar la default → trigger promueve la dirección más reciente restante (`ORDER BY created_at DESC LIMIT 1`). Si no quedan más, no hace nada.

### 1.2 Nueva migración `15_ships.sql`

**Tabla `ships`** — tarifas de envío por ciudad.

```
id              uuid PK
department      text NOT NULL
city            text NOT NULL
price_cop       numeric(10,2) NOT NULL
estimated_days  int NOT NULL
created_at      timestamptz
updated_at      timestamptz
UNIQUE (department, city)
```

**Tabla `ships_config`** — configuración global de envíos.

```
id              uuid PK (siempre 1 fila)
free_above_cop  numeric(10,2)   -- NULL = sin envío gratis
created_at      timestamptz
updated_at      timestamptz
```

- Se inserta la fila única en la migración con `free_above_cop = NULL`.
- RLS: solo admins pueden modificar ambas tablas; lectura pública (los clientes deben consultar el costo).

### 1.3 Modificar migración existente `11_orders.sql`

Agregar columnas a `orders`:

```
shipping_address  jsonb     -- snapshot: {recipient_name, department, city, address_line, neighborhood, phone}
shipping_cost     numeric(10,2) NOT NULL DEFAULT 0
address_id        uuid      -- referencia suave (nullable, no FK rígida porque es snapshot)
```

---

## Fase 2 — Tipos TypeScript

Archivo nuevo `src/types/address.ts`:
```ts
export type Address = {
  id: string;
  user_id: string;
  recipient_name: string;
  department: string;
  city: string;
  address_line: string;
  neighborhood: string | null;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};
```

Archivo nuevo `src/types/ship.ts`:
```ts
export type Ship = {
  id: string;
  department: string;
  city: string;
  price_cop: number;
  estimated_days: number;
};

export type ShipsConfig = {
  id: string;
  free_above_cop: number | null;
};
```

Actualizar `src/types/order.ts` para incluir `shipping_address`, `shipping_cost`, `address_id`.

---

## Fase 3 — Página de perfil del usuario `/perfil`

### Archivos nuevos
```
src/app/perfil/
  page.tsx          -- Server Component: lista de direcciones + formulario
  actions.ts        -- createAddress, updateAddress, deleteAddress, setDefaultAddress
```

### Comportamiento
- Lista las direcciones guardadas del usuario (tarjetas con dirección completa).
- Botón "Agregar dirección" abre formulario inline (sin navegación).
- Cada tarjeta tiene: editar, eliminar, "Usar como principal" (badge verde si es default).
- Acceso: `requireAuth()`.

### Enlace en nav
- Agregar enlace a `/perfil` en `UserMenu.tsx` (junto a logout).

---

## Fase 4 — Admin: tarifas de envío `/admin/ships`

### Archivos nuevos
```
src/app/admin/ships/
  page.tsx          -- Lista de ciudades + configuración de envío gratis
  new/page.tsx      -- Formulario nueva tarifa
  [id]/edit/page.tsx -- Editar tarifa
  actions.ts        -- createShip, updateShip, deleteShip, updateShipsConfig
```

### Comportamiento
- Tabla con columnas: Departamento · Ciudad · Precio · Días estimados · Acciones.
- Botón "Nueva tarifa".
- Sección separada debajo: "Envío gratis desde $X" — campo numérico editable (o vacío = desactivado). Se guarda en `ships_config`.
- Enlace en `AdminNav.tsx`.

---

## Fase 5 — Lógica de selección de envío en el carrito

### Cambios en `CartContext` (`src/lib/cart.tsx`)
- Agregar estado: `selectedAddress: Address | null`.
- Agregar estado: `shippingCost: number` (0 si no hay dirección o si aplica envío gratis).
- Agregar estado: `shippingDisplay: 'loading' | 'free' | 'price' | 'unknown_city' | 'none'` — controla qué muestra el CartDrawer.
- Acciones: `setSelectedAddress(address)`, `clearAddress()`.
- El total visible en el carrito = subtotal de items + `shippingCost`.
- **Persistencia en localStorage**: `selectedAddress` se guarda y restaura junto con los items del carrito. Al restaurar, si el usuario no está autenticado, se descarta.

### Función de negocio (`src/lib/shipping.ts`, nueva)
```ts
getShippingCost(city: string, department: string, subtotal: number): Promise<{
  cost: number;               // 0 si aplica envío gratis o ciudad sin tarifa
  estimated_days: number | null;
  isFree: boolean;
  isUnknownCity: boolean;     // true si la ciudad no está en la tabla
}>
```
- Consulta `ships` por `city + department` (case-insensitive, usando columnas `_search`).
- Consulta `ships_config.free_above_cop`.
- Si `subtotal >= free_above_cop` → `cost = 0, isFree = true`.
- Si la ciudad **no está** en la tabla → `cost = 0, isUnknownCity = true`. El checkout se permite; la orden queda con `shipping_cost = 0` y el admin coordina manualmente.

### Cambios en `CartDrawer.tsx`
1. **Footer**: mostrar dirección seleccionada (tarjeta compacta con nombre + ciudad). Si no hay, mostrar aviso `"Agrega una dirección de envío"`.
2. **Desglose de totales**: Subtotal / Envío (`$X`, `"Gratis"`, `"A coordinar"` si ciudad sin tarifa, o `"—"` si no hay dirección) / **Total**.
3. **Botón Comprar**: bloqueado solo si `selectedAddress === null`. Si la ciudad no tiene cobertura, se permite pero la UI muestra `"Envío a coordinar"`.

### Nuevo componente `AddressModal`
```
src/app/components/AddressModal.tsx   -- Client Component
```
- Modal que aparece sobre el `CartDrawer` (z-index superior).
- Al abrirse, llama a un **Server Action** (`getMyAddresses`) para cargar las direcciones del usuario.
- Dos estados:
  - **Lista de direcciones**: lista las guardadas, permite seleccionar una. Si no hay ninguna → muestra directamente el formulario.
  - **Formulario nueva dirección**: campos completos (Fase 1). Al guardar → Server Action → recarga lista y la selecciona automáticamente.
- Al seleccionar existente → actualiza `selectedAddress` en el CartContext.

---

## Fase 6 — Integración con checkout (`BuyNowButton` + `orders`)

### Cambios en `BuyNowButton.tsx`
- Recibe prop adicional: `shippingAddress: Address`, `shippingCost: number`.
- Los pasa a `createOrderAndCheckout`.

### Cambios en `src/app/actions/orders.ts`
- `createOrderAndCheckout` acepta `shippingAddress` (snapshot JSON) y `shippingCost`.
- Inserta esos valores en la fila de `orders`.
- El `amountInCents` enviado a Wompi incluye el costo de envío.

### Botón Buy Now en `/products/[id]`
- Al pulsar, verificar si el usuario tiene dirección default.
  - Si sí: usar la default directamente.
  - Si no: abrir `AddressModal` (misma lógica que el carrito).
- Requiere refactor del componente `WompiButton.tsx` → convertirlo en Client Component con estado de dirección (o reemplazarlo por `BuyNowButton` + `AddressModal`).

---

## Fase 7 — Vista de orden (admin y usuario)

- En `/admin/orders/[id]`: mostrar sección "Dirección de envío" con el snapshot JSON + costo de envío.
- En `/perfil` (historial de órdenes): listar órdenes del usuario con estado, total, fecha y dirección de entrega.

---

## Notas de implementación críticas

### Wompi — hash de integridad
El `amountInCents` enviado a Wompi debe incluir `subtotal + shippingCost`. El hash de integridad (`reference + amountInCents + currency + secret`) se recalcula **en el servidor** dentro de `createOrderAndCheckout` con el total final. El cliente envía `shippingCost` como parámetro; el servidor lo suma y firma.

### `ships_config` — fila única
La migración inserta la fila única con `INSERT ... ON CONFLICT DO NOTHING`. Las actualizaciones usan siempre `UPDATE` (nunca `INSERT`). No se expone endpoint de creación desde el admin.

### Columnas `_search` en `ships`
Se agregan `department_search` y `city_search` como columnas generadas (`lower(unaccent(...))`), igual que en productos/items, para búsqueda accent-insensitive en el admin.

---

## Orden de implementación recomendado

1. Migraciones (14, 15) + actualizar 11 → `npm run db:reset`
2. Tipos TypeScript
3. Server Actions de `addresses` + página `/perfil`
4. Admin `/admin/ships` (CRUD tarifas + config envío gratis)
5. `src/lib/shipping.ts` (lógica de costos)
6. CartContext (estado `selectedAddress` + `shippingCost`)
7. `AddressModal` component
8. `CartDrawer` — integración de dirección + desglose
9. `BuyNowButton` + `orders.ts` — pasar dirección y costo a Wompi
10. Producto individual — flujo de dirección en Buy Now
11. Vista de dirección en admin orders

---

## Archivos a crear/modificar (resumen)

| Acción | Archivo |
|--------|---------|
| CREAR | `supabase/migrations/14_addresses.sql` |
| CREAR | `supabase/migrations/15_ships.sql` |
| EDITAR | `supabase/migrations/11_orders.sql` |
| CREAR | `src/types/address.ts` |
| CREAR | `src/types/ship.ts` |
| EDITAR | `src/types/order.ts` |
| CREAR | `src/lib/shipping.ts` |
| EDITAR | `src/lib/cart.tsx` |
| CREAR | `src/app/perfil/page.tsx` |
| CREAR | `src/app/perfil/actions.ts` |
| CREAR | `src/app/admin/ships/page.tsx` |
| CREAR | `src/app/admin/ships/new/page.tsx` |
| CREAR | `src/app/admin/ships/[id]/edit/page.tsx` |
| CREAR | `src/app/admin/ships/actions.ts` |
| CREAR | `src/app/components/AddressModal.tsx` |
| EDITAR | `src/app/components/CartDrawer.tsx` |
| EDITAR | `src/app/components/BuyNowButton.tsx` |
| EDITAR | `src/app/actions/orders.ts` |
| EDITAR | `src/app/products/[id]/WompiButton.tsx` |
| EDITAR | `src/app/components/UserMenu.tsx` |
| EDITAR | `src/app/admin/AdminNav.tsx` |
