import Badge, { type BadgeVariant } from "@/app/components/Badge";
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

const STATUS_BADGE_VARIANT: Record<OrderStatus, BadgeVariant> = {
  created: "secondary",
  pending_approval: "warning",
  approved: "success",
  rejected: "danger",
  fulfilled: "muted",
  cancelled: "muted",
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
                  className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]"
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
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]} size="sm">
                        {STATUS_LABEL[order.status]}
                      </Badge>
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
