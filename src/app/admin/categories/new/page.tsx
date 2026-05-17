import Button from "@/app/components/Button";
import { Select } from "@/app/components/Input";
import NameWithSlug from "@/app/components/NameWithSlug";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { createCategory } from "../actions";

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
          <Select name="parent_id">
            <option value="">— Nivel superior —</option>
            {(topLevel ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </label>

        <Button variant="primary" size="lg" shadow type="submit">
          Crear categoría
        </Button>
      </form>
    </section>
  );
}
