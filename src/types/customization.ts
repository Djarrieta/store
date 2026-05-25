import type { SafeArea } from "./print-template";

/** Normalized 0..1 image transform; pivot = image top-left. Uniform scale. */
export interface CustomizationTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface Customization {
  id: string;
  user_id: string;
  item_id: string;
  source_image_path: string;
  source_width_px: number;
  source_height_px: number;
  transform: CustomizationTransform;
  preview_path: string;
  print_path: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateCustomizationInput = Omit<
  Customization,
  "id" | "created_at" | "updated_at" | "print_path"
> & { print_path?: string | null };

/**
 * Self-contained snapshot persisted in `orders.items[].customization`.
 * Carries everything needed to render the print file, even if the source
 * customization row or its print template is later deleted.
 */
export interface OrderCustomizationSnapshot {
  id: string;
  item_id: string;
  template_kind: {
    slug: string;
    label: string;
  };
  template_label: string;
  source_image_path: string;
  source_width_px: number;
  source_height_px: number;
  transform: CustomizationTransform;
  template: {
    width_mm: number;
    height_mm: number;
    print_dpi: number;
    mockup_path: string | null;
    mask_path: string | null;
    safe_area: SafeArea | null;
  };
  preview_path: string;
  print_path: string | null;
}
