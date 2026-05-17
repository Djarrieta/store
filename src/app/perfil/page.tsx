import { signOut } from "@/app/components/user-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address, Order } from "@/types";
import Link from "next/link";
import { deleteAddress, setDefaultAddress } from "./actions";
import { OrderAccordion } from "./OrderAccordion";
import Button from "@/app/components/Button";

export default async function PerfilPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: addresses }, { data: orders }] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Address[]>(),
    supabase
      .from("orders")
      .select("*")
      .eq("user_ref", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<Order[]>(),
  ]);

  const allAddresses = addresses ?? [];
  const allOrders = orders ?? [];

  return (
    <main className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Mi perfil</h1>
        <form action={signOut}>
          <Button variant="secondary" size="lg" shadow type="submit">
            Cerrar sesión
          </Button>
        </form>
      </div>

      {/* ── Addresses ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Direcciones de envío</h2>
          <Link
            href="/perfil/addresses/new"
            className="rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            + Nueva dirección
          </Link>
        </div>

        {allAddresses.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-black bg-[var(--card)] p-8 text-center">
            <p className="text-[var(--muted)]">Aún no tienes direcciones guardadas.</p>
            <Link
              href="/perfil/addresses/new"
              className="mt-3 inline-block rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Agregar mi primera dirección
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {allAddresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-xl border-2 border-black bg-[var(--card)] p-4 shadow-[3px_3px_0_0_#111]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{addr.recipient_name}</p>
                      {addr.is_default && (
                        <span className="rounded-full border-2 border-black bg-green-200 px-2 py-0.5 text-xs font-bold">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {addr.address_line}
                      {addr.neighborhood ? `, ${addr.neighborhood}` : ""}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {addr.city}, {addr.department}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{addr.phone}</p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1.5">
                    <Link
                      href={`/perfil/addresses/${addr.id}/edit`}
                      className="rounded-md border-2 border-black bg-white px-3 py-1 text-center text-xs font-semibold shadow-[2px_2px_0_0_#111] transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      Editar
                    </Link>

                    {!addr.is_default && (
                      <form
                        action={async () => {
                          "use server";
                          await setDefaultAddress(addr.id);
                        }}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          shadow
                          fullWidth
                          type="submit"
                        >
                          Usar principal
                        </Button>
                      </form>
                    )}

                    <form
                      action={async () => {
                        "use server";
                        await deleteAddress(addr.id);
                      }}
                    >
                    <Button
                          variant="danger"
                          size="sm"
                          shadow
                          fullWidth
                          type="submit"
                        >
                          Eliminar
                        </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Order history ── */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Mis pedidos</h2>

        {allOrders.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-black bg-[var(--card)] p-8 text-center">
            <p className="text-[var(--muted)]">Aún no tienes pedidos.</p>
          </div>
        ) : (
          <OrderAccordion orders={allOrders} />
        )}
      </section>
    </main>
  );
}
