import Button from "@/app/components/Button";
import FilterableList from "@/app/components/FilterableList";
import PageHeader from "@/app/components/PageHeader";
import { PAGE_SIZE } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/flags";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithCategory } from "@/types";

import { deleteProduct } from "./actions";

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

  const customizableFlag = await isFeatureEnabled("customizable_products");
  if (!customizableFlag) {
    query = query.eq("customizable", false);
  }

  const { data: rawProducts, count } = await query.range(from, to);
  const products = rawProducts as ProductWithCategory[] | null;
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
              className="flex items-center justify-between rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-[3px_3px_0_0_var(--shadow)]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{product.title}</p>
                  {product.ocultar && (
                    <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--warning)] px-2 py-0.5 text-xs font-semibold">
                      Oculto
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {formatCurrency(Number(product.price))}
                  {product.discount > 0 && (
                    <span className="ml-1 text-[var(--ok-text)]">−{product.discount}%</span>
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
                <Button
                  href={`/admin/products/${product.id}/edit`}
                  variant="secondary"
                  size="sm"
                  shadow
                >
                  Editar
                </Button>
                <form
                  action={async () => {
                    "use server";
                    await deleteProduct(product.id);
                  }}
                >
                  <Button variant="danger" size="sm" shadow type="submit" confirm>
                    Eliminar
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </FilterableList>
    </PageHeader>
  );
}
