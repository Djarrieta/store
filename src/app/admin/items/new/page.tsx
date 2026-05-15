import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";
import { createItem } from "../actions";

export default async function NewAdminItemPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, title")
    .order("title")
    .returns<Pick<Product, "id" | "title">[]>();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">New Stock Item</h1>
      <form
        action={createItem}
        className="min-w-0 space-y-4 rounded-xl border-2 border-black bg-white p-5"
      >
        <label className="grid gap-1 text-sm font-medium">
          Product
          <select
            name="product_id"
            required
            className="w-full rounded-md border-2 border-black px-3 py-2 bg-white"
          >
            <option value="">— Select a product —</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          SKU (optional)
          <input
            name="sku"
            placeholder="e.g. RED-L"
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={0}
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold"
        >
          Create Item
        </button>
      </form>
    </section>
  );
}
