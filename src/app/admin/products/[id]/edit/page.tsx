import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types";
import { updateProduct } from "../../actions";
import ProductForm from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single<Product>(),
    supabase
      .from("categories")
      .select("*")
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("name")
      .returns<Category[]>(),
  ]);

  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, id);

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Editar producto</h1>
      <ProductForm
        action={updateWithId}
        defaultValues={product}
        categories={categories ?? []}
      />
    </section>
  );
}
