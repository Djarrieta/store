import type { CustomizationTransform, PrintTemplate } from "@/types";

export interface EditorVariant {
  itemId: string;
  label: string;
  template: PrintTemplate;
  mockupUrl: string | null;
  maskUrl: string | null;
}

export interface SourceImage {
  /** Object URL or data URL — what the editor renders. */
  url: string;
  width: number;
  height: number;
  /** The actual blob, kept so we can persist it later. */
  blob?: Blob;
}

export type Transform = CustomizationTransform;

export const DEFAULT_TRANSFORM: Transform = {
  x: 0.1,
  y: 0.1,
  scale: 0.8,
  rotation: 0,
};

export function computeEffectiveDpi(
  source: { width: number } | null,
  transform: Transform,
  template: { width_mm: number; print_dpi: number },
): number | null {
  if (!source) return null;
  const printableWidthPx = (template.width_mm / 25.4) * template.print_dpi;
  const drawnWidthPx = transform.scale * printableWidthPx;
  if (drawnWidthPx <= 0) return null;
  return (source.width / drawnWidthPx) * template.print_dpi;
}

export function dpiTone(
  effectiveDpi: number | null,
): "muted" | "ok" | "warn" | "danger" {
  if (effectiveDpi === null) return "muted";
  if (effectiveDpi < 72) return "danger";
  if (effectiveDpi < 150) return "warn";
  return "ok";
}
