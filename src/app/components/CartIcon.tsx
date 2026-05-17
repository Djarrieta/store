"use client";

import { useCart } from "@/lib/cart";
import Button from "@/app/components/Button";

export default function CartIcon() {
  const { totalItems, openCart } = useCart();

  return (
    <Button
      onClick={openCart}
      aria-label="Open cart"
      className="relative rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-bold shadow-[2px_2px_0_0_#111] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
    >
      🛒
      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[var(--accent)] text-xs font-bold leading-none">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Button>
  );
}
