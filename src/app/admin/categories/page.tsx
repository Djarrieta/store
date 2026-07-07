import Button from "@/app/components/Button";
import { Form } from "@/app/components/FormCard";
import PageHeader from "@/app/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

import { deleteCategory } from "./actions";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: rawCategories } = await supabase
    .from("categories")
    .select("*")
    .order("parent_id", { ascending: true, nullsFirst: true })
    .order("name");
  const categories = rawCategories as Category[] | null;

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
            className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{parent.name}</p>
                <p className="text-xs text-[var(--muted)]">{parent.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button href={`/admin/categories/${parent.id}/edit`} variant="secondary" size="sm" shadow>
                  Editar
                </Button>
                <Form
                  className="flex items-center"
                  action={async () => {
                    "use server";
                    await deleteCategory(parent.id);
                  }}
                >
                  <Button variant="danger" size="sm" shadow type="submit" confirm>
                    Eliminar
                  </Button>
                </Form>
              </div>
            </div>

            {byParent(parent.id).length > 0 && (
              <ul className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                {byParent(parent.id).map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <span className="text-sm font-medium">{sub.name}</span>
                      <span className="ml-2 text-xs text-[var(--muted)]">{sub.slug}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button href={`/admin/categories/${sub.id}/edit`} variant="secondary" size="sm" shadow>
                        Editar
                      </Button>
                      <Form
                        className="flex items-center"
                        action={async () => {
                          "use server";
                          await deleteCategory(sub.id);
                        }}
                      >
                      <Button variant="danger" size="sm" shadow type="submit" confirm>
                          Eliminar
                        </Button>
                      </Form>
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
