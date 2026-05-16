import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, Item, Product } from "@/types";
import { updateItem } from "../../actions";

export default async function AdminEditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: item }, { data: products }, { data: variantCategories }, { data: currentCategories }] =
    await Promise.all([
      supabase.from("items").select("*").eq("id", id).single<Item>(),
      supabase.from("products").select("id, title").order("title").returns<Pick<Product, "id" | "title">[]>(),
      supabase
        .from("categories")
        .select("*, parent:parent_id(id, name)")
        .eq("type", "variant")
        .not("parent_id", "is", null)
        .order("parent_id")
        .order("name")
        .returns<(Category & { parent: Pick<Category, "id" | "name"> | null })[]>(),
      supabase
        .from("item_categories")
        .select("category_id")
        .eq("item_id", id)
        .returns<{ category_id: string }[]>(),
    ]);

  if (!item) notFound();

  const selectedIds = new Set((currentCategories ?? []).map((c) => c.category_id));

  // Group variant values by parent dimension
  const dimensionMap = new Map<string, { name: string; values: typeof variantCategories }>();
  for (const cat of variantCategories ?? []) {
    if (!cat.parent_id || !cat.parent) continue;
    if (!dimensionMap.has(cat.parent_id)) {
      dimensionMap.set(cat.parent_id, { name: cat.parent.name, values: [] });
    }
    dimensionMap.get(cat.parent_id)!.values!.push(cat);
  }
  const dimensions = Array.from(dimensionMap.entries());

  const updateWithId = updateItem.bind(null, id);

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Editar artículo de inventario</h1>
      <form
        action={updateWithId}
        className="min-w-0 space-y-4 rounded-xl border-2 border-black bg-white p-5"
      >
        <label className="grid gap-1 text-sm font-medium">
          Producto
          <select
            name="product_id"
            required
            defaultValue={item.product_id}
            className="w-full rounded-md border-2 border-black px-3 py-2 bg-white"
          >
            <option value="">— Selecciona un producto —</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>

        {dimensions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Variantes</p>
            {dimensions.map(([parentId, dim]) => (
              <fieldset key={parentId}>
                <legend className="mb-1 text-sm text-[var(--muted)]">{dim.name}</legend>
                <div className="flex flex-wrap gap-3">
                  {(dim.values ?? []).map((val) => (
                    <label key={val.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        name="category_ids"
                        value={val.id}
                        defaultChecked={selectedIds.has(val.id)}
                        className="h-4 w-4 rounded border-2 border-black"
                      />
                      {val.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        <label className="grid gap-1 text-sm font-medium">
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={item.stock}
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          Actualizar artículo
        </button>
      </form>
    </section>
  );
}
