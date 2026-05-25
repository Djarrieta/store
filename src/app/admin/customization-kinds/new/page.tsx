import Button from "@/app/components/Button";
import { FormActions, FormCard } from "@/app/components/FormCard";
import Input from "@/app/components/Input";
import { requireAdmin } from "@/lib/auth";

import { createKind } from "../actions";
import SchemaEditor from "../SchemaEditor";

export default async function NewCustomizationKindPage() {
  await requireAdmin();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nuevo tipo de personalización</h1>

      <FormCard action={createKind} className="max-w-3xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre visible"
            name="label"
            required
            placeholder="ej. Funda de teléfono"
          />
          <Input
            label="Slug (snake_case, inmutable)"
            name="slug"
            required
            placeholder="ej. phone_case"
            pattern="[a-z0-9][a-z0-9_]{1,38}[a-z0-9]"
          />
        </div>

        <Input
          label="Texto del selector en la tienda"
          name="picker_label"
          required
          placeholder="ej. Elige tu teléfono"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Orden"
            name="sort_order"
            type="number"
            defaultValue={0}
          />
          <label className="flex items-end gap-2 text-sm font-semibold">
            <input type="checkbox" name="archived" className="size-5" />
            Archivado
          </label>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg font-bold">Campos de atributos</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            Cada variación pedirá estos campos al admin al crear su plantilla de impresión.
          </p>
          <SchemaEditor name="attribute_schema" initial={[]} />
        </div>

        <FormActions>
          <Button href="/admin/customization-kinds" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
          <Button variant="primary" size="xl" shadow type="submit" className="flex-1">
            Crear tipo
          </Button>
        </FormActions>
      </FormCard>
    </section>
  );
}
