"use client";

import { useRef, useState } from "react";

import Button from "@/app/components/Button";
import Input, { Select } from "@/app/components/Input";
import { uploadStorageObject } from "@/lib/supabase/storage";
import type {
  CustomizationKind,
  KindAttributeField,
  PrintTemplate,
  SafeArea,
} from "@/types";

interface Props {
  kind: CustomizationKind;
  defaultValue: PrintTemplate | null;
}

export default function PrintTemplateFields({ kind, defaultValue }: Props) {
  const attrs = (defaultValue?.attributes ?? {}) as Record<string, string | number>;
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
        placeholder={`ej. ${kind.label}`}
      />

      {(kind.attribute_schema ?? []).map((field) => (
        <AttributeField key={field.key} field={field} value={attrs[field.key]} />
      ))}

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

function AttributeField({
  field,
  value,
}: {
  field: KindAttributeField;
  value: string | number | undefined;
}) {
  const name = `attr_${field.key}`;
  if (field.type === "select") {
    return (
      <Select
        label={field.label}
        name={name}
        required={field.required}
        defaultValue={value !== undefined ? String(value) : ""}
      >
        <option value="">— Selecciona —</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    );
  }
  return (
    <Input
      label={field.label}
      name={name}
      type={field.type === "number" ? "number" : "text"}
      required={field.required}
      defaultValue={value !== undefined ? String(value) : ""}
      placeholder={field.placeholder}
    />
  );
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <div className="grid gap-1">
      <span className="text-sm font-semibold">
        {label} {uploading && <span className="text-[var(--muted)]">(subiendo…)</span>}
      </span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        disabled={uploading}
        className="sr-only"
        onChange={(e) => {
          const input = e.currentTarget;
          const file = input.files?.[0] ?? null;
          setFileName(file?.name ?? null);
          onFile(file);
          input.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2 rounded-md border-2 border-[var(--border)] bg-[var(--card)] px-3 py-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          shadow
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Elegir archivo
        </Button>
        <span className="text-sm text-[var(--muted)] truncate">
          {fileName ?? "Ningún archivo seleccionado"}
        </span>
      </div>
      <input type="hidden" name={name} value={value} />
      {value && (
        <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span className="truncate" title={value}>{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="none"
            className="font-semibold !text-[var(--error-text)] hover:!text-[var(--error-text)]"
            onClick={() => {
              setFileName(null);
              onClear();
            }}
          >
            quitar
          </Button>
        </div>
      )}
    </div>
  );
}
