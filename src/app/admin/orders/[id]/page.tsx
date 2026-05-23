import Image from "next/image";
import { notFound } from "next/navigation";

import Button from "@/app/components/Button";
import { Form } from "@/app/components/FormCard";
import Input from "@/app/components/Input";
import { formatCurrency, formatDate } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/service";
import type { Order, OrderItem, OrderStatus } from "@/types";

import { approveOrder, fulfillOrder, regeneratePrintFile, rejectOrder, updateTrackingCode } from "../actions";

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

  // Pre-sign storage URLs for any customized lines so the page can render
  // thumbnails of the user source + preview, plus a download link for the
  // print-ready file when it already exists.
  const customizationUrls = await Promise.all(
    order.items.map(async (item) => {
      const snap = item.customization;
      if (!snap) return null;
      const [src, prev, print] = await Promise.all([
        sign(supabase, "customizations-source", snap.source_image_path),
        sign(supabase, "customizations-preview", snap.preview_path),
        snap.print_path
          ? sign(supabase, "customizations-print", snap.print_path)
          : Promise.resolve(null),
      ]);
      return { src, prev, print };
    }),
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Pedido</h1>
        <p className="text-xs text-[var(--muted)] font-mono mt-1">{order.id}</p>
      </div>

      <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] shadow-[3px_3px_0_0_var(--shadow)] p-5 space-y-3">
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
          <div className="pt-2 border-t border-[var(--border)]/10">
            <p className="text-xs text-[var(--muted)] mb-1">Notas</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Shipping */}
      {order.shipping_address && (
        <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] shadow-[3px_3px_0_0_var(--shadow)] p-5 space-y-3">
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
          <div className="flex justify-between text-sm border-t border-[var(--border)]/10 pt-2">
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
      <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] shadow-[3px_3px_0_0_var(--shadow)] p-5 space-y-3">
        <h2 className="font-bold">Seguimiento de envío</h2>
        <Form
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
        </Form>
        {order.tracking_code && (
          <p className="text-xs text-[var(--muted)]">
            Código actual:{" "}
            <span className="font-mono font-semibold text-[var(--fg)]">{order.tracking_code}</span>
          </p>
        )}
      </div>

      {/* Line items */}
      <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] shadow-[3px_3px_0_0_var(--shadow)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-[var(--border)] bg-[var(--accent)] text-[var(--accent-foreground)]">
            <tr>
              <th className="p-3 text-left font-bold">Producto</th>
              <th className="p-3 text-right font-bold">Cant.</th>
              <th className="p-3 text-right font-bold">P. Unit.</th>
              <th className="p-3 text-right font-bold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: OrderItem, i: number) => {
              const snap = item.customization;
              const urls = customizationUrls[i];
              return (
                <tr key={i} className="border-b border-[var(--border)]/10 last:border-0 align-top">
                  <td className="p-3">
                    <p className="font-medium">{item.title}</p>
                    {item.sku && (
                      <p className="text-xs text-[var(--muted)]">SKU: {item.sku}</p>
                    )}
                    {snap && urls && (
                      <div className="mt-2 rounded-lg border-2 border-[var(--border)] bg-[var(--bg)] p-3 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold uppercase tracking-wide">
                          <span className="rounded-full border-2 border-[var(--accent)] bg-[var(--accent)] px-2 py-0.5 text-[var(--accent-foreground)]">
                            Personalizado
                          </span>
                          <span className="text-[var(--muted)]">{snap.template_label}</span>
                        </div>
                        <div className="flex gap-2">
                          {urls.src && (
                            <a href={urls.src} target="_blank" rel="noreferrer" className="block">
                              <Image
                                src={urls.src}
                                alt="Imagen original"
                                width={80}
                                height={80}
                                unoptimized
                                className="h-20 w-20 rounded border-2 border-[var(--border)] object-cover"
                              />
                              <p className="mt-1 text-center text-[10px] text-[var(--muted)]">Original</p>
                            </a>
                          )}
                          {urls.prev && (
                            <a href={urls.prev} target="_blank" rel="noreferrer" className="block">
                              <Image
                                src={urls.prev}
                                alt="Vista previa"
                                width={80}
                                height={80}
                                unoptimized
                                className="h-20 w-20 rounded border-2 border-[var(--border)] object-cover"
                              />
                              <p className="mt-1 text-center text-[10px] text-[var(--muted)]">Previa</p>
                            </a>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-[var(--muted)]">
                          {snap.template.width_mm}×{snap.template.height_mm}mm · {snap.template.print_dpi} DPI
                          {" · scale "}
                          {snap.transform.scale.toFixed(2)}
                          {" · rot "}
                          {((snap.transform.rotation * 180) / Math.PI).toFixed(0)}°
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {urls.print ? (
                            <a
                              href={urls.print}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border-2 border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_0_var(--shadow)] hover:-translate-y-0.5 transition-transform"
                            >
                              Descargar PNG de impresión
                            </a>
                          ) : (
                            <p className="text-[var(--muted)]">
                              Archivo de impresión aún no generado.
                            </p>
                          )}
                          <form action={regeneratePrintFile.bind(null, order.id, i)}>
                            <Button variant="secondary" size="sm" type="submit">
                              {urls.print ? "Regenerar" : "Generar archivo"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">{item.qty}</td>
                  <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="p-3 text-right font-semibold">
                    {formatCurrency(item.unit_price * item.qty)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-[var(--border)]">
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
            <Form
              action={async () => {
                "use server";
                await approveOrder(order.id);
              }}
            >
              <Button variant="success" size="lg" shadow type="submit">
                Aprobar
              </Button>
            </Form>
            <Form
              action={async () => {
                "use server";
                await rejectOrder(order.id);
              }}
            >
              <Button variant="danger" size="lg" shadow type="submit">
                Rechazar
              </Button>
            </Form>
          </>
        )}
        {order.status === "approved" && (
          <Form
            action={async () => {
              "use server";
              await fulfillOrder(order.id);
            }}
          >
            <Button variant="primary" size="lg" shadow type="submit">
              Marcar como entregado
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
}

async function sign(
  supabase: ReturnType<typeof createServiceClient>,
  bucket: string,
  path: string,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 30);
  if (error || !data) return null;
  return data.signedUrl;
}
