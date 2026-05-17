import { requireAdmin } from "@/lib/auth";
import { createShip } from "../actions";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";

export default async function NewShipPage() {
  await requireAdmin();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nueva tarifa de envío</h1>

      <form
        action={createShip}
        className="max-w-lg space-y-4 rounded-xl border-2 border-black bg-white p-5 shadow-[3px_3px_0_0_#111]"
      >
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm font-medium">
            Departamento
            <Input
              name="department"
              required
              placeholder="ej. Antioquia"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Ciudad
            <Input
              name="city"
              required
              placeholder="ej. Medellín"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Precio (COP)
          <Input
            name="price_cop"
            required
            type="number"
            min="0"
            step="1000"
            placeholder="ej. 15000"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Días estimados de entrega
          <Input
            name="estimated_days"
            required
            type="number"
            min="1"
            placeholder="ej. 3"
          />
        </label>

        <div className="flex gap-3 pt-1">
          <Button href="/admin/ships" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
          <Button variant="primary" size="xl" shadow type="submit" className="flex-1">
            Crear tarifa
          </Button>
        </div>
      </form>
    </section>
  );
}
