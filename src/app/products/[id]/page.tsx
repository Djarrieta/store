import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithCategory } from "@/types";
import { formatCurrency } from "@/lib/format";
import Breadcrumb from "@/app/components/Breadcrumb";
import AddToCartButton from "@/app/components/AddToCartButton";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, category:category_id(*, parent:parent_id(*))")
    .eq("id", id)
    .single<ProductWithCategory>();

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

  return (
    <article className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Products", href: "/" },
          { label: product.title },
        ]}
      />
      <div className="rounded-2xl border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#111]">
        {product.images.length > 0 && (
          <Image
            src={product.images[0].url}
            alt={product.title}
            width={1200}
            height={600}
            unoptimized
            priority
            className="mb-5 h-64 w-full rounded-xl border-2 border-black object-cover"
          />
        )}

        <h1 className="font-display text-3xl font-bold">{product.title}</h1>
        {product.description && (
          <p className="mt-2 text-sm text-[var(--muted)]">{product.description}</p>
        )}

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <strong>Price:</strong>{" "}
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
              <strong>Category:</strong> {categoryLabel}
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

        <AddToCartButton
          id={product.id}
          title={product.title}
          price={payablePrice}
          amountInCents={amountInCents}
          image={product.images?.[0]?.url}
        />
      </div>
    </article>
  );
}
