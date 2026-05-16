import { notFound } from "next/navigation";
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
      <form
        action={updateWithId}
        className="min-w-0 space-y-4 rounded-xl border-2 border-black bg-white p-5"
      >
        <label className="grid gap-1 text-sm font-medium">
          Nombre
          <input
            name="name"
            required
            defaultValue={category.name}
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Slug
          <input
            name="slug"
            defaultValue={category.slug}
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>

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

        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select
            name="type"
            defaultValue={category.type}
            className="w-full rounded-md border-2 border-black px-3 py-2 bg-white"
          >
            <option value="product">Producto — clasifica el producto</option>
            <option value="variant">Variante — dimensión o valor de variante (talla, color, modelo…)</option>
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold"
        >
          Actualizar categoría
        </button>
      </form>
    </section>
  );
}
