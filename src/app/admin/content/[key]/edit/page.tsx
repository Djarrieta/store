import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/types";
import { updateContent } from "@/app/admin/content/actions";
import Button from "@/app/components/Button";
import { Textarea } from "@/app/components/Input";

export default async function AdminEditContentPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("content")
    .select("*")
    .eq("key", key)
    .single<Content>();

  if (!entry) notFound();

  const updateWithKey = updateContent.bind(null, key);

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Editar contenido</h1>
      <p className="font-mono text-sm text-[var(--muted)]">key: {entry.key}</p>
      <form action={updateWithKey} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="value" className="block text-sm font-semibold">
            Valor
          </label>
          <Textarea
            id="value"
            name="value"
            defaultValue={entry.value}
            rows={8}
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={entry.pinned}
            className="h-4 w-4 rounded border-2 border-black accent-[var(--accent)]"
          />
          <span className="text-sm font-semibold">Inyectar siempre en el asistente</span>
        </label>
        <div className="flex gap-3">
          <Button variant="primary" size="xl" shadow type="submit">
            Guardar
          </Button>
          <Button href="/admin/content" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}
