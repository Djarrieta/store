"use client";

import { useMemo, useState } from "react";

import Button from "@/app/components/Button";
import { FormActions, FormCard } from "@/app/components/FormCard";
import Input, { Checkbox, Select, Textarea } from "@/app/components/Input";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import { uploadImage } from "@/lib/supabase/storage";
import type { CustomizationKind, Product, ProductImage } from "@/types";

interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<Product>;
  /** Whether this product already has variations (items). Controls the kind-change confirm. */
  hasItems?: boolean;
}

const KIND_LABELS: Record<CustomizationKind, string> = {
  phone_case: "Funda de teléfono",
  tshirt: "Camiseta",
  mug: "Mug",
};

export default function ProductForm({
  action,
  defaultValues,
  hasItems = false,
}: ProductFormProps) {
  const [imagesText, setImagesText] = useState(
    (defaultValues?.images ?? []).map((img: ProductImage) => img.url).join(", "),
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customizable, setCustomizable] = useState<boolean>(
    defaultValues?.customizable ?? false,
  );
  const [kind, setKind] = useState<CustomizationKind | "">(
    defaultValues?.customization_kind ?? "",
  );

  const originalKind = defaultValues?.customization_kind ?? null;
  const kindChanged = originalKind !== null && kind !== "" && kind !== originalKind;

  const imageUrls = useMemo(
    () =>
      imagesText
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    [imagesText],
  );

  const serializedImages = useMemo(
    () => JSON.stringify(imageUrls.map((url) => ({ url }))),
    [imageUrls],
  );

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const urls = await Promise.all(
        Array.from(files).map((file) => uploadImage(file, "item-images")),
      );
      setImagesText((prev) => {
        const existing = prev.trim();
        const joined = urls.join(", ");
        return existing ? `${existing}, ${joined}` : joined;
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleAction(formData: FormData) {
    if (kindChanged && hasItems) {
      const ok = window.confirm(
        "Cambiar el tipo de personalización borrará todas las variaciones existentes y sus plantillas. ¿Continuar?",
      );
      if (!ok) return;
    }
    await action(formData);
  }

  return (
    <FormCard action={handleAction}>
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

      <div className="grid gap-1">
        <span className="text-sm font-semibold">
          Subir imágenes {uploading && <span className="text-[var(--muted)]">(subiendo…)</span>}
        </span>
        <Input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {uploadError && (
          <span className="text-sm text-red-600">{uploadError}</span>
        )}
        {imageUrls.length > 0 && (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {imageUrls.map((url, i) => (
              <li
                key={`${url}-${i}`}
                className="flex items-center gap-2 rounded border-2 border-[var(--border)] bg-[var(--card)] p-2 text-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
                <span className="truncate" title={url}>{url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input type="hidden" name="images" value={serializedImages} />

      <label className="flex items-center gap-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[2px_2px_0_0_var(--shadow)] cursor-pointer">
        <Checkbox
          name="ocultar"
          defaultChecked={defaultValues?.ocultar ?? false}
        />
        <span className="text-sm font-semibold">Ocultar producto (no visible al público)</span>
      </label>

      <fieldset className="space-y-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[2px_2px_0_0_var(--shadow)]">
        <legend className="px-1 text-sm font-bold uppercase tracking-wide">
          Personalización
        </legend>

        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            name="customizable"
            checked={customizable}
            onChange={(e) => setCustomizable(e.target.checked)}
          />
          <span className="text-sm font-semibold">
            Personalizable (imprime una imagen del cliente)
          </span>
        </label>

        <Select
          label="Tipo de personalización"
          name="customization_kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as CustomizationKind | "")}
          required={customizable}
          disabled={!customizable && !originalKind}
        >
          <option value="">— Selecciona —</option>
          {(Object.keys(KIND_LABELS) as CustomizationKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </Select>

        {!customizable && originalKind && (
          <p className="text-xs text-[var(--muted)]">
            El tipo se conserva mientras la personalización esté desactivada. Vuelve a activarla
            para mostrarla al público.
          </p>
        )}
        {kindChanged && hasItems && (
          <p className="text-xs font-semibold text-[var(--error-text)]">
            Cambiar el tipo borrará las variaciones existentes y sus plantillas.
          </p>
        )}
        {customizable && !kind && (
          <p className="text-xs text-[var(--muted)]">
            Selecciona un tipo para poder guardar.
          </p>
        )}
      </fieldset>

      <FormActions>
        <Button variant="primary" size="lg" type="submit" disabled={uploading}>
          {uploading
            ? "Subiendo imágenes…"
            : defaultValues?.id
              ? "Actualizar producto"
              : "Crear producto"}
        </Button>
      </FormActions>
    </FormCard>
  );
}
