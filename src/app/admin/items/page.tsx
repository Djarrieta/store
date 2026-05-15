import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/types";
import { deleteItem } from "@/app/items/actions";
import PageHeader from "@/app/components/PageHeader";
import FilterableList from "@/app/components/FilterableList";
import { PAGE_SIZE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

export default async function AdminItemsPage({
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
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const supabase = await createClient();

  let query = supabase
    .from("items")
    .select("*", { count: "exact" })
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

  const { data: items, count } = await query.range(from, to).returns<Item[]>();
  const total = count ?? 0;

  return (
    <PageHeader
      title="Manage Items"
      createHref="/admin/items/new"
      createLabel="New Item"
      isEmpty={total === 0 && !q && activeTags.length === 0}
      emptyText="No items yet."
    >
      <FilterableList
        q={q}
        tags={tagsParam}
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
                <p className="truncate font-semibold">{item.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {formatCurrency(Number(item.price))}
                  {item.tags.length > 0 && (
                    <> &middot; {item.tags.join(", ")}</>
                  )}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/items/${item.id}/edit`}
                  className="rounded-lg border-2 border-black bg-[var(--accent)] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                >
                  Edit
                </Link>
                <form action={deleteItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  >
                    Delete
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
