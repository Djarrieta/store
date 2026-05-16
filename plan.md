# Plan: Chat Assistant — Contexto inteligente y logística

> **Estado:** Decisiones tomadas ✅ — Listo para implementar

## Estado actual

### Arquitectura del asistente

El asistente tiene **dos capas** que hoy se contradicen entre sí:

1. **`buildPrompt.ts`** — precarga *siempre* en el prompt:
   - Todas las filas de `content` (sin filtro)
   - Todo el catálogo de productos (hasta 100)
   - Temas contextuales (`fetchContextTopics`)
   - Historial de conversación

2. **`mcpService.ts`** — loop de tool-calling con herramientas lazy:
   - `query_products`, `query_categories`, `query_items`
   - `query_content` ← ya existe, pero nunca se usa porque el prompt ya tiene todo
   - `bot_create_order`, `bot_get_my_orders`, `bot_get_order_status`

El problema: inyectar todo en el prompt hace que el LLM pague tokens y latencia en cada mensaje, aunque el usuario solo pregunte "¿tienen envío a Bogotá?".

---

## Decisiones

| # | Pregunta | Decisión |
|---|----------|----------|
| P1 | ¿Catálogo lazy? | ✅ Sí — solo via `query_products` tool |
| P2 | ¿`fetchContextTopics` siempre inyectado? | ✅ Sí — ver recomendación abajo |
| P3 | ¿Tracking de envío? | ✅ Campo `tracking_code text` en tabla `orders` (texto libre, lo llena el admin) |
| P4 | ¿Separación visual en panel content? | ✅ Badge por fila es suficiente |
| P5 | ¿Límite de historial? | ✅ 20 mensajes + funcionalidad de resumen automático |

### Recomendación P2 — `fetchContextTopics`

Mantener siempre inyectado. Razones:
- La query es muy liviana (solo `title` + `discount`, limit 5 por consulta)
- El valor es alto: permite al asistente mencionar proactivamente ofertas sin gastar un tool-call
- Los datos cambian poco; el costo de precarga es mínimo comparado con un round-trip al LLM
- Si el catálogo es lazy (P1), este bloque da al LLM "pistas" para saber cuándo llamar `query_products`

---

## Cambios a implementar

### Fase 1 — Schema

**`supabase/migrations/06_content.sql`** — Agregar columna:
```sql
pinned boolean NOT NULL DEFAULT false
```

**`supabase/migrations/11_orders.sql`** — Agregar columna:
```sql
tracking_code text
```

**`supabase/migrations/10_chat_messages.sql`** — Agregar soporte para resúmenes:
```sql
-- role acepta 'user' | 'assistant' | 'summary'
-- El campo ya existe como text, solo cambiar el CHECK constraint si lo hay
```

**`supabase/seed/05_content.sql`** — Nuevas entradas con `pinned = false`:
```sql
('logistics_shipping', '', false),
('logistics_payment', '', false)
```

---

### Fase 2 — Tipos y `buildPrompt`

**`src/types/content.ts`** — Agregar `pinned: boolean`

**`src/lib/assistant/buildPrompt.ts`**
- Quitar: precarga de todo `content` + precarga de productos
- Agregar: query filtrada `WHERE pinned = true` → `{{pinnedContent}}`
- Historial: si existe un resumen, inyectar resumen + mensajes posteriores al resumen; si no, los últimos 20 mensajes completos

**`src/lib/assistant/chatHistory.ts`**
- Nueva función `summarizeIfNeeded(userRef)`: cuando el conteo de mensajes (sin contar resúmenes existentes) alcanza 20, llama al LLM para resumir y guarda el resumen con `role = 'summary'`
- La función `getHistory` devuelve: el último resumen (si existe) + todos los mensajes posteriores a ese resumen

---

### Fase 3 — Prompt

**`src/lib/assistant/prompt.ts`** — Reescribir:
- Reemplazar `{{storeContent}}` y `{{productCatalog}}` por `{{pinnedContent}}`
- Agregar sección de instrucciones sobre cuándo usar cada tool:
  - `query_content` → envíos, pagos, políticas, info operativa
  - `query_products` → precios, disponibilidad, catálogo
  - `query_categories` → categorías
  - `query_items` → variantes/stock detallado
- Instrucción explícita: no llamar tools si el mensaje no lo requiere

---

### Fase 4 — Admin UI: content

**`src/app/admin/content/actions.ts`** — Incluir `pinned` en `createContent` y `updateContent`

**`src/app/admin/content/new/page.tsx`** — Checkbox "Inyectar siempre en el asistente"

**`src/app/admin/content/[key]/edit/page.tsx`** — Checkbox con valor actual de `pinned`

**`src/app/admin/content/page.tsx`** — Badge "Siempre" / "Bajo demanda" por fila

---

### Fase 5 — Admin UI: orders (tracking)

**`src/app/admin/orders/[id]/page.tsx`** — Campo editable `tracking_code` (texto libre)

**`src/app/admin/orders/actions.ts`** — Acción `updateTrackingCode`

**`src/lib/assistant/mcpService.ts`** — `bot_get_order_status` handler incluye `tracking_code` en la respuesta

---

### Fase 6 — Validación

- `npm run db:reset`
- `npm run lint:check`
- `npm run typecheck`

---

## Archivos afectados (resumen)

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/06_content.sql` | + columna `pinned` |
| `supabase/migrations/11_orders.sql` | + columna `tracking_code` |
| `supabase/migrations/10_chat_messages.sql` | Verificar/ampliar constraint de `role` |
| `supabase/seed/05_content.sql` | + entradas logistics con `pinned=false` |
| `src/types/content.ts` | + campo `pinned` |
| `src/lib/assistant/buildPrompt.ts` | Quitar precarga, filtrar por pinned, historial con resumen |
| `src/lib/assistant/chatHistory.ts` | + `summarizeIfNeeded`, actualizar `getHistory` |
| `src/lib/assistant/prompt.ts` | Reescribir template y tool instructions |
| `src/lib/assistant/mcpService.ts` | `bot_get_order_status` incluye tracking_code |
| `src/app/admin/content/actions.ts` | + campo `pinned` |
| `src/app/admin/content/new/page.tsx` | + checkbox pinned |
| `src/app/admin/content/[key]/edit/page.tsx` | + checkbox pinned con valor actual |
| `src/app/admin/content/page.tsx` | + badge pinned |
| `src/app/admin/orders/[id]/page.tsx` | + campo tracking_code |
| `src/app/admin/orders/actions.ts` | + `updateTrackingCode` |

---

## Historial de conversación

### Paso: `summarizeIfNeeded`

Cuando el usuario envía un mensaje nuevo (`addMessage`), antes de persistir se evalúa:

```
mensajes sin resumen >= 20 → llamar LLM para resumir → guardar con role='summary' → los 20 mensajes originales quedan en BD (historial completo disponible), solo el resumen se inyecta al prompt
```

**En `getHistory`:**
1. Buscar el último registro con `role = 'summary'`
2. Si existe: devolver ese resumen + todos los mensajes posteriores (< 20 de nuevo)
3. Si no existe: devolver los últimos 20 mensajes normales

**En el prompt:**
- Si hay resumen: `[Resumen de conversación previa]: ... \n[Mensajes recientes]: ...`
- Si no hay resumen: `[Historial]: ...`

### Formato del resumen

El LLM recibe instrucción de resumir en ≤ 150 palabras, preservando: productos mencionados, intenciones del usuario, pedidos creados, información solicitada.
