import Image from "next/image";
import Link from "next/link";
import type { Item } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";

interface ItemCardProps {
  item: Item;
  priority?: boolean;
}

export default function ItemCard({ item, priority = false }: ItemCardProps) {
  const image = item.images?.[0]?.url;

  return (
    <article className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-[4px_4px_0_0_#111]">
      {image ? (
        <Image
          src={image}
          alt={item.title}
          width={800}
          height={500}
          unoptimized
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-[var(--bg)] text-sm text-[var(--muted)]">
          No image
        </div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-1 text-base font-bold">{item.title}</h2>
          <p className="text-sm font-semibold">{formatCurrency(Number(item.price))}</p>
        </div>
        <p className="line-clamp-2 text-sm text-[var(--muted)]">{item.description ?? "No description"}</p>
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-black px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <span>{formatDate(item.created_at)}</span>
        </div>
        <Link href={`/items/${item.id}`} className="inline-flex text-sm font-semibold underline">
          View details
        </Link>
      </div>
    </article>
  );
}
