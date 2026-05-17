import { createContent } from "@/app/admin/content/actions";
import Button from "@/app/components/Button";
import Input, { Textarea, Checkbox } from "@/app/components/Input";
import { FormCard, FormField, FormActions } from "@/app/components/FormCard";

export default function AdminNewContentPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nuevo contenido</h1>
      <FormCard action={createContent}>
        <FormField label="Clave" htmlFor="key">
          <Input
            id="key"
            name="key"
            required
          />
        </FormField>
        <FormField label="Valor" htmlFor="value">
          <Textarea
            id="value"
            name="value"
            rows={8}
          />
        </FormField>
        <label className="flex cursor-pointer select-none items-center gap-3">
          <Checkbox
            name="pinned"
          />
          <span className="text-sm font-semibold">Inyectar siempre en el asistente</span>
        </label>
        <FormActions>
          <Button variant="primary" size="xl" shadow type="submit">
            Crear
          </Button>
          <Button href="/admin/content" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
        </FormActions>
      </FormCard>
    </section>
  );
}
