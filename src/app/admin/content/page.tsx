import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/types";
import { deleteContent } from "./actions";
import PageHeader from "@/app/components/PageHeader";
import Button from "@/app/components/Button";
import { Form } from "@/app/components/FormCard";

export default async function AdminContentPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("content")
    .select("*")
    .order("key")
    .returns<Content[]>();

  return (
    <PageHeader
      title="Gestionar contenido"
      createHref="/admin/content/new"
      createLabel="Nuevo contenido"
      isEmpty={false}
    >
      <div className="space-y-3">
        {(entries ?? []).map((entry) => (
          <div
            key={entry.key}
            className="flex items-center justify-between rounded-xl border-2 border-black bg-[var(--card)] p-4 shadow-[3px_3px_0_0_#111]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold font-mono">{entry.key}</p>
                {entry.pinned ? (
                  <span className="shrink-0 rounded-full border-2 border-black bg-[var(--accent)] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0_0_#111]">
                    Siempre
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border-2 border-black bg-white px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
                    Bajo demanda
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-xl truncate text-xs text-[var(--muted)]">
                {entry.value || <span className="italic">vacío</span>}
              </p>
            </div>
            <div className="ml-4 flex shrink-0 gap-2">
              <Button
                href={`/admin/content/${entry.key}/edit`}
                variant="secondary"
                size="sm"
                shadow
              >
                Editar
              </Button>
              <Form
                action={async () => {
                  "use server";
                  await deleteContent(entry.key);
                }}
              >
                <Button variant="danger" size="sm" shadow type="submit">
                  Eliminar
                </Button>
              </Form>
            </div>
          </div>
        ))}
      </div>
    </PageHeader>
  );
}
