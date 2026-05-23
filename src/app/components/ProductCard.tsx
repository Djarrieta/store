import Image from "next/image";
import Link from "next/link";

import AddToCartButton from "@/app/components/AddToCartButton";
import Badge from "@/app/components/Badge";
import VariantSelector from "@/app/components/VariantSelector";
import { formatCurrency } from "@/lib/format";
import type { ItemWithCategories, ProductWithCategory } from "@/types";

interface ProductCardProps {
  product: ProductWithCategory;
  items?: ItemWithCategories[];
  priority?: boolean;
}

export default function ProductCard({ product, items = [], priority = false }: ProductCardProps) {
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

  const hasVariants = items.some((i) => i.item_categories.length > 0);
  const singleItem = !hasVariants && items.length === 1 ? items[0] : null;
  const hasStock = items.some((i) => i.stock > 0);

  return (
    <article className="overflow-hidden rounded-[var(--radius-card)] border-2 border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)_var(--shadow-card)_0_0_var(--shadow)]">
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
          {product.customizable && product.customization_kind && (
            <Badge variant="primary" size="sm" className="rounded-full">
              Personalizable
            </Badge>
          )}
          {product.tags.map((tag) => (
            <Badge key={tag} variant="secondary" size="sm" className="rounded-full">
              {tag}
            </Badge>
          ))}
        </div>

        {!hasStock ? (
          <div className="mt-1 flex items-center justify-between gap-2">
            <Badge variant="secondary" size="sm" className="rounded-full">
              Sin stock
            </Badge>
            <Link
              href={`/products/${product.id}`}
              className="text-xs font-semibold underline underline-offset-2 text-[var(--muted)] hover:text-[var(--fg)]"
            >
              Ver detalle
            </Link>
          </div>
        ) : hasVariants ? (
          <VariantSelector
            items={items}
            product={{ id: product.id, title: product.title, price: payablePrice, amountInCents, image }}
          />
        ) : singleItem ? (
          <AddToCartButton
            id={singleItem.id}
            productId={product.id}
            itemId={singleItem.id}
            title={product.title}
            price={payablePrice}
            amountInCents={amountInCents}
            image={image}
          />
        ) : (
          <Link
            href={`/products/${product.id}`}
            className="mt-1 block w-full rounded-[var(--radius-btn-xl)] border-2 border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-center text-sm font-bold text-[var(--accent-foreground)] shadow-[var(--shadow-btn-xl)_var(--shadow-btn-xl)_0_0_var(--shadow)] transition-all hover:translate-x-[var(--shadow-btn-xl)] hover:translate-y-[var(--shadow-btn-xl)] hover:shadow-none"
          >
            Ver producto
          </Link>
        )}
      </div>
    </article>
  );
}
