"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

import AddressModal from "@/app/components/AddressModal";
import Button from "@/app/components/Button";
import BuyNowButton from "@/app/components/BuyNowButton";
import { useCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    isAuthenticated,
    closeCart,
    removeItem,
    setQuantity,
    subtotalAmountInCents,
    totalAmountInCents,
    shippingCost,
    shippingDisplay,
    shippingInfo,
    selectedAddress,
    setSelectedAddress,
    clearCart,
    clearAddress,
  } = useCart();

  const pathname = usePathname();
  const loginUrl = `/login?next=${encodeURIComponent(pathname + "?openCart=1")}`;
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  return (
    <>
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
          <Button
            variant="secondary"
            size="none"
            onClick={closeCart}
            className="px-3 py-1 text-sm font-bold rounded-lg"
          >
            ✕
          </Button>
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
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </Button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="space-y-3 border-t-4 border-black p-4 pb-8">
              {/* Address section — authenticated users only */}
              {isAuthenticated && (
                <div className="rounded-xl border-2 border-black bg-[var(--bg)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                        Dirección de envío
                      </p>
                      {selectedAddress ? (
                        <div className="mt-1">
                          <p className="text-sm font-semibold leading-tight">
                            {selectedAddress.recipient_name}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {selectedAddress.address_line}
                            {selectedAddress.neighborhood
                              ? `, ${selectedAddress.neighborhood}`
                              : ""}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {selectedAddress.city}, {selectedAddress.department}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Agrega una dirección de envío
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        shadow
                        onClick={() => setAddressModalOpen(true)}
                      >
                        {selectedAddress ? "Cambiar" : "Agregar"}
                      </Button>
                      {selectedAddress && (
                        <Button
                          variant="ghost"
                          onClick={clearAddress}
                          className="text-xs"
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Totals breakdown */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted)]">Subtotal</span>
                  <span>{formatCurrency(subtotalAmountInCents / 100)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted)]">Envío</span>
                  <span>
                    {shippingDisplay === "none" && "—"}
                    {shippingDisplay === "loading" && (
                      <span className="text-[var(--muted)]">...</span>
                    )}
                    {shippingDisplay === "free" && (
                      <span className="font-semibold text-green-700">Gratis</span>
                    )}
                    {shippingDisplay === "price" && formatCurrency(shippingCost)}
                    {shippingDisplay === "unknown_city" && (
                      <span className="text-orange-600">A coordinar</span>
                    )}
                  </span>
                </div>
                {shippingInfo?.estimated_days && shippingDisplay === "price" && (
                  <p className="text-right text-xs text-[var(--muted)]">
                    ~{shippingInfo.estimated_days} día
                    {shippingInfo.estimated_days !== 1 ? "s" : ""} hábiles
                  </p>
                )}
                <div className="flex justify-between border-t-2 border-black pt-2 font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmountInCents / 100)}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <BuyNowButton
                  items={items}
                  shippingAddress={selectedAddress}
                  shippingCost={shippingCost}
                  disabled={!selectedAddress}
                  onOrderCreated={() => {
                    clearCart();
                    clearAddress();
                  }}
                  onSuccess={closeCart}
                >
                  {selectedAddress ? "Comprar ahora" : "Agrega una dirección para comprar"}
                </BuyNowButton>
              ) : (
                <Button
                  href={loginUrl}
                  variant="primary"
                  size="xl"
                  shadow
                  fullWidth
                  className="mb-2"
                >
                  Inicia sesión para comprar
                </Button>
              )}
            </div>
          </>
        )}
      </aside>

      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSelect={(address) => {
          setSelectedAddress(address);
          setAddressModalOpen(false);
        }}
      />
    </>
  );
}
