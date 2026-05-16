---
applyTo: "src/app/**/actions.ts"
---

# Server Actions Conventions

Every `actions.ts` file must:

1. Start with `"use server"` at the top.
2. Call `requireAdmin()` or `requireAuth()` (from `@/lib/auth`) as the **first line** of every exported action.
3. Call `revalidatePath(...)` **before** `redirect(...)`.
4. Throw `new Error(error.message)` when the Supabase call returns an error — never swallow errors silently.

## Input parsing

- **Tags**: comma-split → `.trim()` → `.toLowerCase()` → `.filter(Boolean)`
- **Images**: `JSON.parse(formData.get("images") ?? "[]")` — wrap in try/catch for safety
- **Text fields**: `.trim().slice(0, MAX_TITLE_LENGTH)` / `MAX_DESCRIPTION_LENGTH` from `@/lib/constants`

## Admin vs. user actions

- Public catalog mutations (products, items, orders, categories, content) → `requireAdmin()`
- User-owned data mutations → `requireAuth()`
- RPC calls that bypass RLS (e.g., `approve_order`) → use `createServiceClient()` from `@/lib/supabase/service`

## Example

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAX_TITLE_LENGTH } from "@/lib/constants";

export async function createFoo(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("foos").insert({
    title: (formData.get("title") as string).trim().slice(0, MAX_TITLE_LENGTH),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/foos");
  redirect("/admin/foos");
}
```
