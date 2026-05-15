import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/types";
import ItemCard from "@/app/items/ItemCard";

export default async function Home() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("*, profile:profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<Item[]>();

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border-4 border-black bg-[var(--card)] p-6 shadow-[6px_6px_0_0_#111]">
        <h1 className="font-display text-4xl font-bold tracking-tight">Fresh Arrivals</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Discover new listings from the community catalog.
        </p>
        <Link
          href="/items"
          className="mt-4 inline-flex rounded-xl border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black shadow-[4px_4px_0_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#111]"
        >
          Browse All Items
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(items ?? []).map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {(items ?? []).length === 0 && (
        <p className="rounded-xl border-2 border-black bg-[var(--card)] p-5 text-sm">
          No items yet. After seeding the database, they will appear here.
        </p>
      )}
    </section>
  );
}
