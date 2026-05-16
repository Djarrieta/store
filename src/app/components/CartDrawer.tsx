"use client";

import Image from "next/image";
import Script from "next/script";
import { useCart } from "@/lib/cart";
import { createWompiCheckout } from "@/app/actions/wompi";
import { formatCurrency } from "@/lib/format";

declare global {
  interface Window {
    WidgetCheckout: new (config: {
      currency: string;
      amountInCents: number;
      reference: string;
      publicKey: string;
      signature: { integrity: string };
      redirectUrl?: string;
    }) => {
      open: (
        callback: (result: { transaction: { id: string; status: string } }) => void
      ) => void;
    };
  }
}

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    setQuantity,
    totalAmountInCents,
    clearCart,
  } = useCart();

  async function handleCheckout() {
    if (items.length === 0) return;
    const { reference, integrityHash } = await createWompiCheckout(totalAmountInCents);

    const checkout = new window.WidgetCheckout({
      currency: "COP",
      amountInCents: totalAmountInCents,
      reference,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
      signature: { integrity: integrityHash },
    });

    checkout.open(({ transaction }) => {
      if (transaction.status === "APPROVED") {
        clearCart();
        closeCart();
      }
    });
  }

  return (
    <>
      <Script src="https://checkout.wompi.co/widget.js" strategy="lazyOnload" />

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        aria-label="Carrito de compras"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l-4 border-black bg-[var(--card)] shadow-[-6px_0_0_0_#111] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black p-4">
          <h2 className="font-display text-xl font-bold">Carrito</h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-bold hover:bg-[var(--bg)]"
          >
            ✕
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--muted)]">
            Tu carrito está vacío.
          </div>
        ) : (
          <>
            {/* Items list */}
            <ul className="flex-1 divide-y-2 divide-black overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 p-4">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 shrink-0 rounded-lg border-2 border-black object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="line-clamp-2 text-sm font-bold leading-tight">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatCurrency(item.price)}
                    </p>
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border-2 border-black text-sm font-bold hover:bg-[var(--bg)]"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border-2 border-black text-sm font-bold hover:bg-[var(--bg)]"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-xs text-[var(--muted)] underline hover:text-[var(--fg)]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="space-y-3 border-t-4 border-black p-4">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(totalAmountInCents / 100)}</span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full rounded-xl border-2 border-black bg-[var(--accent)] px-6 py-3 font-bold shadow-[4px_4px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Pagar con Wompi
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
