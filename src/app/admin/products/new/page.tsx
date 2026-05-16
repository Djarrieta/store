import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { createProduct } from "../actions";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("type", "product")
    .order("parent_id", { ascending: true, nullsFirst: true })
    .order("name")
    .returns<Category[]>();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nuevo producto</h1>
      <p className="text-sm text-[var(--muted)]">Después de guardar podrás agregar variantes e inventario.</p>
      <ProductForm action={createProduct} categories={categories ?? []} />
    </section>
  );
}
