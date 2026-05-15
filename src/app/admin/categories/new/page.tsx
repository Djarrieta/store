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
      <h1 className="font-display text-3xl font-bold">New Category</h1>
      <form
        action={createCategory}
        className="min-w-0 space-y-4 rounded-xl border-2 border-black bg-white p-5"
      >
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input
            name="name"
            required
            placeholder="e.g. Cameras"
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Slug
          <input
            name="slug"
            placeholder="e.g. cameras (auto-generated from name if blank)"
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Parent category (leave blank for top-level)
          <select
            name="parent_id"
            className="w-full rounded-md border-2 border-black px-3 py-2 bg-white"
          >
            <option value="">— Top level —</option>
            {(topLevel ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold"
        >
          Create Category
        </button>
      </form>
    </section>
  );
}
