import Button from "@/app/components/Button";
import { FormActions, FormCard } from "@/app/components/FormCard";
import Input from "@/app/components/Input";
import { requireAdmin } from "@/lib/auth";

import { createShip } from "../actions";

export default async function NewShipPage() {
  await requireAdmin();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nueva tarifa de envío</h1>

      <FormCard action={createShip} className="max-w-lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Departamento" name="department" required placeholder="ej. Antioquia" />
          <Input label="Ciudad" name="city" required placeholder="ej. Medellín" />
        </div>

        <Input
          label="Precio (COP)"
          name="price_cop"
          required
          type="number"
          min="0"
          step="1000"
          placeholder="ej. 15000"
        />

        <Input
          label="Días estimados de entrega"
          name="estimated_days"
          required
          type="number"
          min="1"
          placeholder="ej. 3"
        />

        <FormActions>
          <Button href="/admin/ships" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
          <Button variant="primary" size="xl" shadow type="submit" className="flex-1">
            Crear tarifa
          </Button>
        </FormActions>
      </FormCard>
    </section>
  );
}
