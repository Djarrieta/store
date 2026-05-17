"use client";

import { useMemo, useState } from "react";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import type { Product, ProductImage } from "@/types";
import Button from "@/app/components/Button";

interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<Product>;
}

export default function ProductForm({
  action,
  defaultValues,
}: ProductFormProps) {
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

      <Button variant="primary" size="lg" type="submit">
        {defaultValues?.id ? "Actualizar producto" : "Crear producto"}
      </Button>
    </form>
  );
}
