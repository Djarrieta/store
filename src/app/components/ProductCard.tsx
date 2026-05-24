import Image from "next/image";
import Link from "next/link";

import AddToCartButton from "@/app/components/AddToCartButton";
import Badge from "@/app/components/Badge";
import ProductImageCarousel from "@/app/components/ProductImageCarousel";
import VariantSelector from "@/app/components/VariantSelector";
import { formatCurrency } from "@/lib/format";
import type { ItemWithCategories, ProductWithCategory } from "@/types";

interface ProductCardProps {
  product: ProductWithCategory;
  items?: ItemWithCategories[];
  priority?: boolean;
  variant?: "card" | "detail";
}

export default function ProductCard({
  product,
  items = [],
  priority = false,
  variant = "card",
}: ProductCardProps) {
  const isDetail = variant === "detail";
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
  const isCustomizable = product.customizable && !!product.customization_kind;

  const containerClass = isDetail
    ? "overflow-hidden rounded-2xl border-4 border-[var(--border)] bg-[var(--surface)] shadow-[6px_6px_0_0_var(--shadow)]"
    : "overflow-hidden rounded-[var(--radius-card)] border-2 border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)_var(--shadow-card)_0_0_var(--shadow)]";

  const bodyClass = isDetail ? "space-y-3 p-5" : "space-y-2 p-4";

  return (
    <article className={containerClass}>
      {isDetail ? (
        <ProductImageCarousel images={product.images} title={product.title} />
      ) : (
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
      )}
      <div className={bodyClass}>
        {isDetail ? (
          <>
            <h1 className="font-display text-3xl font-bold">{product.title}</h1>
            {product.description && (
              <p className="text-sm text-[var(--muted)]">{product.description}</p>
            )}
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <strong>Precio:</strong>{" "}
                {effectivePrice !== null ? (
                  <>
                    <span>{formatCurrency(effectivePrice)}</span>
                    <span className="ml-2 text-[var(--muted)] line-through">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="ml-2 font-semibold text-[var(--ok-text)]">
                      −{product.discount}%
                    </span>
                  </>
                ) : (
                  formatCurrency(product.price)
                )}
              </p>
              {categoryLabel && (
                <p>
                  <strong>Categoría:</strong> {categoryLabel}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary" size="sm" className="rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {!hasStock ? (
          isDetail ? (
            <p className="text-sm font-semibold text-[var(--error-text)]">Sin stock</p>
          ) : (
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
          )
        ) : isCustomizable ? (
          isDetail ? null : hasVariants ? (
            <VariantSelector
              items={items}
              product={{ id: product.id, title: product.title, price: payablePrice, amountInCents, image }}
              customizable
            />
          ) : (
            <Link
              href={`/products/${product.id}`}
              className="mt-4 block w-full rounded-[var(--radius-btn-xl)] border-2 border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-center text-sm font-bold text-[var(--accent-foreground)] shadow-[var(--shadow-btn-xl)_var(--shadow-btn-xl)_0_0_var(--shadow)] transition-all hover:translate-x-[var(--shadow-btn-xl)] hover:translate-y-[var(--shadow-btn-xl)] hover:shadow-none"
            >
              Personalizar
            </Link>
          )
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
        ) : !isDetail ? (
          <Link
            href={`/products/${product.id}`}
            className="mt-1 block w-full rounded-[var(--radius-btn-xl)] border-2 border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-center text-sm font-bold text-[var(--accent-foreground)] shadow-[var(--shadow-btn-xl)_var(--shadow-btn-xl)_0_0_var(--shadow)] transition-all hover:translate-x-[var(--shadow-btn-xl)] hover:translate-y-[var(--shadow-btn-xl)] hover:shadow-none"
          >
            Ver producto
          </Link>
        ) : null}
      </div>
    </article>
  );
}
