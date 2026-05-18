import { notFound } from "next/navigation";

import AddToCartButton from "@/app/components/AddToCartButton";
import Breadcrumb from "@/app/components/Breadcrumb";
import ProductImageCarousel from "@/app/components/ProductImageCarousel";
import VariantSelector from "@/app/components/VariantSelector";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ItemWithCategories, ProductWithCategory } from "@/types";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: product }, { data: rawItems }] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:category_id(*, parent:parent_id(*))")
      .eq("id", id)
      .eq("ocultar", false)
      .single<ProductWithCategory>(),
    supabase
      .from("items")
      .select("id, stock, item_categories(category:category_id(id, name, parent_id, parent:parent_id(id, name)))")
      .eq("product_id", id),
  ]);
  const items = rawItems as ItemWithCategories[] | null;

  if (!product) notFound();

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

  const itemList = items ?? [];
  const hasVariants = itemList.some((i) => i.item_categories.length > 0);
  const singleItem = !hasVariants && itemList.length === 1 ? itemList[0] : null;
  const isPurchasable = itemList.some((i) => i.stock > 0);

  return (
    <article className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Productos", href: "/" },
          { label: product.title },
        ]}
      />
      <div className="rounded-2xl border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#111]">
        <ProductImageCarousel images={product.images} title={product.title} />

        <h1 className="font-display text-3xl font-bold">{product.title}</h1>
        {product.description && (
          <p className="mt-2 text-sm text-[var(--muted)]">{product.description}</p>
        )}

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <strong>Precio:</strong>{" "}
            {effectivePrice !== null ? (
              <>
                <span>{formatCurrency(effectivePrice)}</span>
                <span className="ml-2 text-[var(--muted)] line-through">
                  {formatCurrency(product.price)}
                </span>
                <span className="ml-2 text-green-700 font-semibold">
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
          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border-2 border-black px-3 py-0.5 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {!isPurchasable ? (
          <p className="mt-4 text-sm font-semibold text-red-600">Sin stock</p>
        ) : hasVariants ? (
          <VariantSelector
            items={itemList}
            product={{ title: product.title, price: payablePrice, amountInCents, image: product.images?.[0]?.url }}
          />
        ) : (
          <AddToCartButton
            id={singleItem!.id}
            title={product.title}
            price={payablePrice}
            amountInCents={amountInCents}
            image={product.images?.[0]?.url}
          />
        )}
      </div>
    </article>
  );
}
