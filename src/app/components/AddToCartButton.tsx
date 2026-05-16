"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import BuyNowButton from "@/app/components/BuyNowButton";

type Props = Omit<CartItem, "quantity">;

export default function AddToCartButton(props: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(props);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const cartItem: CartItem = { ...props, quantity: 1 };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAdd}
        className="w-full rounded-xl border-2 border-black bg-[var(--accent)] px-6 py-3 font-bold shadow-[4px_4px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
      >
        {added ? "✓ Agregado!" : "Agregar al carrito"}
      </button>
      <BuyNowButton items={[cartItem]}>Comprar ahora</BuyNowButton>
    </div>
  );
}
