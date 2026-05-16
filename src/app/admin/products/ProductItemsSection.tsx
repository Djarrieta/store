import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import ProductItemsAccordion from "./ProductItemsAccordion";

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
      .not("parent_id", "is", null)
      .order("parent_id")
      .order("name")
      .returns<(Category & { parent: Pick<Category, "id" | "name"> | null })[]>(),
  ]);

  // Group variant values by parent dimension
  const dimensionMap = new Map<string, { id: string; name: string; values: { id: string; name: string }[] }>();
  for (const cat of variantCategories ?? []) {
    if (!cat.parent_id || !cat.parent) continue;
    if (!dimensionMap.has(cat.parent_id)) {
      dimensionMap.set(cat.parent_id, { id: cat.parent_id, name: cat.parent.name, values: [] });
    }
    dimensionMap.get(cat.parent_id)!.values.push({ id: cat.id, name: cat.name });
  }
  const dimensions = Array.from(dimensionMap.values());

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold">Variantes e inventario</h2>
      <ProductItemsAccordion
        productId={productId}
        items={items ?? []}
        dimensions={dimensions}
      />
    </section>
  );
}
