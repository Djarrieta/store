"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderItem, OrderStatus } from "@/types";
import type { ShippingAddressSnapshot } from "@/types";
import { updateOrder } from "../../actions";
import { formatCurrency } from "@/lib/format";

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Creado (sin pagar)",
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobado",
  rejected: "Rechazado",
  fulfilled: "Entregado",
  cancelled: "Cancelado",
};

const ALL_STATUSES: OrderStatus[] = [
  "created",
  "pending_approval",
  "approved",
  "rejected",
  "fulfilled",
  "cancelled",
];

interface Props {
  order: Order;
}

export default function OrderEditForm({ order }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Status
  const [status, setStatus] = useState<OrderStatus>(order.status);

  // Notes
  const [notes, setNotes] = useState(order.notes ?? "");

  // Tracking code
  const [trackingCode, setTrackingCode] = useState(order.tracking_code ?? "");

  // Shipping address
  const addr = order.shipping_address;
  const [recipientName, setRecipientName] = useState(addr?.recipient_name ?? "");
  const [addressLine, setAddressLine] = useState(addr?.address_line ?? "");
  const [neighborhood, setNeighborhood] = useState(addr?.neighborhood ?? "");
  const [city, setCity] = useState(addr?.city ?? "");
  const [department, setDepartment] = useState(addr?.department ?? "");
  const [phone, setPhone] = useState(addr?.phone ?? "");

  // Shipping cost
  const [shippingCost, setShippingCost] = useState(String(order.shipping_cost ?? 0));

  // Items
  const [items, setItems] = useState<OrderItem[]>(order.items);

  function updateItemQty(index: number, qty: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty } : item)),
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const itemsTotal = items.reduce((sum, i) => sum + i.unit_price * i.qty, 0);
  const parsedShippingCost = parseFloat(shippingCost) || 0;
  const total = itemsTotal + parsedShippingCost;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("El pedido debe tener al menos un ítem.");
      return;
    }

    const shippingAddress: ShippingAddressSnapshot | null =
      recipientName || addressLine || city || department || phone
        ? {
            recipient_name: recipientName,
            address_line: addressLine,
            neighborhood: neighborhood || null,
            city,
            department,
            phone,
          }
        : null;

    startTransition(async () => {
      try {
        await updateOrder(order.id, {
          status,
          notes: notes.trim() || null,
          tracking_code: trackingCode.trim() || null,
          shipping_address: shippingAddress,
          shipping_cost: parsedShippingCost,
          items,
          total,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="rounded-lg border-2 border-red-600 bg-red-100 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </div>
      )}

      {/* Status */}
      <section className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] p-5 space-y-4">
        <h2 className="font-bold text-base">Estado del pedido</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-lg border-2 border-black px-3 py-1.5 text-sm font-semibold transition-all ${
                status === s
                  ? "bg-[var(--accent)] shadow-none translate-x-[2px] translate-y-[2px]"
                  : "bg-[var(--background)] shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] p-5 space-y-3">
        <h2 className="font-bold text-base">Notas internas</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notas visibles solo para el equipo..."
          className="w-full rounded-lg border-2 border-black bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </section>

      {/* Tracking code */}
      <section className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] p-5 space-y-3">
        <h2 className="font-bold text-base">Seguimiento de envío</h2>
        <input
          type="text"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="Código de guía (ej: TCC-123456789)"
          className="w-full rounded-lg border-2 border-black bg-[var(--background)] px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </section>

      {/* Shipping address */}
      <section className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] p-5 space-y-4">
        <h2 className="font-bold text-base">Dirección de entrega</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Destinatario" required>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Teléfono" required>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Dirección" required className="sm:col-span-2">
            <input
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Barrio / Zona">
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Ciudad" required>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Departamento" required>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="pt-3 border-t border-black/10">
          <Field label="Costo de envío (COP)">
            <input
              type="number"
              min={0}
              step={1000}
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              className={`${inputClass} w-48`}
            />
          </Field>
        </div>
      </section>

      {/* Items */}
      <section className="rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111] overflow-hidden">
        <div className="p-5 border-b-2 border-black">
          <h2 className="font-bold text-base">Ítems del pedido</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--accent)] border-b-2 border-black">
            <tr>
              <th className="p-3 text-left font-bold">Producto</th>
              <th className="p-3 text-right font-bold">P. Unit.</th>
              <th className="p-3 text-right font-bold">Cant.</th>
              <th className="p-3 text-right font-bold">Subtotal</th>
              <th className="p-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-black/10 last:border-0">
                <td className="p-3">
                  <p className="font-medium">{item.title}</p>
                  {item.sku && (
                    <p className="text-xs text-[var(--muted)]">SKU: {item.sku}</p>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="p-3 text-right">
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateItemQty(i, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 rounded border-2 border-black px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </td>
                <td className="p-3 text-right font-semibold whitespace-nowrap">
                  {formatCurrency(item.unit_price * item.qty)}
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    aria-label="Eliminar ítem"
                    className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none font-bold"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-black">
            {parsedShippingCost > 0 && (
              <>
                <tr>
                  <td colSpan={3} className="p-3 text-right text-sm text-[var(--muted)]">
                    Subtotal productos
                  </td>
                  <td className="p-3 text-right text-sm" colSpan={2}>
                    {formatCurrency(itemsTotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-3 text-right text-sm text-[var(--muted)]">
                    Envío
                  </td>
                  <td className="p-3 text-right text-sm" colSpan={2}>
                    {formatCurrency(parsedShippingCost)}
                  </td>
                </tr>
              </>
            )}
            <tr>
              <td colSpan={3} className="p-3 text-right font-bold">
                Total
              </td>
              <td className="p-3 text-right font-bold text-base" colSpan={2}>
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-5 py-2.5 font-bold shadow-[3px_3px_0_0_#111] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="rounded-lg border-2 border-black bg-[var(--background)] px-5 py-2.5 font-semibold shadow-[3px_3px_0_0_#111] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border-2 border-black bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-1 ${className ?? ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
