"use client";

import { useState } from "react";

import Badge, { type BadgeVariant } from "@/app/components/Badge";
import Button from "@/app/components/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  created: "Creado",
  pending_approval: "Pendiente de aprobación",
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

interface Props {
  orders: Order[];
}

export function OrderAccordion({ orders }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isOpen = openId === order.id;
        return (
          <div
            key={order.id}
            className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)] overflow-hidden"
          >
            {/* Header row — click to toggle */}
            <Button
              onClick={() => setOpenId(isOpen ? null : order.id)}
              className="flex w-full items-start justify-between gap-3 p-4 text-left"
              aria-expanded={isOpen}
            >
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-xs text-[var(--muted)]">{order.id}</p>
                <p className="text-sm text-[var(--muted)]">{formatDate(order.created_at)}</p>
                {order.shipping_address && (
                  <p className="text-xs text-[var(--muted)]">
                    {order.shipping_address.city}, {order.shipping_address.department}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-bold">{formatCurrency(order.total)}</p>
                <Badge variant={STATUS_BADGE_VARIANT[order.status]} size="sm" className="mt-1">
                  {STATUS_LABEL[order.status]}
                </Badge>
              </div>

              {/* Chevron */}
              <span
                className={`ml-1 mt-0.5 shrink-0 text-[var(--muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
                aria-hidden="true"
              >
                ▼
              </span>
            </Button>

            {/* Expandable items list */}
            {isOpen && (
              <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  Productos
                </p>
                <ul className="space-y-2">
                  {order.items.map((item, i) => (
                    <li
                      key={`${item.product_id}-${i}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{item.title}</span>
                      <span className="shrink-0 text-[var(--muted)]">
                        x{item.qty} · {formatCurrency(item.unit_price)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Totals */}
                <div className="mt-3 space-y-1 border-t border-[var(--border)]/10 pt-3">
                  {order.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm text-[var(--muted)]">
                      <span>Subtotal productos</span>
                      <span>{formatCurrency(order.total - order.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-[var(--muted)]">
                    <span>Envío</span>
                    <span>
                      {order.shipping_cost > 0 ? formatCurrency(order.shipping_cost) : "Gratis"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {order.tracking_code && (
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    <span className="font-semibold">Seguimiento:</span> {order.tracking_code}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
