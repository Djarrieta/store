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

  const updateWithId = updateProduct.bind(null, id);

  return (
    <section className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Editar producto</h1>
      <ProductForm
        action={updateWithId}
        defaultValues={product}
      />
      <ProductItemsSection productId={id} />
    </section>
  );
}

