"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

interface VariantCategory {
  id: string;
  name: string;
  parent_id: string | null;
  parent: { id: string; name: string } | null;
}

interface ItemVariant {
  id: string;
  stock: number;
  item_categories: Array<{ category: VariantCategory | null }>;
}

interface ProductInfo {
  title: string;
  price: number;
  amountInCents: number;
  image?: string;
}

interface Dimension {
  id: string;
  name: string;
  values: VariantCategory[];
}

export default function VariantSelector({
  items,
  product,
}: {
  items: ItemVariant[];
  product: ProductInfo;
}) {
  // Derive dimensions from items
  const dimensionMap = new Map<string, Dimension>();
  for (const item of items) {
    for (const ic of item.item_categories) {
      const cat = ic.category;
      if (!cat || !cat.parent_id || !cat.parent) continue;
      if (!dimensionMap.has(cat.parent_id)) {
        dimensionMap.set(cat.parent_id, { id: cat.parent_id, name: cat.parent.name, values: [] });
      }
      const dim = dimensionMap.get(cat.parent_id)!;
      if (!dim.values.find((v) => v.id === cat.id)) {
        dim.values.push(cat);
      }
    }
  }
  const dimensions = Array.from(dimensionMap.values());

  const [selected, setSelected] = useState<Record<string, string>>({});
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const selectedValues = Object.values(selected);
  const allSelected = selectedValues.length === dimensions.length && dimensions.length > 0;

  const resolvedItem = allSelected
    ? items.find((item) =>
        selectedValues.every((valId) =>
          item.item_categories.some((ic) => ic.category?.id === valId)
        )
      )
    : null;

  const inStock = resolvedItem ? resolvedItem.stock > 0 : false;

  function handleAdd() {
    if (!resolvedItem || !inStock) return;
    addItem({
      id: resolvedItem.id,
      title: product.title,
      price: product.price,
      amountInCents: product.amountInCents,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-3">
      {dimensions.map((dim) => (
        <label key={dim.id} className="grid gap-1">
          <span className="text-sm font-semibold">{dim.name}</span>
          <select
            value={selected[dim.id] ?? ""}
            onChange={(e) => setSelected((prev) => ({ ...prev, [dim.id]: e.target.value }))}
            className="w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm shadow-[2px_2px_0_0_#111] focus:outline-none"
          >
            <option value="">— Selecciona —</option>
            {dim.values.map((val) => (
              <option key={val.id} value={val.id}>
                {val.name}
              </option>
            ))}
          </select>
        </label>
      ))}

      {allSelected && (
        <p className={`text-xs font-semibold ${inStock ? "text-green-700" : "text-red-600"}`}>
          {inStock ? "Disponible" : "Sin stock"}
        </p>
      )}

      <button
          type="button"
          onClick={handleAdd}
          disabled={!allSelected || !inStock}
          className="w-full rounded-xl border-2 border-black bg-[var(--accent)] px-6 py-3 font-bold shadow-[4px_4px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40 disabled:pointer-events-none"
        >
          {added ? "✓ Agregado!" : "Agregar al carrito"}
        </button>
    </div>
  );
}
