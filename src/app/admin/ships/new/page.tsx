import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createShip } from "../actions";
import Button from "@/app/components/Button";

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
            <input
              name="department"
              required
              placeholder="ej. Antioquia"
              className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Ciudad
            <input
              name="city"
              required
              placeholder="ej. Medellín"
              className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Precio (COP)
          <input
            name="price_cop"
            required
            type="number"
            min="0"
            step="1000"
            placeholder="ej. 15000"
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Días estimados de entrega
          <input
            name="estimated_days"
            required
            type="number"
            min="1"
            placeholder="ej. 3"
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <div className="flex gap-3 pt-1">
          <Link
            href="/admin/ships"
            className="inline-flex items-center rounded-xl border-2 border-black bg-white px-6 py-3 font-bold shadow-[4px_4px_0_0_#111] transition-all hover:bg-[var(--bg)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Cancelar
          </Link>
          <Button variant="primary" size="xl" shadow type="submit" className="flex-1">
            Crear tarifa
          </Button>
        </div>
      </form>
    </section>
  );
}
