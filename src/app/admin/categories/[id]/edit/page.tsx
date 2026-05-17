import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { updateCategory } from "../../actions";
import NameWithSlug from "@/app/components/NameWithSlug";
import Button from "@/app/components/Button";

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
      <form
        action={updateWithId}
        className="min-w-0 space-y-4 rounded-xl border-2 border-black bg-white p-5"
      >
        <NameWithSlug defaultName={category.name} defaultSlug={category.slug} />

        <label className="grid gap-1 text-sm font-medium">
          Categoría padre
          <select
            name="parent_id"
            defaultValue={category.parent_id ?? ""}
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
          Actualizar categoría
        </Button>
      </form>
    </section>
  );
}
