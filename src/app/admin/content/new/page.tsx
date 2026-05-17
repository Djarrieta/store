import { createContent } from "@/app/admin/content/actions";
import Button from "@/app/components/Button";
import { FormActions,FormCard } from "@/app/components/FormCard";
import Input, { Checkbox,Textarea } from "@/app/components/Input";

export default function AdminNewContentPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nuevo contenido</h1>
      <FormCard action={createContent}>
        <Input label="Clave" name="key" required />
        <Textarea label="Valor" name="value" rows={8} />
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
