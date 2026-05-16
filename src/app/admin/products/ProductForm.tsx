"use client";

import { useMemo, useState } from "react";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import type { Category, Product, ProductImage } from "@/types";

interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<Product>;
  categories: Category[];
}

export default function ProductForm({
  action,
  defaultValues,
  categories,
}: ProductFormProps) {
  const topLevel = categories.filter((c) => c.parent_id === null);
  const subcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const defaultParentId =
    defaultValues?.category_id
      ? (categories.find((c) => c.id === defaultValues.category_id)?.parent_id ?? "")
      : "";

  const [selectedParent, setSelectedParent] = useState(defaultParentId);

  const [imagesText, setImagesText] = useState(
    (defaultValues?.images ?? []).map((img: ProductImage) => img.url).join(", "),
  );

  const serializedImages = useMemo(() => {
    const images: ProductImage[] = imagesText
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((url) => ({ url }));
    return JSON.stringify(images);
  }, [imagesText]);

  return (
    <form action={action} className="min-w-0 space-y-4 rounded-xl border-2 border-black bg-white p-5">
      <label className="grid gap-1 text-sm font-medium">
        Título
        <input
          name="title"
          maxLength={MAX_TITLE_LENGTH}
          required
          placeholder="ej. Chaqueta de cuero vintage"
          defaultValue={defaultValues?.title ?? ""}
          className="w-full rounded-md border-2 border-black px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Descripción
        <textarea
          name="description"
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={5}
          placeholder="Describe el producto…"
          defaultValue={defaultValues?.description ?? ""}
          className="w-full rounded-md border-2 border-black px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Precio
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultValues?.price ?? 0}
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Descuento (%)
          <input
            name="discount"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={defaultValues?.discount ?? 0}
            className="w-full rounded-md border-2 border-black px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Categoría
          <select
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
            className="w-full rounded-md border-2 border-black px-3 py-2 bg-white"
          >
            <option value="">— Ninguna —</option>
            {topLevel.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Subcategoría
          <select
            name="category_id"
            defaultValue={defaultValues?.category_id ?? ""}
            className="w-full rounded-md border-2 border-black px-3 py-2 bg-white"
          >
            <option value="">— Ninguna —</option>
            {(selectedParent ? subcategories(selectedParent) : []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        Etiquetas
        <input
          name="tags"
          placeholder="ej. vintage, cuero, chaqueta"
          defaultValue={(defaultValues?.tags ?? []).join(", ")}
          className="w-full rounded-md border-2 border-black px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        URLs de imágenes
        <textarea
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          rows={3}
          placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg"
          className="w-full rounded-md border-2 border-black px-3 py-2"
        />
      </label>

      <input type="hidden" name="images" value={serializedImages} />

      <button
        type="submit"
        className="rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold"
      >
        {defaultValues?.id ? "Actualizar producto" : "Crear producto"}
      </button>
    </form>
  );
}
