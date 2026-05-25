import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { CustomizationKind, Product } from "@/types";

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

  // Active kinds + the currently-selected one (even if archived) so the user
  // can still see/keep their choice.
  const { data: activeKinds } = await supabase
    .from("customization_kinds")
    .select("*")
    .eq("archived", false)
    .order("sort_order")
    .returns<CustomizationKind[]>();
  let kinds = activeKinds ?? [];
  if (
    product.customization_kind_id &&
    !kinds.some((k) => k.id === product.customization_kind_id)
  ) {
    const { data: extra } = await supabase
      .from("customization_kinds")
      .select("*")
      .eq("id", product.customization_kind_id)
      .single<CustomizationKind>();
    if (extra) kinds = [...kinds, extra];
  }

  const updateWithId = updateProduct.bind(null, id);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Editar producto</h1>
        {product.customizable && product.customization_kind_id && (
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
        kinds={kinds}
      />
      <ProductItemsSection productId={id} />
    </section>
  );
}

