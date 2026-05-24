"use client";

import { useState } from "react";

import Button from "@/app/components/Button";
import Input, { Select } from "@/app/components/Input";
import { uploadStorageObject } from "@/lib/supabase/storage";
import type { CustomizationKind, PrintTemplate, SafeArea } from "@/types";

interface PhoneCaseAttrs { brand?: string; model?: string }
interface TshirtAttrs   { placement?: "front" | "back" }
interface MugAttrs      { wrap?: "full" | "partial" }

interface Props {
  kind: CustomizationKind;
  defaultValue: PrintTemplate | null;
}

export default function PrintTemplateFields({ kind, defaultValue }: Props) {
  const attrs = (defaultValue?.attributes ?? {}) as
    PhoneCaseAttrs & TshirtAttrs & MugAttrs;
  const safeArea: SafeArea | null = defaultValue?.safe_area ?? null;

  const [mockupPath, setMockupPath] = useState<string>(defaultValue?.mockup_path ?? "");
  const [maskPath, setMaskPath] = useState<string>(defaultValue?.mask_path ?? "");
  const [uploading, setUploading] = useState<null | "mockup" | "mask">(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(file: File | null, target: "mockup" | "mask") {
    if (!file) return;
    setUploading(target);
    setUploadError(null);
    try {
      const { path } = await uploadStorageObject(file, "print-templates");
      if (target === "mockup") setMockupPath(path);
      else setMaskPath(path);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error subiendo archivo");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        label="Etiqueta"
        name="label"
        required
        defaultValue={defaultValue?.label ?? ""}
        placeholder={kindPlaceholder(kind)}
      />

      {kind === "phone_case" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Marca"
            name="attr_brand"
            required
            defaultValue={attrs.brand ?? ""}
            placeholder="ej. Apple"
          />
          <Input
            label="Modelo"
            name="attr_model"
            required
            defaultValue={attrs.model ?? ""}
            placeholder="ej. iPhone 15 Pro"
          />
        </div>
      )}

      {kind === "tshirt" && (
        <Select
          label="Ubicación del estampado"
          name="attr_placement"
          required
          defaultValue={attrs.placement ?? ""}
        >
          <option value="">— Selecciona —</option>
          <option value="front">Frente</option>
          <option value="back">Espalda</option>
        </Select>
      )}

      {kind === "mug" && (
        <Select
          label="Tipo de wrap"
          name="attr_wrap"
          required
          defaultValue={attrs.wrap ?? ""}
        >
          <option value="">— Selecciona —</option>
          <option value="full">Completo</option>
          <option value="partial">Parcial</option>
        </Select>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Ancho (mm)"
          name="width_mm"
          type="number"
          min={1}
          step="0.1"
          required
          defaultValue={defaultValue?.width_mm ?? ""}
        />
        <Input
          label="Alto (mm)"
          name="height_mm"
          type="number"
          min={1}
          step="0.1"
          required
          defaultValue={defaultValue?.height_mm ?? ""}
        />
        <Input
          label="DPI"
          name="print_dpi"
          type="number"
          min={72}
          step={1}
          required
          defaultValue={defaultValue?.print_dpi ?? 300}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FileSlot
          label="Mockup (PNG)"
          name="mockup_path"
          value={mockupPath}
          uploading={uploading === "mockup"}
          onFile={(f) => handleUpload(f, "mockup")}
          onClear={() => setMockupPath("")}
        />
        <FileSlot
          label="Máscara (PNG, opcional)"
          name="mask_path"
          value={maskPath}
          uploading={uploading === "mask"}
          onFile={(f) => handleUpload(f, "mask")}
          onClear={() => setMaskPath("")}
        />
      </div>
      {uploadError && (
        <p className="text-xs text-[var(--error-text)]">{uploadError}</p>
      )}

      <fieldset className="space-y-2 rounded-lg border-2 border-dashed border-[var(--border)] p-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wide">
          Área segura (0..1, opcional)
        </legend>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            label="x"
            name="safe_area_x"
            type="number"
            step="0.001"
            min={0}
            max={1}
            defaultValue={safeArea?.x ?? ""}
          />
          <Input
            label="y"
            name="safe_area_y"
            type="number"
            step="0.001"
            min={0}
            max={1}
            defaultValue={safeArea?.y ?? ""}
          />
          <Input
            label="ancho"
            name="safe_area_width"
            type="number"
            step="0.001"
            min={0}
            max={1}
            defaultValue={safeArea?.width ?? ""}
          />
          <Input
            label="alto"
            name="safe_area_height"
            type="number"
            step="0.001"
            min={0}
            max={1}
            defaultValue={safeArea?.height ?? ""}
          />
        </div>
      </fieldset>
    </div>
  );
}

function kindPlaceholder(kind: CustomizationKind) {
  if (kind === "phone_case") return "ej. iPhone 15 Pro";
  if (kind === "tshirt") return "ej. Talla M — Frente";
  return "ej. Mug 11oz";
}

function FileSlot({
  label,
  name,
  value,
  uploading,
  onFile,
  onClear,
}: {
  label: string;
  name: string;
  value: string;
  uploading: boolean;
  onFile: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-sm font-semibold">
        {label} {uploading && <span className="text-[var(--muted)]">(subiendo…)</span>}
      </span>
      <Input
        type="file"
        accept="image/png"
        disabled={uploading}
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <input type="hidden" name={name} value={value} />
      {value && (
        <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span className="truncate" title={value}>{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="none"
            className="font-semibold !text-[var(--error-text)] hover:!text-[var(--error-text)]"
            onClick={onClear}
          >
            quitar
          </Button>
        </div>
      )}
    </div>
  );
}
