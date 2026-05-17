import Button from "@/app/components/Button";
import { Form, FormField } from "@/app/components/FormCard";
import Input from "@/app/components/Input";
import PageHeader from "@/app/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Ship, ShipsConfig } from "@/types";

import { deleteShip, updateShipsConfig } from "./actions";

export default async function AdminShipsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: ships }, { data: config }] = await Promise.all([
    supabase
      .from("ships")
      .select("*")
      .order("department")
      .order("city")
      .returns<Ship[]>(),
    supabase
      .from("ships_config")
      .select("*")
      .eq("singleton", true)
      .single<ShipsConfig>(),
  ]);

  const allShips = ships ?? [];

  return (
    <PageHeader
      title="Envíos"
      createHref="/admin/ships/new"
      createLabel="Nueva tarifa"
      isEmpty={false}
    >
      <div className="space-y-8">
        {/* Ships table */}
        {allShips.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-black bg-[var(--card)] p-8 text-center">
            <p className="text-[var(--muted)]">
              Aún no hay tarifas de envío configuradas.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111]">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-black bg-[var(--accent)]">
                <tr>
                  <th className="p-3 text-left font-bold">Departamento</th>
                  <th className="p-3 text-left font-bold">Ciudad</th>
                  <th className="p-3 text-right font-bold">Precio</th>
                  <th className="p-3 text-right font-bold">Días est.</th>
                  <th className="p-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allShips.map((ship) => (
                  <tr key={ship.id} className="border-b border-black/10 last:border-0">
                    <td className="p-3 font-medium">{ship.department}</td>
                    <td className="p-3">{ship.city}</td>
                    <td className="p-3 text-right">{formatCurrency(ship.price_cop)}</td>
                    <td className="p-3 text-right">{ship.estimated_days}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          href={`/admin/ships/${ship.id}/edit`}
                          variant="secondary"
                          size="sm"
                          shadow
                        >
                          Editar
                        </Button>
                        <Form
                          className="flex items-center"
                          action={async () => {
                            "use server";
                            await deleteShip(ship.id);
                          }}
                        >
                          <Button variant="danger" size="sm" shadow type="submit">
                            Eliminar
                          </Button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Shipping config */}
        <section className="rounded-xl border-2 border-black bg-[var(--card)] p-5 shadow-[3px_3px_0_0_#111]">
          <h2 className="mb-4 font-display text-lg font-bold">
            Configuración de envío gratis
          </h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Deja vacío para desactivar el envío gratis. Cuando el subtotal del pedido
            supere este monto, el envío será gratuito.
          </p>
          <Form action={updateShipsConfig} className="flex items-end gap-3">
            <FormField label="Envío gratis desde (COP)">
              <Input
                name="free_above_cop"
                type="number"
                min="0"
                step="1000"
                defaultValue={config?.free_above_cop ?? ""}
                placeholder="ej. 150000 (dejar vacío para desactivar)"
                fullWidth={false}
                className="w-64"
              />
            </FormField>
            <Button variant="primary" size="lg" shadow type="submit">
              Guardar
            </Button>
          </Form>
          {config?.free_above_cop != null && (
            <p className="mt-3 text-sm font-semibold text-green-700">
              Envío gratis activo desde {formatCurrency(config.free_above_cop)}
            </p>
          )}
        </section>
      </div>
    </PageHeader>
  );
}
