import { createClient } from "@/lib/supabase/server";
import type { ProductWithCategory } from "@/types";
import ProductCard from "@/app/components/ProductCard";
import PageHeader from "@/app/components/PageHeader";
import FilterableList from "@/app/components/FilterableList";
import { PAGE_SIZE } from "@/lib/constants";

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
            <ProductCard key={product.id} product={product} priority={i === 0} />
          ))}
        </div>
      </FilterableList>
    </PageHeader>
  );
}
