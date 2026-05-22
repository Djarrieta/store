"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import Button from "@/app/components/Button";
import Input, { Select } from "@/app/components/Input";
import type { CustomizationKind, PrintTemplate } from "@/types";

const KonvaStage = dynamic(() => import("./KonvaStage"), { ssr: false });

export interface EditorVariant {
  itemId: string;
  label: string;
  template: PrintTemplate;
  mockupUrl: string | null;
  maskUrl: string | null;
}

export interface SourceImage {
  url: string;
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const DEFAULT_TRANSFORM: Transform = { x: 0.1, y: 0.1, scale: 0.8, rotation: 0 };

const KIND_LABELS: Record<CustomizationKind, string> = {
  phone_case: "Funda de teléfono",
  tshirt: "Camiseta",
  mug: "Mug",
};

interface Props {
  kind: CustomizationKind;
  variants: EditorVariant[];
}

export default function PreviewEditor({ kind, variants }: Props) {
  const [selectedId, setSelectedId] = useState<string>(variants[0]?.itemId ?? "");
  const [source, setSource] = useState<SourceImage | null>(null);
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [loadError, setLoadError] = useState<string | null>(null);

  const variant = useMemo(
    () => variants.find((v) => v.itemId === selectedId) ?? variants[0],
    [variants, selectedId],
  );

  async function handleFile(file: File | null) {
    setLoadError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLoadError(`Formato no soportado (${file.type || "desconocido"}).`);
      return;
    }
    try {
      // createImageBitmap reads the File directly — avoids blob URL + <img> roundtrip
      // which can fail silently under Next dev CSP or async setState races.
      const bitmap = await createImageBitmap(file);
      const dims = { width: bitmap.width, height: bitmap.height };
      bitmap.close?.();
      const url = URL.createObjectURL(file);
      setSource((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url, ...dims };
      });
      setTransform(DEFAULT_TRANSFORM);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "error desconocido";
      setLoadError(`No se pudo leer la imagen (${reason}).`);
    }
  }

  function handleFit() {
    if (!source || !variant) return;
    const tplAspect = variant.template.width_mm / variant.template.height_mm;
    const imgAspect = source.width / source.height;
    if (imgAspect >= tplAspect) {
      const scale = 1;
      const drawnH = (source.height / source.width) * scale;
      setTransform({ x: 0, y: (1 - drawnH * (tplAspect / imgAspect)) / 2, scale, rotation: 0 });
    } else {
      const scale = imgAspect / tplAspect;
      setTransform({ x: (1 - scale) / 2, y: 0, scale, rotation: 0 });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-[2px_2px_0_0_var(--shadow)]">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Tipo
          </p>
          <p className="text-sm font-semibold">{KIND_LABELS[kind]}</p>
        </div>

        <Select
          label="Variación"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {variants.map((v) => (
            <option key={v.itemId} value={v.itemId}>
              {v.label}
            </option>
          ))}
        </Select>

        <div className="grid gap-1">
          <span className="text-sm font-semibold">Imagen de prueba</span>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = input.files?.[0] ?? null;
              await handleFile(file);
              input.value = "";
            }}
          />
          {loadError && (
            <span className="text-xs text-[var(--error-text)]">{loadError}</span>
          )}
          {source && (
            <span className="text-xs text-[var(--muted)]">
              {source.width} × {source.height} px
            </span>
          )}
        </div>

        {source && (
          <div className="space-y-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-[2px_2px_0_0_var(--shadow)]">
            <RangeField
              label={`Escala: ${(transform.scale * 100).toFixed(0)}%`}
              min={0.05}
              max={1.5}
              step={0.01}
              value={transform.scale}
              onChange={(scale) => setTransform((t) => ({ ...t, scale }))}
            />
            <RangeField
              label={`Rotación: ${((transform.rotation * 180) / Math.PI).toFixed(0)}°`}
              min={-Math.PI}
              max={Math.PI}
              step={0.01}
              value={transform.rotation}
              onChange={(rotation) => setTransform((t) => ({ ...t, rotation }))}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleFit}
                variant="secondary"
                size="md"
                shadow
                className="flex-1"
              >
                Ajustar
              </Button>
              <Button
                onClick={() => setTransform(DEFAULT_TRANSFORM)}
                variant="secondary"
                size="md"
                shadow
                className="flex-1"
              >
                Reiniciar
              </Button>
            </div>
          </div>
        )}

        {variant && (
          <TemplateInfo template={variant.template} />
        )}
      </aside>

      <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-[2px_2px_0_0_var(--shadow)]">
        {variant ? (
          <KonvaStage
            variant={variant}
            source={source}
            transform={transform}
            onTransformChange={setTransform}
          />
        ) : null}
      </div>
    </div>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </label>
  );
}

function TemplateInfo({ template }: { template: PrintTemplate }) {
  const printablePxW = Math.round((template.width_mm / 25.4) * template.print_dpi);
  const printablePxH = Math.round((template.height_mm / 25.4) * template.print_dpi);
  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-3 text-xs space-y-1">
      <p className="font-bold uppercase tracking-wide">Plantilla</p>
      <p>{template.label}</p>
      <p>
        {template.width_mm} × {template.height_mm} mm @ {template.print_dpi} DPI
      </p>
      <p className="text-[var(--muted)]">
        Impresión: {printablePxW} × {printablePxH} px
      </p>
    </div>
  );
}

function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("image load failed"));
    img.src = url;
  });
}
