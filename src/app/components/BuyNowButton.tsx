"use client";

import { useState } from "react";
import Script from "next/script";
import { createOrderAndCheckout, markOrderPaid, cancelOrder } from "@/app/actions/orders";
import type { CartItem } from "@/lib/cart";

declare global {
  interface Window {
    WidgetCheckout: new (config: {
      currency: string;
      amountInCents: number;
      reference: string;
      publicKey: string;
      signature: { integrity: string };
    }) => {
      open: (
        callback: (result: { transaction: { id: string; status: string } }) => void,
      ) => void;
    };
  }
}

interface Props {
  items: CartItem[];
  disabled?: boolean;
  onSuccess?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function BuyNowButton({
  items,
  disabled = false,
  onSuccess,
  className,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    if (loading || disabled || items.length === 0) return;
    setLoading(true);
    try {
      const { orderId, reference, integrityHash, amountInCents } =
        await createOrderAndCheckout(items);

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
        disabled={loading || disabled}
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
