import Badge from "@/app/components/Badge";
import Button from "@/app/components/Button";
import { Form } from "@/app/components/FormCard";
import PageHeader from "@/app/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/types";

import { deleteContent } from "./actions";

export default async function AdminContentPage() {
  const supabase = await createClient();
  const { data: rawEntries } = await supabase
    .from("content")
    .select("*")
    .order("key");
  const entries = rawEntries as Content[] | null;
  const listEntries = (entries ?? []).filter((entry) => entry.key !== "home_hero");

  return (
    <PageHeader
      title="Gestionar contenido"
      createHref="/admin/content/new"
      createLabel="Nuevo contenido"
      isEmpty={false}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
          <div className="min-w-0">
            <p className="font-medium">Sección principal (Hero)</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Título, texto e imágenes destacadas de la página de inicio.
            </p>
          </div>
          <Button href="/admin/content/hero" variant="primary" size="sm" shadow className="shrink-0">
            Editar hero
          </Button>
        </div>
        {listEntries.map((entry) => (
          <div
            key={entry.key}
            className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold font-mono">{entry.key}</p>
                {entry.pinned ? (
                  <Badge variant="primary" size="sm" shadow className="shrink-0">
                    Siempre
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="sm" className="shrink-0 text-[var(--muted)]">
                    Bajo demanda
                  </Badge>
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
                <Button variant="danger" size="sm" shadow type="submit" confirm>
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
