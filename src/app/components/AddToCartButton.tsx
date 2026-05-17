"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import Button from "@/app/components/Button";

type Props = Omit<CartItem, "quantity">;

export default function AddToCartButton(props: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(props);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mt-4">
      <Button variant="primary" size="xl" shadow fullWidth onClick={handleAdd}>
        {added ? "✓ Agregado!" : "Agregar al carrito"}
      </Button>
    </div>
  );
}
