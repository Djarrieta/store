"use client";

import { useMemo, useState } from "react";

import Button from "@/app/components/Button";
import { FormActions, FormCard } from "@/app/components/FormCard";
import Input, { Textarea } from "@/app/components/Input";
import { uploadImage } from "@/lib/supabase/storage";
import type { HomeHero } from "@/types";

interface HeroFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues: HomeHero;
}

export default function HeroForm({ action, defaultValues }: HeroFormProps) {
  const [imagesText, setImagesText] = useState(
    defaultValues.images.map((img) => img.url).join(", "),
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  function removeImage(url: string) {
    setImagesText((prev) =>
      prev
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part && part !== url)
        .join(", "),
    );
  }

  return (
    <FormCard action={action}>
      <Input
        label="Título principal"
        name="title"
        placeholder="ej. Naturalmente tú"
        defaultValue={defaultValues.title}
      />

      <Input
        label="Subtítulo"
        name="subtitle"
        placeholder="ej. Colección botánica"
        defaultValue={defaultValues.subtitle}
      />

      <Textarea
        label="Descripción"
        name="description"
        rows={4}
        placeholder="Un párrafo breve que exprese la esencia de la marca…"
        defaultValue={defaultValues.description}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Texto del botón"
          name="cta_label"
          placeholder="ej. Ver colección"
          defaultValue={defaultValues.cta_label}
        />
        <Input
          label="Enlace del botón"
          name="cta_href"
          placeholder="ej. /products"
          defaultValue={defaultValues.cta_href}
        />
      </div>

      <Textarea
        label="URLs de imágenes"
        value={imagesText}
        onChange={(e) => setImagesText(e.target.value)}
        rows={3}
        placeholder="https://ejemplo.com/hero1.jpg, https://ejemplo.com/hero2.jpg"
      />

      <div className="grid gap-1">
        <span className="text-sm font-medium">
          Subir imágenes{" "}
          {uploading && <span className="text-[var(--muted)]">(subiendo…)</span>}
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
        {uploadError && <span className="text-sm text-red-600">{uploadError}</span>}
        {imageUrls.length > 0 && (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {imageUrls.map((url, i) => (
              <li
                key={`${url}-${i}`}
                className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--card)] p-2 text-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
                <span className="min-w-0 flex-1 truncate" title={url}>
                  {url}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(url)}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input type="hidden" name="images" value={serializedImages} />

      <FormActions>
        <Button href="/admin/content" variant="secondary" size="lg">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="lg" shadow>
          Guardar hero
        </Button>
      </FormActions>
    </FormCard>
  );
}
