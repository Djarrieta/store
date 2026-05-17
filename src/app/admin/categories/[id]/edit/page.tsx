import { notFound } from "next/navigation";

import Button from "@/app/components/Button";
import { FormActions,FormCard, FormField } from "@/app/components/FormCard";
import { Select } from "@/app/components/Input";
import NameWithSlug from "@/app/components/NameWithSlug";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

import { updateCategory } from "../../actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: category }, { data: topLevel }] = await Promise.all([
    supabase.from("categories").select("*").eq("id", id).single<Category>(),
    supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .neq("id", id)
      .order("name")
      .returns<Category[]>(),
  ]);

  if (!category) notFound();

  const updateWithId = updateCategory.bind(null, id);

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Editar categoría</h1>
      <FormCard action={updateWithId}>
        <NameWithSlug defaultName={category.name} defaultSlug={category.slug} />

        <FormField label="Categoría padre" htmlFor="parent_id">
          <Select id="parent_id" name="parent_id" defaultValue={category.parent_id ?? ""}>
            <option value="">— Nivel superior —</option>
            {(topLevel ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormActions>
          <Button variant="primary" size="lg" type="submit">
            Actualizar categoría
          </Button>
        </FormActions>
      </FormCard>
    </section>
  );
}
