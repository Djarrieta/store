import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import type { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import PageHeader from "@/app/components/PageHeader";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_approval: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  fulfilled: "Entregado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_approval: "bg-[var(--accent)] text-black",
  approved: "bg-green-200 text-green-900",
  rejected: "bg-red-200 text-red-900",
  fulfilled: "bg-gray-200 text-gray-700",
};

const STATUS_ORDER: OrderStatus[] = ["pending_approval", "approved", "fulfilled", "rejected"];

export default async function AdminOrdersPage() {
  const supabase = createServiceClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Order[]>();

  const all = orders ?? [];

  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    orders: all.filter((o) => o.status === status),
  })).filter((g) => g.orders.length > 0);

  return (
    <PageHeader
      title="Pedidos"
      isEmpty={all.length === 0}
      emptyText="No hay pedidos todavía."
    >
      <div className="space-y-8">
        {byStatus.map(({ status, orders: group }) => (
          <section key={status}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              {STATUS_LABEL[status]} ({group.length})
            </h2>
            <div className="space-y-3">
              {group.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111]"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {order.user_name ?? order.user_ref}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {order.items.length} producto(s) ·{" "}
                        {formatCurrency(order.total)} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full border border-black px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[order.status]}`}
                      >
                        {STATUS_LABEL[order.status]}
                      </span>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-md border-2 border-black px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageHeader>
  );
}
