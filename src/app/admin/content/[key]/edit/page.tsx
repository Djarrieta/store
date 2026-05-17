import { notFound } from "next/navigation";

import { updateContent } from "@/app/admin/content/actions";
import Button from "@/app/components/Button";
import { FormActions,FormCard, FormField } from "@/app/components/FormCard";
import { Checkbox,Textarea } from "@/app/components/Input";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/types";

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
      <FormCard action={updateWithKey}>
        <FormField label="Valor" htmlFor="value">
          <Textarea
            id="value"
            name="value"
            defaultValue={entry.value}
            rows={8}
          />
        </FormField>
        <label className="flex cursor-pointer select-none items-center gap-3">
          <Checkbox
            name="pinned"
            defaultChecked={entry.pinned}
          />
          <span className="text-sm font-semibold">Inyectar siempre en el asistente</span>
        </label>
        <FormActions>
          <Button variant="primary" size="xl" shadow type="submit">
            Guardar
          </Button>
          <Button href="/admin/content" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
        </FormActions>
      </FormCard>
    </section>
  );
}
