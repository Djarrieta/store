import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CustomizationKind } from "@/types";

import { createProduct } from "../actions";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: kinds } = await supabase
    .from("customization_kinds")
    .select("*")
    .eq("archived", false)
    .order("sort_order")
    .returns<CustomizationKind[]>();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nuevo producto</h1>
      <p className="text-sm text-[var(--muted)]">Después de guardar podrás agregar variantes e inventario.</p>
      <ProductForm action={createProduct} kinds={kinds ?? []} />
    </section>
  );
}
