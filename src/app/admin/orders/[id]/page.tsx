import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import type { Order, OrderItem, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { approveOrder, rejectOrder, fulfillOrder, updateTrackingCode } from "../actions";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";

const STATUS_LABEL: Record<OrderStatus, string> = {
  created: "Creado (sin pagar)",
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobado",
  rejected: "Rechazado",
  fulfilled: "Entregado",
  cancelled: "Cancelado",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single<Order>();

  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Pedido</h1>
        <p className="text-xs text-[var(--muted)] font-mono mt-1">{order.id}</p>
      </div>

      <div className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Cliente</span>
          <span className="font-semibold">{order.user_name ?? order.user_ref}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Contacto</span>
          <span className="font-mono text-xs">{order.user_ref}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Estado</span>
          <span className="font-semibold">{STATUS_LABEL[order.status]}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted)]">Fecha</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        {order.notes && (
          <div className="pt-2 border-t border-black/10">
            <p className="text-xs text-[var(--muted)] mb-1">Notas</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Shipping */}
      {order.shipping_address && (
        <div className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] p-5 space-y-3">
          <h2 className="font-bold">Dirección de envío</h2>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Destinatario</span>
            <span className="font-semibold">{order.shipping_address.recipient_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Dirección</span>
            <span className="text-right">
              {order.shipping_address.address_line}
              {order.shipping_address.neighborhood
                ? `, ${order.shipping_address.neighborhood}`
                : ""}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Ciudad</span>
            <span>
              {order.shipping_address.city}, {order.shipping_address.department}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Teléfono</span>
            <span>{order.shipping_address.phone}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-black/10 pt-2">
            <span className="text-[var(--muted)]">Costo de envío</span>
            <span className="font-semibold">
              {order.shipping_cost > 0
                ? formatCurrency(order.shipping_cost)
                : "Gratis / A coordinar"}
            </span>
          </div>
        </div>
      )}

      {/* Tracking */}
      <div className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] p-5 space-y-3">
        <h2 className="font-bold">Seguimiento de envío</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            await updateTrackingCode(order.id, fd);
          }}
          className="flex gap-2 items-center"
        >
          <Input
            name="tracking_code"
            defaultValue={order.tracking_code ?? ""}
            placeholder="Código de guía (ej: TCC-123456789)"
            fullWidth={false}
            className="flex-1 font-mono"
          />
          <Button variant="primary" size="lg" shadow type="submit">
            Guardar
          </Button>
        </form>
        {order.tracking_code && (
          <p className="text-xs text-[var(--muted)]">
            Código actual:{" "}
            <span className="font-mono font-semibold text-black">{order.tracking_code}</span>
          </p>
        )}
      </div>

      {/* Line items */}
      <div className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-black bg-[var(--accent)]">
            <tr>
              <th className="p-3 text-left font-bold">Producto</th>
              <th className="p-3 text-right font-bold">Cant.</th>
              <th className="p-3 text-right font-bold">P. Unit.</th>
              <th className="p-3 text-right font-bold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: OrderItem, i: number) => (
              <tr key={i} className="border-b border-black/10 last:border-0">
                <td className="p-3">
                  <p className="font-medium">{item.title}</p>
                  {item.sku && (
                    <p className="text-xs text-[var(--muted)]">SKU: {item.sku}</p>
                  )}
                </td>
                <td className="p-3 text-right">{item.qty}</td>
                <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(item.unit_price * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-black">
            {order.shipping_cost > 0 && (
              <tr>
                <td colSpan={3} className="p-3 text-right text-sm text-[var(--muted)]">
                  Subtotal productos
                </td>
                <td className="p-3 text-right text-sm">
                  {formatCurrency(order.total - order.shipping_cost)}
                </td>
              </tr>
            )}
            {order.shipping_cost > 0 && (
              <tr>
                <td colSpan={3} className="p-3 text-right text-sm text-[var(--muted)]">
                  Envío
                </td>
                <td className="p-3 text-right text-sm">
                  {formatCurrency(order.shipping_cost)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="p-3 text-right font-bold">
                Total
              </td>
              <td className="p-3 text-right font-bold text-base">
                {formatCurrency(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          href={`/admin/orders/${order.id}/edit`}
          variant="secondary"
          size="lg"
          shadow
        >
          Editar
        </Button>
        {order.status === "pending_approval" && (
          <>
            <form
              action={async () => {
                "use server";
                await approveOrder(order.id);
              }}
            >
              <Button variant="success" size="lg" shadow type="submit">
                Aprobar
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await rejectOrder(order.id);
              }}
            >
              <Button variant="danger" size="lg" shadow type="submit">
                Rechazar
              </Button>
            </form>
          </>
        )}
        {order.status === "approved" && (
          <form
            action={async () => {
              "use server";
              await fulfillOrder(order.id);
            }}
          >
            <Button variant="primary" size="lg" shadow type="submit">
              Marcar como entregado
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
