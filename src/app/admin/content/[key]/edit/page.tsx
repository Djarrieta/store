import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/types";
import { updateContent } from "@/app/admin/content/actions";

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
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl border-2 border-black bg-[var(--accent)] px-5 py-2 text-sm font-bold shadow-[3px_3px_0_0_#111] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            Guardar
          </button>
          <a
            href="/admin/content"
            className="rounded-xl border-2 border-black bg-white px-5 py-2 text-sm font-bold shadow-[3px_3px_0_0_#111] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            Cancelar
          </a>
        </div>
      </form>
    </section>
  );
}
