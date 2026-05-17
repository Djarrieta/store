import Button from "@/app/components/Button";
import { Select } from "@/app/components/Input";
import NameWithSlug from "@/app/components/NameWithSlug";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { createCategory } from "../actions";
import { FormCard, FormActions } from "@/app/components/FormCard";

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
      <FormCard action={createCategory}>
        <NameWithSlug namePlaceholder="ej. Cámaras" />

        <Select
          label="Categoría padre (dejar en blanco para nivel superior)"
          name="parent_id"
        >
          <option value="">— Nivel superior —</option>
          {(topLevel ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>

        <FormActions>
          <Button variant="primary" size="lg" shadow type="submit">
            Crear categoría
          </Button>
        </FormActions>
      </FormCard>
    </section>
  );
}
