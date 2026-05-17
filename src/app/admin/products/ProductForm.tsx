"use client";

import { useMemo, useState } from "react";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import type { Product, ProductImage } from "@/types";
import Button from "@/app/components/Button";
import Input, { Textarea } from "@/app/components/Input";
import { FormCard, FormField, FormActions } from "@/app/components/FormCard";

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
      <FormField label="Título" htmlFor="title">
        <Input
          id="title"
          name="title"
          maxLength={MAX_TITLE_LENGTH}
          required
          placeholder="ej. Chaqueta de cuero vintage"
          defaultValue={defaultValues?.title ?? ""}
        />
      </FormField>

      <FormField label="Descripción" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={5}
          placeholder="Describe el producto…"
          defaultValue={defaultValues?.description ?? ""}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Precio" htmlFor="price">
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultValues?.price ?? 0}
          />
        </FormField>

        <FormField label="Descuento (%)" htmlFor="discount">
          <Input
            id="discount"
            name="discount"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={defaultValues?.discount ?? 0}
          />
        </FormField>
      </div>

      <FormField label="Etiquetas" htmlFor="tags">
        <Input
          id="tags"
          name="tags"
          placeholder="ej. vintage, cuero, chaqueta"
          defaultValue={(defaultValues?.tags ?? []).join(", ")}
        />
      </FormField>

      <FormField label="URLs de imágenes" htmlFor="images_text">
        <Textarea
          id="images_text"
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          rows={3}
          placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg"
        />
      </FormField>

      <input type="hidden" name="images" value={serializedImages} />

      <FormActions>
        <Button variant="primary" size="lg" type="submit">
          {defaultValues?.id ? "Actualizar producto" : "Crear producto"}
        </Button>
      </FormActions>
    </FormCard>
  );
}
