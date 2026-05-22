import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

import { updateProduct } from "../../actions";
import ProductForm from "../../ProductForm";
import ProductItemsSection from "../../ProductItemsSection";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single<Product>();

  if (!product) notFound();

  const { count: itemsCount } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  const updateWithId = updateProduct.bind(null, id);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Editar producto</h1>
        {product.customizable && product.customization_kind && (
          <a
            href={`/admin/products/${id}/preview-editor`}
            className="rounded-md border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold shadow-[2px_2px_0_0_var(--shadow)] hover:bg-[var(--bg)]"
          >
            Probar editor (sandbox)
          </a>
        )}
      </div>
      <ProductForm
        action={updateWithId}
        defaultValues={product}
        hasItems={(itemsCount ?? 0) > 0}
      />
      <ProductItemsSection productId={id} />
    </section>
  );
}

