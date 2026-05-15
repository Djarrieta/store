import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteItem } from "../actions";
import { getUser, isAdmin } from "@/lib/auth";
import type { Item } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import Breadcrumb from "@/app/components/Breadcrumb";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select("*, profile:profiles(display_name, avatar_url)")
    .eq("id", id)
    .single<Item>();

  if (!item) notFound();

  const user = await getUser();
  const canManage = isAdmin(user?.id);

  return (
    <article className="space-y-4">
      <Breadcrumb items={[{ label: "Items", href: "/items" }, { label: item.title }]} />
      <div className="rounded-2xl border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#111]">
        <h1 className="font-display text-3xl font-bold">{item.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{item.description ?? "No description"}</p>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <strong>Price:</strong> {formatCurrency(Number(item.price))}
          </p>
          <p>
            <strong>Category:</strong> {item.category}
          </p>
          <p>
            <strong>Seller:</strong> {item.profile?.display_name ?? "Unknown"}
          </p>
          <p>
            <strong>Created:</strong> {formatDate(item.created_at)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-black px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(item.images ?? []).map((image) => (
            <Image
              key={image.url}
              src={image.url}
              alt={image.description ?? item.title}
              width={600}
              height={400}
              unoptimized
              className="h-44 w-full rounded-lg border-2 border-black object-cover"
            />
          ))}
        </div>

        {canManage ? (
          <div className="mt-6 flex items-center gap-2">
            <Link
              href={`/items/${id}/edit`}
              className="rounded-lg border-2 border-black bg-[var(--accent)] px-3 py-1 text-sm font-semibold"
            >
              Edit
            </Link>
            <form action={deleteItem.bind(null, id)}>
              <button
                type="submit"
                className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold"
              >
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </article>
  );
}
