import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { createItemForProduct, deleteItemFromProduct } from "@/app/admin/items/actions";

interface ItemRow {
  id: string;
  stock: number;
  item_categories: Array<{ category: { id: string; name: string } | null }>;
}

export default async function ProductItemsSection({ productId }: { productId: string }) {
  const supabase = await createClient();

  const [{ data: items }, { data: variantCategories }] = await Promise.all([
    supabase
      .from("items")
      .select("id, stock, item_categories(category:category_id(id, name))")
      .eq("product_id", productId)
      .order("created_at")
      .returns<ItemRow[]>(),
    supabase
      .from("categories")
      .select("*, parent:parent_id(id, name)")
      .eq("type", "variant")
      .not("parent_id", "is", null)
      .order("parent_id")
      .order("name")
      .returns<(Category & { parent: Pick<Category, "id" | "name"> | null })[]>(),
  ]);

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

  const createAction = createItemForProduct.bind(null, productId);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold">Variantes e inventario</h2>

      {(items ?? []).length > 0 ? (
        <div className="space-y-2">
          {(items ?? []).map((item) => {
            const label =
              item.item_categories
                .map((ic) => ic.category?.name)
                .filter(Boolean)
                .join(" / ") || "—";
            const deleteAction = deleteItemFromProduct.bind(null, productId, item.id);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border-2 border-black bg-[var(--card)] p-3 shadow-[2px_2px_0_0_#111]"
              >
                <div>
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="ml-3 text-xs text-[var(--muted)]">Stock: {item.stock}</span>
                </div>
                <form action={deleteAction}>
                  <button
                    type="submit"
                    className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">Este producto aún no tiene variantes.</p>
      )}

      {dimensions.length > 0 ? (
        <form
          action={createAction}
          className="space-y-4 rounded-xl border-2 border-black bg-white p-4"
        >
          <h3 className="font-semibold text-sm">Agregar variante</h3>

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
                      className="h-4 w-4 rounded border-2 border-black"
                    />
                    {val.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <label className="grid gap-1 text-sm font-medium">
            Stock
            <input
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={0}
              className="w-32 rounded-md border-2 border-black px-3 py-2"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            Agregar
          </button>
        </form>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          No hay categorías de variante creadas.{" "}
          <a href="/admin/categories" className="underline">
            Créalas en Categorías
          </a>
          .
        </p>
      )}
    </section>
  );
}
