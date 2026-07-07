"use client";

import { useMemo, useState } from "react";

import CustomizationEditor from "@/app/components/customization/CustomizationEditor";
import {
  DEFAULT_TRANSFORM,
  type EditorVariant,
  type SourceImage,
  type Transform,
} from "@/app/components/customization/types";
import { Select } from "@/app/components/Input";
import type { CustomizationKind } from "@/types";

interface Props {
  kind: CustomizationKind;
  variants: EditorVariant[];
}

export default function PreviewEditorClient({ kind, variants }: Props) {
  const [selectedId, setSelectedId] = useState(variants[0]?.itemId ?? "");
  const [source, setSource] = useState<SourceImage | null>(null);
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [loadError, setLoadError] = useState<string | null>(null);

  const variant = useMemo(
    () => variants.find((v) => v.itemId === selectedId) ?? variants[0],
    [variants, selectedId],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-end">
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-soft-sm)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Tipo
          </p>
          <p className="text-sm font-semibold">{kind.label}</p>
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
      </div>

      {loadError && (
        <p className="text-xs text-[var(--error-text)]">{loadError}</p>
      )}

      {variant && (
        <CustomizationEditor
          variant={variant}
          source={source}
          transform={transform}
          onTransformChange={setTransform}
          onSourceChange={(next, err) => {
            setSource(next);
            setLoadError(err);
          }}
        />
      )}
    </div>
  );
}
