import { notFound } from "next/navigation";

import Button from "@/app/components/Button";
import { FormActions, FormCard } from "@/app/components/FormCard";
import Input from "@/app/components/Input";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CustomizationKind } from "@/types";

import { auditKindAttributes, updateKind } from "../../actions";
import SchemaEditor from "../../SchemaEditor";

export default async function EditCustomizationKindPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: kind } = await supabase
    .from("customization_kinds")
    .select("*")
    .eq("id", id)
    .single<CustomizationKind>();
  if (!kind) notFound();

  const audit = await auditKindAttributes(id);
  const updateWithId = updateKind.bind(null, id);

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Editar tipo de personalización</h1>

      {(audit.orphaned > 0 || audit.incomplete > 0) && (
        <div className="rounded-xl border-2 border-[var(--border)] bg-yellow-100 p-4 text-sm text-yellow-900 shadow-[3px_3px_0_0_var(--shadow)]">
          <p className="mb-2 font-bold uppercase">Aviso</p>
          <ul className="list-disc space-y-1 pl-5">
            {audit.orphaned > 0 && (
              <li>
                {audit.orphaned} plantilla(s) tienen atributos que ya no están en el esquema.
              </li>
            )}
            {audit.incomplete > 0 && (
              <li>
                {audit.incomplete} plantilla(s) no tienen todos los atributos obligatorios.
              </li>
            )}
          </ul>
        </div>
      )}

      <FormCard action={updateWithId} className="max-w-3xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre visible"
            name="label"
            required
            defaultValue={kind.label}
          />
          <Input
            label="Slug (inmutable)"
            defaultValue={kind.slug}
            disabled
          />
        </div>

        <Input
          label="Texto del selector en la tienda"
          name="picker_label"
          required
          defaultValue={kind.picker_label}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Orden"
            name="sort_order"
            type="number"
            defaultValue={kind.sort_order}
          />
          <label className="flex items-end gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="archived"
              defaultChecked={kind.archived}
              className="size-5"
            />
            Archivado
          </label>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg font-bold">Campos de atributos</h2>
          <SchemaEditor name="attribute_schema" initial={kind.attribute_schema ?? []} />
        </div>

        <FormActions>
          <Button href="/admin/customization-kinds" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
          <Button variant="primary" size="xl" shadow type="submit" className="flex-1">
            Guardar cambios
          </Button>
        </FormActions>
      </FormCard>
    </section>
  );
}
