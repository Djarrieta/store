import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/types";
import { updateContent } from "@/app/admin/content/actions";
import Button from "@/app/components/Button";

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
          <textarea
            id="value"
            name="value"
            defaultValue={entry.value}
            rows={8}
            className="w-full rounded-xl border-2 border-black p-3 text-sm shadow-[3px_3px_0_0_#111] focus:outline-none focus:ring-2 focus:ring-black"
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
          <Link
            href="/admin/content"
            className="inline-flex items-center rounded-xl border-2 border-black bg-white px-6 py-3 font-bold shadow-[4px_4px_0_0_#111] transition-all hover:bg-[var(--bg)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
