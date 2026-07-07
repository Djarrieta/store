"use client";

import Button from "@/app/components/Button";
import { useCart } from "@/lib/cart";

export default function CartIcon() {
  const { totalItems, openCart } = useCart();

  return (
    <Button
      onClick={openCart}
      aria-label="Open cart"
      className="relative rounded-[var(--radius-btn-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm shadow-[var(--shadow-soft-sm)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-[var(--shadow-soft)]"
    >
      🛒
      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-medium leading-none">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Button>
  );
}
