import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { createCategory } from "../actions";
import NameWithSlug from "@/app/components/NameWithSlug";
import Button from "@/app/components/Button";

export default async function NewCategoryPage() {
  const supabase = await createClient();
  const { data: topLevel } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .order("name")
    .returns<Category[]>();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nueva categoría</h1>
      <form
        action={createCategory}
        className="min-w-0 space-y-4 rounded-xl border-2 border-black bg-white p-5"
      >
        <NameWithSlug namePlaceholder="ej. Cámaras" />

        <label className="grid gap-1 text-sm font-medium">
          Categoría padre (dejar en blanco para nivel superior)
          <select
            name="parent_id"
            className="w-full rounded-md border-2 border-black px-3 py-2 bg-white"
          >
            <option value="">— Nivel superior —</option>
            {(topLevel ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <Button variant="primary" size="lg" type="submit">
          Crear categoría
        </Button>
      </form>
    </section>
  );
}
