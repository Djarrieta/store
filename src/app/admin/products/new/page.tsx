import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { createProduct } from "../actions";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("parent_id", { ascending: true, nullsFirst: true })
    .order("name")
    .returns<Category[]>();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">New Product</h1>
      <ProductForm action={createProduct} categories={categories ?? []} />
    </section>
  );
}
