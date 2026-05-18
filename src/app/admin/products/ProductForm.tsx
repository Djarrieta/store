"use client";

import { useMemo, useState } from "react";

import Button from "@/app/components/Button";
import { FormActions, FormCard } from "@/app/components/FormCard";
import Input, { Textarea } from "@/app/components/Input";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import type { Product, ProductImage } from "@/types";

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
    <FormCard action={action}>
      <Input
        label="Título"
        name="title"
        maxLength={MAX_TITLE_LENGTH}
        required
        placeholder="ej. Chaqueta de cuero vintage"
        defaultValue={defaultValues?.title ?? ""}
      />

      <Textarea
        label="Descripción"
        name="description"
        maxLength={MAX_DESCRIPTION_LENGTH}
        rows={5}
        placeholder="Describe el producto…"
        defaultValue={defaultValues?.description ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Precio"
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={defaultValues?.price ?? 0}
        />
        <Input
          label="Descuento (%)"
          name="discount"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={defaultValues?.discount ?? 0}
        />
      </div>

      <Input
        label="Etiquetas"
        name="tags"
        placeholder="ej. vintage, cuero, chaqueta"
        defaultValue={(defaultValues?.tags ?? []).join(", ")}
      />

      <Textarea
        label="URLs de imágenes"
        value={imagesText}
        onChange={(e) => setImagesText(e.target.value)}
        rows={3}
        placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg"
      />

      <input type="hidden" name="images" value={serializedImages} />

      <label className="flex items-center gap-3 rounded-xl border-2 border-black bg-[var(--card)] px-4 py-3 shadow-[2px_2px_0_0_#111] cursor-pointer">
        <Input
          type="checkbox"
          name="ocultar"
          defaultChecked={defaultValues?.ocultar ?? false}
          fullWidth={false}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        <span className="text-sm font-semibold">Ocultar producto (no visible al público)</span>
      </label>

      <FormActions>
        <Button variant="primary" size="lg" type="submit">
          {defaultValues?.id ? "Actualizar producto" : "Crear producto"}
        </Button>
      </FormActions>
    </FormCard>
  );
}
