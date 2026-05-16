import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Address } from "@/types";
import type { Order, OrderStatus } from "@/types";
import { deleteAddress, setDefaultAddress } from "./actions";
import { signOut } from "@/app/components/user-actions";

const STATUS_LABEL: Record<OrderStatus, string> = {
  created: "Creado",
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobado",
  rejected: "Rechazado",
  fulfilled: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  created: "bg-gray-100",
  pending_approval: "bg-yellow-100",
  approved: "bg-blue-100",
  rejected: "bg-red-100",
  fulfilled: "bg-green-100",
  cancelled: "bg-gray-100",
};

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
          <button
            type="submit"
            className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Cerrar sesión
          </button>
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
                        <button
                          type="submit"
                          className="w-full rounded-md border-2 border-black bg-blue-50 px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                          Usar principal
                        </button>
                      </form>
                    )}

                    <form
                      action={async () => {
                        "use server";
                        await deleteAddress(addr.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full rounded-md border-2 border-black bg-red-50 px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                      >
                        Eliminar
                      </button>
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
          <div className="space-y-3">
            {allOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border-2 border-black bg-[var(--card)] p-4 shadow-[3px_3px_0_0_#111]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-xs text-[var(--muted)]">{order.id}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {formatDate(order.created_at)}
                    </p>
                    {order.shipping_address && (
                      <p className="text-xs text-[var(--muted)]">
                        {order.shipping_address.city},{" "}
                        {order.shipping_address.department}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold">{formatCurrency(order.total)}</p>
                    <span
                      className={`mt-1 inline-block rounded-full border border-black px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[order.status]}`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
