import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithCategory } from "@/types";
import { deleteProduct } from "./actions";
import PageHeader from "@/app/components/PageHeader";
import FilterableList from "@/app/components/FilterableList";
import { PAGE_SIZE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tags?: string; page?: string }>;
}) {
  const { q, tags: tagsParam, page: pageStr } = await searchParams;

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const activeTags = (tagsParam ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, category:category_id(*, parent:parent_id(*))", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    const term = `%${q.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}%`;
    query = query.or(`title_search.ilike.${term},description_search.ilike.${term}`);
  }

  if (activeTags.length > 0) {
    query = query.contains("tags", activeTags);
  }

  const { data: products, count } = await query.range(from, to).returns<ProductWithCategory[]>();
  const total = count ?? 0;

  return (
    <PageHeader
      title="Gestionar productos"
      createHref="/admin/products/new"
      createLabel="Nuevo producto"
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
        <div className="space-y-3">
          {(products ?? []).map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-xl border-2 border-black bg-[var(--card)] p-4 shadow-[3px_3px_0_0_#111]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{product.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {formatCurrency(Number(product.price))}
                  {product.discount > 0 && (
                    <span className="ml-1 text-green-700">−{product.discount}%</span>
                  )}
                  {product.category && (
                    <> &middot; {product.category.parent?.name ?? ""}{product.category.parent ? " / " : ""}{product.category.name}</>
                  )}
                  {product.tags.length > 0 && (
                    <> &middot; {product.tags.join(", ")}</>
                  )}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="rounded-md border-2 border-black px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Editar
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteProduct(product.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md border-2 border-black bg-red-100 px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </FilterableList>
    </PageHeader>
  );
}
