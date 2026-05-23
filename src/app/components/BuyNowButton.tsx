"use client";

import Script from "next/script";
import { useState } from "react";

import { cancelOrder,createOrderAndCheckout, markOrderPaid } from "@/app/actions/orders";
import Button from "@/app/components/Button";
import type { CartItem } from "@/lib/cart";
import {
  cleanupPersistedLocals,
  persistPendingCustomizations,
} from "@/lib/customizations/persist";
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

      // Upload customized lines to Supabase and swap the local key for the
      // server-issued snapshot. Errors here surface as alerts.
      let persistedItems: CartItem[];
      try {
        persistedItems = await persistPendingCustomizations(items);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No se pudo subir la personalización.";
        alert(msg);
        setLoading(false);
        return;
      }

      const { orderId, reference, integrityHash, amountInCents } =
        await createOrderAndCheckout(persistedItems, snapshot, shippingCost);

      // Order successfully created — drop local copies of customized images.
      await cleanupPersistedLocals(persistedItems);

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
      <Button
        variant="primary"
        size="xl"
        shadow
        fullWidth
        onClick={handleBuy}
        disabled={loading || disabled || !shippingAddress}
        className={className}
      >
        {loading ? "Procesando..." : (children ?? "Comprar ahora")}
      </Button>
    </>
  );
}
