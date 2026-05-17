import FilterableList from "@/app/components/FilterableList";
import PageHeader from "@/app/components/PageHeader";
import ProductCard from "@/app/components/ProductCard";
import { PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ItemWithCategories, ProductWithCategory } from "@/types";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tags?: string;
    page?: string;
  }>;
}) {
  const { q, tags: tagsParam, page: pageStr } = await searchParams;

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const activeTags = (tagsParam ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, category:category_id(*, parent:parent_id(*))", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    const term = `%${q
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")}%`;

    query = query.or(`title_search.ilike.${term},description_search.ilike.${term}`);
  }

  if (activeTags.length > 0) {
    query = query.contains("tags", activeTags);
  }

  const { data: products, count } = await query.range(from, to).returns<ProductWithCategory[]>();

  // Load items with variant categories for all products on this page
  const productIds = (products ?? []).map((p) => p.id);
  const itemsByProduct = new Map<string, ItemWithCategories[]>();
  if (productIds.length > 0) {
    const { data: allItems } = await supabase
      .from("items")
      .select("id, product_id, stock, item_categories(category:category_id(id, name, parent_id, parent:parent_id(id, name)))")
      .in("product_id", productIds)
      .returns<ItemWithCategories[]>();
    for (const item of allItems ?? []) {
      if (!itemsByProduct.has(item.product_id)) itemsByProduct.set(item.product_id, []);
      itemsByProduct.get(item.product_id)!.push(item);
    }
  }

  const total = count ?? 0;

  return (
    <PageHeader
      title="Productos"
      isEmpty={total === 0 && !q && activeTags.length === 0}
      emptyText="Aún no hay productos."
    >
      <FilterableList
        q={q}
        tags={tagsParam}
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((product, i) => (
            <ProductCard key={product.id} product={product} items={itemsByProduct.get(product.id) ?? []} priority={i === 0} />
          ))}
        </div>
      </FilterableList>
    </PageHeader>
  );
}
