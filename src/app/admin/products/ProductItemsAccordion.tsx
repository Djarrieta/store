"use client";

import { useState } from "react";

import {
  createItemForProduct,
  deleteItemFromProduct,
  updateItemFromProduct,
} from "@/app/admin/items/actions";
import Button from "@/app/components/Button";
import { Form } from "@/app/components/FormCard";
import Input from "@/app/components/Input";

interface CategoryValue {
  id: string;
  name: string;
}

interface Dimension {
  id: string;
  name: string;
  values: CategoryValue[];
}

interface ItemRow {
  id: string;
  stock: number;
  item_categories: Array<{ category: { id: string; name: string } | null }>;
}

interface Props {
  productId: string;
  items: ItemRow[];
  dimensions: Dimension[];
}

function VariantCheckboxes({
  dimensions,
  selectedIds,
}: {
  dimensions: Dimension[];
  selectedIds: Set<string>;
}) {
  if (dimensions.length === 0) return null;
  return (
    <div className="space-y-3">
      {dimensions.map((dim) => (
        <fieldset key={dim.id}>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {dim.name}
          </legend>
          <div className="flex flex-wrap gap-3">
            {dim.values.map((val) => (
              <label key={val.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="category_ids"
                  value={val.id}
                  defaultChecked={selectedIds.has(val.id)}
                  className="h-4 w-4 rounded border-2 border-black accent-[var(--accent)]"
                />
                {val.name}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export default function ProductItemsAccordion({ productId, items, dimensions }: Props) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const createAction = createItemForProduct.bind(null, productId);

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-sm text-[var(--muted)]">Este producto aún no tiene variantes.</p>
      )}

      {items.map((item) => {
        const label =
          item.item_categories
            .map((ic) => ic.category?.name)
            .filter(Boolean)
            .join(" / ") || "Sin variante";
        const isOpen = openItemId === item.id;
        const selectedIds = new Set(
          item.item_categories.map((ic) => ic.category?.id).filter(Boolean) as string[]
        );
        const updateAction = updateItemFromProduct.bind(null, productId, item.id);
        const deleteAction = deleteItemFromProduct.bind(null, productId, item.id);

        return (
          <div key={item.id} className="overflow-hidden rounded-xl border-2 border-black shadow-[2px_2px_0_0_#111]">
            {/* Header row */}
            <Button
              onClick={() => setOpenItemId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between bg-[var(--card)] px-4 py-3 text-left transition-colors hover:bg-[var(--bg)]"
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className="flex items-center gap-3 text-xs text-[var(--muted)]">
                Stock: <strong className="text-black">{item.stock}</strong>
                <span className="text-base leading-none">{isOpen ? "▲" : "▼"}</span>
              </span>
            </Button>

            {/* Expanded body */}
            {isOpen && (
              <div className="space-y-4 border-t-2 border-black bg-white p-4">
                <Form action={updateAction} className="space-y-3">
                  <VariantCheckboxes dimensions={dimensions} selectedIds={selectedIds} />

                  <Input
                      label="Stock"
                      name="stock"
                      type="number"
                      min={0}
                      required
                      defaultValue={item.stock}
                      fullWidth={false}
                      className="w-32"
                    />

                  <Button variant="primary" size="md" shadow type="submit">
                    Guardar
                  </Button>
                </Form>

                <Form action={deleteAction} className="border-t-2 border-dashed border-black pt-3">
                <Button variant="secondary" size="md" shadow type="submit">
                  Eliminar variante
                </Button>
                </Form>
              </div>
            )}
          </div>
        );
      })}

      {/* Add variant */}
      {!showAddForm ? (
        <Button
          onClick={() => setShowAddForm(true)}
          className="mt-1 rounded-xl border-2 border-dashed border-black bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg)]"
        >
          + Agregar variante
        </Button>
      ) : (
        <Form
          action={createAction}
          className="space-y-4 rounded-xl border-2 border-black bg-white p-4 shadow-[2px_2px_0_0_#111]"
        >
          <p className="font-semibold text-sm">Nueva variante</p>

          <VariantCheckboxes dimensions={dimensions} selectedIds={new Set()} />

          <Input
            label="Stock"
            name="stock"
            type="number"
            min={0}
            required
            defaultValue={0}
            fullWidth={false}
            className="w-32"
          />

          <div className="flex gap-2">
            <Button variant="primary" size="lg" shadow type="submit">
              Agregar
            </Button>
            <Button variant="secondary" size="lg" shadow onClick={() => setShowAddForm(false)}>
              Cancelar
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}
