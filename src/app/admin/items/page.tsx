import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Item, Product } from "@/types";
import { deleteItem } from "./actions";
import PageHeader from "@/app/components/PageHeader";
import { PAGE_SIZE } from "@/lib/constants";
import FilterableList from "@/app/components/FilterableList";

interface ItemWithProduct extends Item {
  product: Pick<Product, "id" | "title"> | null;
  item_categories: Array<{ category: { id: string; name: string } | null }>;
}

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageStr } = await searchParams;

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("items")
    .select("*, product:product_id(id, title), item_categories(category:category_id(id, name))", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    query = query.ilike("product.title", `%${q.trim()}%`);
  }

  const { data: items, count } = await query.range(from, to).returns<ItemWithProduct[]>();
  const total = count ?? 0;

  return (
    <PageHeader
      title="Inventario"
      createHref="/admin/items/new"
      createLabel="Nuevo artículo"
      isEmpty={total === 0 && !q}
      emptyText="Aún no hay artículos en stock."
    >
      <FilterableList
        q={q}
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
      >
        <div className="space-y-3">
          {(items ?? []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border-2 border-black bg-[var(--card)] p-4 shadow-[3px_3px_0_0_#111]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {item.product?.title ?? <span className="text-[var(--muted)]">Producto desconocido</span>}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Stock: <strong>{item.stock}</strong>
                  {item.item_categories.length > 0 && (
                    <> &middot; {item.item_categories.map((ic) => ic.category?.name).filter(Boolean).join(" / ")}</>
                  )}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/items/${item.id}/edit`}
                  className="rounded-lg border-2 border-black bg-[var(--accent)] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                >
                  Editar
                </Link>
                <form action={deleteItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
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
