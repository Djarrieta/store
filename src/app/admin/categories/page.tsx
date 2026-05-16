import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { deleteCategory } from "./actions";
import PageHeader from "@/app/components/PageHeader";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("parent_id", { ascending: true, nullsFirst: true })
    .order("name")
    .returns<Category[]>();

  const all = categories ?? [];
  const topLevel = all.filter((c) => c.parent_id === null);
  const byParent = (parentId: string) => all.filter((c) => c.parent_id === parentId);

  return (
    <PageHeader
      title="Categorías"
      createHref="/admin/categories/new"
      createLabel="Nueva categoría"
      isEmpty={all.length === 0}
      emptyText="Aún no hay categorías."
    >
      <div className="space-y-4">
        {topLevel.map((parent) => (
          <div
            key={parent.id}
            className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111]"
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{parent.name}</p>
                <p className="text-xs text-[var(--muted)]">{parent.slug}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/categories/${parent.id}/edit`}
                  className="rounded-md border-2 border-black px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Editar
                </Link>
                <form
                  className="flex items-center"
                  action={async () => {
                    "use server";
                    await deleteCategory(parent.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md border-2 border-black bg-red-100 px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>

            {byParent(parent.id).length > 0 && (
              <ul className="border-t-2 border-black divide-y-2 divide-black">
                {byParent(parent.id).map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <span className="text-sm font-medium">{sub.name}</span>
                      <span className="ml-2 text-xs text-[var(--muted)]">{sub.slug}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/categories/${sub.id}/edit`}
                        className="rounded-md border-2 border-black px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        Editar
                      </Link>
                      <form
                        className="flex items-center"
                        action={async () => {
                          "use server";
                          await deleteCategory(sub.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-md border-2 border-black bg-red-100 px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </PageHeader>
  );
}
