"use client";

import { useState } from "react";

import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import type { KindAttributeField } from "@/types";

interface DraftOption {
  value: string;
  label: string;
}

interface DraftField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required: boolean;
  placeholder?: string;
  options?: DraftOption[];
}

function toDrafts(initial: KindAttributeField[]): DraftField[] {
  return initial.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    required: f.required,
    placeholder: f.type !== "select" ? f.placeholder : undefined,
    options: f.type === "select" ? f.options.map((o) => ({ ...o })) : undefined,
  }));
}

function normalize(drafts: DraftField[]): KindAttributeField[] {
  return drafts.map((d) => {
    if (d.type === "select") {
      return {
        key: d.key,
        label: d.label,
        type: "select",
        required: d.required,
        options: (d.options ?? []).map((o) => ({
          value: o.value,
          label: o.label,
        })),
      };
    }
    return {
      key: d.key,
      label: d.label,
      type: d.type,
      required: d.required,
      placeholder: d.placeholder?.trim() || undefined,
    };
  });
}

export default function SchemaEditor({
  initial,
  name,
}: {
  initial: KindAttributeField[];
  name: string;
}) {
  const [fields, setFields] = useState<DraftField[]>(toDrafts(initial));

  function update(idx: number, patch: Partial<DraftField>) {
    setFields((current) =>
      current.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    );
  }

  function addField() {
    setFields((current) => [
      ...current,
      {
        key: "",
        label: "",
        type: "text",
        required: true,
        placeholder: "",
      },
    ]);
  }

  function removeField(idx: number) {
    setFields((current) => current.filter((_, i) => i !== idx));
  }

  function addOption(idx: number) {
    setFields((current) =>
      current.map((f, i) =>
        i === idx
          ? { ...f, options: [...(f.options ?? []), { value: "", label: "" }] }
          : f,
      ),
    );
  }

  function updateOption(idx: number, oIdx: number, patch: Partial<DraftOption>) {
    setFields((current) =>
      current.map((f, i) =>
        i === idx
          ? {
              ...f,
              options: (f.options ?? []).map((o, j) =>
                j === oIdx ? { ...o, ...patch } : o,
              ),
            }
          : f,
      ),
    );
  }

  function removeOption(idx: number, oIdx: number) {
    setFields((current) =>
      current.map((f, i) =>
        i === idx
          ? { ...f, options: (f.options ?? []).filter((_, j) => j !== oIdx) }
          : f,
      ),
    );
  }

  const serialized = JSON.stringify(normalize(fields));

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={serialized} />

      {fields.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          No hay campos. Agrega al menos uno para capturar atributos por variación.
        </p>
      )}

      {fields.map((field, idx) => (
        <div
          key={idx}
          className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Key (sin espacios)"
              value={field.key}
              onChange={(e) => update(idx, { key: e.target.value })}
              placeholder="ej. brand"
              required
            />
            <Input
              label="Etiqueta visible"
              value={field.label}
              onChange={(e) => update(idx, { label: e.target.value })}
              placeholder="ej. Marca"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Tipo
              <select
                value={field.type}
                onChange={(e) =>
                  update(idx, {
                    type: e.target.value as DraftField["type"],
                    options:
                      e.target.value === "select"
                        ? field.options ?? [{ value: "", label: "" }]
                        : undefined,
                  })
                }
                className="rounded-[var(--radius-btn-md)] border border-[var(--border)] bg-[var(--background)] p-2"
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="select">Selección</option>
              </select>
            </label>

            <label className="flex items-end gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => update(idx, { required: e.target.checked })}
                className="size-5"
              />
              Obligatorio
            </label>

            {field.type !== "select" && (
              <Input
                label="Placeholder"
                value={field.placeholder ?? ""}
                onChange={(e) => update(idx, { placeholder: e.target.value })}
              />
            )}
          </div>

          {field.type === "select" && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Opciones</p>
              {(field.options ?? []).map((opt, oIdx) => (
                <div key={oIdx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    label="value"
                    value={opt.value}
                    onChange={(e) =>
                      updateOption(idx, oIdx, { value: e.target.value })
                    }
                    placeholder="ej. front"
                  />
                  <Input
                    label="label"
                    value={opt.label}
                    onChange={(e) =>
                      updateOption(idx, oIdx, { label: e.target.value })
                    }
                    placeholder="ej. Frente"
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      shadow
                      onClick={() => removeOption(idx, oIdx)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                shadow
                onClick={() => addOption(idx)}
              >
                + Opción
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="danger"
              size="sm"
              shadow
              onClick={() => removeField(idx)}
            >
              Eliminar campo
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" size="md" shadow onClick={addField}>
        + Agregar campo
      </Button>
    </div>
  );
}
