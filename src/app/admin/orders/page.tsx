import Button from "@/app/components/Button";
import PageHeader from "@/app/components/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/service";
import type { Order, OrderStatus } from "@/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  created: "Creado",
  pending_approval: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  fulfilled: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  created: "bg-blue-100 text-blue-800",
  pending_approval: "bg-[var(--accent)] text-black",
  approved: "bg-green-200 text-green-900",
  rejected: "bg-red-200 text-red-900",
  fulfilled: "bg-gray-200 text-gray-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_ORDER: OrderStatus[] = ["created", "pending_approval", "approved", "fulfilled", "rejected", "cancelled"];

export default async function AdminOrdersPage() {
  const supabase = createServiceClient();
  const { data: rawOrders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  const orders = rawOrders as Order[] | null;

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
                      <Button
                        href={`/admin/orders/${order.id}`}
                        variant="secondary"
                        size="sm"
                        shadow
                      >
                        Ver
                      </Button>
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
