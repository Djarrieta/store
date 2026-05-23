"use client";

import dynamic from "next/dynamic";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import Button from "@/app/components/Button";
import Input from "@/app/components/Input";

import type { KonvaStageHandle } from "./KonvaStage";
import {
  DEFAULT_TRANSFORM,
  type EditorVariant,
  type SourceImage,
  type Transform,
} from "./types";

const KonvaStage = dynamic(() => import("./KonvaStage"), { ssr: false });

interface Props {
  variant: EditorVariant;
  source: SourceImage | null;
  transform: Transform;
  onTransformChange: (next: Transform) => void;
  onSourceChange: (next: SourceImage | null, error: string | null) => void;
  showFileInput?: boolean;
}

export interface CustomizationEditorHandle {
  toDataUrl(pixelRatio?: number): string | null;
}

const CustomizationEditor = forwardRef<CustomizationEditorHandle, Props>(
  function CustomizationEditor(
    {
      variant,
      source,
      transform,
      onTransformChange,
      onSourceChange,
      showFileInput = true,
    },
    ref,
  ) {
    const stageRef = useRef<KonvaStageHandle | null>(null);
    const handleReady = useCallback((handle: KonvaStageHandle) => {
      stageRef.current = handle;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        toDataUrl: (pixelRatio) => stageRef.current?.toDataUrl(pixelRatio) ?? null,
      }),
      [],
    );

    async function handleFile(file: File | null) {
      if (!file) {
        onSourceChange(null, null);
        return;
      }
      if (!file.type.startsWith("image/")) {
        onSourceChange(null, `Formato no soportado (${file.type || "desconocido"}).`);
        return;
      }
      try {
        const bitmap = await createImageBitmap(file);
        const dims = { width: bitmap.width, height: bitmap.height };
        bitmap.close?.();
        const url = URL.createObjectURL(file);
        if (source?.url.startsWith("blob:")) URL.revokeObjectURL(source.url);
        onSourceChange({ url, ...dims, blob: file }, null);
        onTransformChange(DEFAULT_TRANSFORM);
      } catch (err) {
        const reason = err instanceof Error ? err.message : "error desconocido";
        onSourceChange(null, `No se pudo leer la imagen (${reason}).`);
      }
    }

    function handleFit() {
      if (!source) return;
      const tplAspect = variant.template.width_mm / variant.template.height_mm;
      const imgAspect = source.width / source.height;
      if (imgAspect >= tplAspect) {
        const scale = 1;
        const drawnH = (source.height / source.width) * scale;
        onTransformChange({
          x: 0,
          y: (1 - drawnH * (tplAspect / imgAspect)) / 2,
          scale,
          rotation: 0,
        });
      } else {
        const scale = imgAspect / tplAspect;
        onTransformChange({ x: (1 - scale) / 2, y: 0, scale, rotation: 0 });
      }
    }

    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          {showFileInput && (
            <div className="grid gap-1">
              <span className="text-sm font-semibold">Imagen</span>
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
              {source && (
                <span className="text-xs text-[var(--muted)]">
                  {source.width} × {source.height} px
                </span>
              )}
            </div>
          )}

          {source && (
            <div className="space-y-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-[2px_2px_0_0_var(--shadow)]">
              <RangeField
                label={`Escala: ${(transform.scale * 100).toFixed(0)}%`}
                min={0.05}
                max={1.5}
                step={0.01}
                value={transform.scale}
                onChange={(scale) => onTransformChange({ ...transform, scale })}
              />
              <RangeField
                label={`Rotación: ${((transform.rotation * 180) / Math.PI).toFixed(0)}°`}
                min={-Math.PI}
                max={Math.PI}
                step={0.01}
                value={transform.rotation}
                onChange={(rotation) => onTransformChange({ ...transform, rotation })}
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
                  onClick={() => onTransformChange(DEFAULT_TRANSFORM)}
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
        </aside>

        <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4 shadow-[2px_2px_0_0_var(--shadow)]">
          <KonvaStage
            variant={variant}
            source={source}
            transform={transform}
            onTransformChange={onTransformChange}
            onReady={handleReady}
          />
        </div>
      </div>
    );
  },
);

export default CustomizationEditor;

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
  onChange: (next: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs">
      <span className="font-semibold">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
