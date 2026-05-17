---
applyTo: "src/**/*.ts,src/**/*.tsx"
---

## Supabase Query Typing

Do **not** use the deprecated `.returns<T>()` method on Supabase query chains.

Instead, remove `.returns<T>()` and cast the destructured `data` with `as T | null`:

```ts
// ❌ Deprecated
const { data: items } = await supabase
  .from("items")
  .select("*")
  .returns<Item[]>();

// ✅ Correct
const { data: rawItems } = await supabase
  .from("items")
  .select("*");
const items = rawItems as Item[] | null;
```

For action functions that return the data directly:

```ts
// ✅ Correct
const { data, error } = await supabase.from("items").select("*");
if (error) throw new Error(error.message);
return (data as Item[] | null) ?? [];
```
