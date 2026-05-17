# Plan: Cart-Aware Chat Assistant

## Problem Statement

The AI chat assistant currently has no knowledge of what the user has in their shopping cart. It can query products, prices, and stock via tools, but it cannot reference the user's active cart (items, quantities, totals) when answering questions like "¿cuánto me sale el envío con lo que tengo en el carrito?" or "¿puedes completar mi pedido con lo que ya tengo?".

The cart lives entirely in client-side state (React context + `localStorage`). The `sendMessage` Server Action receives only a plain text message, so `buildPrompt` runs server-side with no visibility into cart contents.

---

## Proposed Approach

Pass the serialized cart from the `ChatWidget` (a Client Component that already has `useCart()`) to the `sendMessage` Server Action as an additional parameter. The server action forwards it to `buildPrompt`, which formats it as a human-readable block and injects it into the system prompt via a new `{{cartSummary}}` placeholder.

No database changes are needed — cart data is ephemeral and belongs in the prompt context, not persisted.

**Data flow:**
```
useCart() → CartWidget (client)
  → sendMessage(message, cartItems) (Server Action)
    → buildPrompt(message, userRef, cartItems)
      → ASSISTANT_PROMPT with {{cartSummary}} filled in
```

---

## Files to Create or Modify

| File | Change |
|------|--------|
| `src/lib/assistant/prompt.ts` | Add a `{{cartSummary}}` placeholder in the prompt template, positioned after the user addresses section (before the tools section). Include a note for the assistant to reference the cart when relevant. |
| `src/lib/assistant/buildPrompt.ts` | Accept an optional third argument `cartItems: CartItem[]`. Build a `cartSummary` string: if the array is empty, output `"El carrito está vacío."`, otherwise list each item with title, quantity, and unit price, plus the subtotal. Add `.replace("{{cartSummary}}", cartSummary)` to the final prompt construction. Import `CartItem` from `@/lib/cart`. |
| `src/app/chat/actions.ts` | Update `sendMessage` signature to accept an optional second parameter `cartItems: CartItem[]` (default `[]`). Forward it to `buildPrompt`. Import `CartItem` from `@/lib/cart`. |
| `src/app/chat/ChatWidget.tsx` | Import `useCart` and destructure `items` from it. Pass `items` as the second argument when calling `sendMessage(text, items)`. |

---

## Database Changes

None.

---

## Open Questions

1. **Guest cart**: Guest users can have items in the cart without being logged in. The current `buildPrompt` already handles guests. Should the cart summary be included for guests too, or only for authenticated users? *(Recommendation: include for both — cart context is useful regardless of auth state.)*

2. **Sensitive data exposure**: Cart items contain `id`, `title`, `price`, `amountInCents`, and `quantity`. None of these are sensitive, but the Server Action will receive client-supplied data. Should there be a max-items guard (e.g. ignore carts with more than 50 items) to prevent prompt injection via manipulated cart content?

3. **`CartItem` type import in server code**: `CartItem` is exported from `src/lib/cart.tsx`, which is a `"use client"` file. Importing a type from a client file into a server file is allowed in TypeScript (type-only imports), but it should be verified that the build does not warn or error. An alternative is to extract the `CartItem` type to `src/types/` to keep the boundary clean.
