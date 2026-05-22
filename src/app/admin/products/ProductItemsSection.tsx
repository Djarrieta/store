import { createClient } from "@/lib/supabase/server";
import type { Category, CustomizationKind, PrintTemplate } from "@/types";

import ProductItemsAccordion from "./ProductItemsAccordion";

interface ItemRow {
  id: string;
  stock: number;
  item_categories: Array<{ category: { id: string; name: string } | null }>;
  print_template: PrintTemplate | null;
}

export default async function ProductItemsSection({ productId }: { productId: string }) {
  const supabase = await createClient();

  const [
    { data: product },
    { data: rawItems },
    { data: rawCategories },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("customizable, customization_kind")
      .eq("id", productId)
      .single(),
    supabase
      .from("items")
      .select(
        "id, stock, item_categories(category:category_id(id, name)), print_template:print_templates(*)",
      )
      .eq("product_id", productId)
      .order("created_at"),
    supabase
      .from("categories")
      .select("*, parent:parent_id(id, name)")
      .not("parent_id", "is", null)
      .order("parent_id")
      .order("name"),
  ]);

  const items = rawItems as ItemRow[] | null;
  const variantCategories = rawCategories as (Category & { parent: Pick<Category, "id" | "name"> | null })[] | null;
  const customizable = Boolean(product?.customizable);
  const customizationKind = (product?.customization_kind ?? null) as CustomizationKind | null;

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
        customizable={customizable}
        customizationKind={customizationKind}
      />
    </section>
  );
}
