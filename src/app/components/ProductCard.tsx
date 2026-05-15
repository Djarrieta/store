import Image from "next/image";
import Link from "next/link";
import type { ProductWithCategory } from "@/types";
import { formatCurrency } from "@/lib/format";
import AddToCartButton from "@/app/components/AddToCartButton";

interface ProductCardProps {
  product: ProductWithCategory;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.images?.[0]?.url;
  const effectivePrice =
    product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : null;

  const payablePrice = effectivePrice ?? product.price;
  const amountInCents = Math.round(payablePrice * 100);

  const categoryLabel = product.category
    ? product.category.parent
      ? `${product.category.parent.name} / ${product.category.name}`
      : product.category.name
    : null;

  return (
    <article className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-[4px_4px_0_0_#111]">
      <Link href={`/products/${product.id}`} className="block">
        {image ? (
          <Image
            src={image}
            alt={product.title}
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
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-1 text-base font-bold">{product.title}</h2>
          <div className="shrink-0 text-right">
            {effectivePrice !== null ? (
              <>
                <p className="text-sm font-semibold">{formatCurrency(effectivePrice)}</p>
                <p className="text-xs text-[var(--muted)] line-through">{formatCurrency(product.price)}</p>
              </>
            ) : (
              <p className="text-sm font-semibold">{formatCurrency(product.price)}</p>
            )}
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-[var(--muted)]">{product.description ?? "No description"}</p>
        {categoryLabel && (
          <p className="text-xs text-[var(--muted)]">{categoryLabel}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {product.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-black px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>
        <AddToCartButton
          id={product.id}
          title={product.title}
          price={payablePrice}
          amountInCents={amountInCents}
          image={image}
        />
      </div>
    </article>
  );
}
