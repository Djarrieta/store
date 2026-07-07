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
  compact?: boolean;
  customizableEnabled?: boolean;
}

export default function ProductCard({
  product,
  items = [],
  compact = false,
  customizableEnabled = false,
}: ProductCardProps) {
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
  const isCustomizable = customizableEnabled && product.customizable && !!product.customization_kind_id;

  const containerClass = compact
    ? "flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft)]"
    : "flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]";

  const bodyClass = compact
    ? "flex flex-1 flex-col gap-2 p-4"
    : "flex flex-col gap-3 p-5";

  const cta = !hasStock ? (
    compact ? (
      <Badge variant="secondary" size="sm" className="rounded-full">
        Sin stock
      </Badge>
    ) : (
      <p className="text-sm font-semibold text-[var(--error-text)]">Sin stock</p>
    )
  ) : isCustomizable ? (
    compact ? (
      hasVariants ? (
        <VariantSelector
          items={items}
          product={{ id: product.id, title: product.title, price: payablePrice, amountInCents, image }}
          customizable
        />
      ) : (
        <Link
          href={`/products/${product.id}`}
          className="block w-full rounded-[var(--radius-btn-xl)] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent-foreground)] shadow-[var(--shadow-soft)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-soft-lg)]"
        >
          Personalizar
        </Link>
      )
    ) : null
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
  ) : null;

  return (
    <article className={containerClass}>
      {product.images?.length ? (
        <div className={compact ? "px-4 pt-4" : ""}>
          <ProductImageCarousel
            images={product.images}
            title={product.title}
            compact={compact}
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center bg-[var(--bg)] text-sm text-[var(--muted)]">
          No image
        </div>
      )}
      <div className={bodyClass}>
        {compact ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/products/${product.id}`}
                className="font-display line-clamp-1 text-lg font-medium hover:text-[var(--accent)]"
              >
                {product.title}
              </Link>
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
            {product.description && (
              <p className="line-clamp-2 text-sm text-[var(--muted)]">{product.description}</p>
            )}
            <div className="flex items-center justify-end gap-2">
              <Link
                href={`/products/${product.id}`}
                className="text-xs font-semibold underline underline-offset-2 text-[var(--muted)] hover:text-[var(--fg)]"
              >
                Ver detalle →
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-medium tracking-tight">{product.title}</h1>
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
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm" className="rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}

        {cta && <div className="mt-auto pt-2">{cta}</div>}
      </div>
    </article>
  );
}
