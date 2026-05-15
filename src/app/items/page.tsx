import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { Item } from "@/types";
import ItemCard from "./ItemCard";
import PageHeader from "@/app/components/PageHeader";
import FilterableList from "@/app/components/FilterableList";
import { PAGE_SIZE } from "@/lib/constants";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tags?: string;
    page?: string;
    mine?: string;
  }>;
}) {
  const { q, tags: tagsParam, page: pageStr, mine } = await searchParams;
  const user = await getUser();

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
    .select("*, profile:profiles(display_name, avatar_url)", { count: "exact" })
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

  if (mine && user) {
    query = query.eq("user_id", user.id);
  }

  const { data: items, count } = await query.range(from, to).returns<Item[]>();

  const total = count ?? 0;

  return (
    <PageHeader
      title="Items"
      createHref="/items/new"
      createLabel="New Item"
      isEmpty={total === 0 && !q && activeTags.length === 0 && !mine}
      emptyText="No items yet."
    >
      <FilterableList
        q={q}
        tags={tagsParam}
        mine={mine}
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </FilterableList>
    </PageHeader>
  );
}
