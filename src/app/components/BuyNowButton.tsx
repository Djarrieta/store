"use client";

import { useState } from "react";
import Script from "next/script";
import { createOrderAndCheckout, markOrderPaid, cancelOrder } from "@/app/actions/orders";
import type { CartItem } from "@/lib/cart";
import type { Address } from "@/types";

interface Props {
  items: CartItem[];
  shippingAddress: Address | null;
  shippingCost: number;
  disabled?: boolean;
  onOrderCreated?: () => void;
  onSuccess?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function BuyNowButton({
  items,
  shippingAddress,
  shippingCost,
  disabled = false,
  onOrderCreated,
  onSuccess,
  className,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    if (loading || disabled || items.length === 0 || !shippingAddress) return;
    setLoading(true);
    try {
      const snapshot = {
        recipient_name: shippingAddress.recipient_name,
        department: shippingAddress.department,
        city: shippingAddress.city,
        address_line: shippingAddress.address_line,
        neighborhood: shippingAddress.neighborhood,
        phone: shippingAddress.phone,
      };

      const { orderId, reference, integrityHash, amountInCents } =
        await createOrderAndCheckout(items, snapshot, shippingCost);

      onOrderCreated?.();

      const checkout = new window.WidgetCheckout({
        currency: "COP",
        amountInCents,
        reference,
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
        signature: { integrity: integrityHash },
      });

      checkout.open(async ({ transaction }) => {
        try {
          if (transaction.status === "APPROVED") {
            await markOrderPaid(orderId);
            onSuccess?.();
          } else {
            await cancelOrder(orderId);
          }
        } finally {
          setLoading(false);
        }
      });
    } catch {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.wompi.co/widget.js" strategy="lazyOnload" />
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading || disabled || !shippingAddress}
        className={
          className ??
          "w-full rounded-xl border-2 border-black bg-black text-white px-6 py-3 font-bold shadow-[4px_4px_0_0_#555] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40 disabled:pointer-events-none"
        }
      >
        {loading ? "Procesando..." : (children ?? "Comprar ahora")}
      </button>
    </>
  );
}
