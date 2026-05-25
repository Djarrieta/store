export interface SafeArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type KindAttributeField =
  | {
      key: string;
      label: string;
      type: "text" | "number";
      required: boolean;
      placeholder?: string;
    }
  | {
      key: string;
      label: string;
      type: "select";
      required: boolean;
      options: { value: string; label: string }[];
    };

export interface CustomizationKind {
  id: string;
  slug: string;
  label: string;
  picker_label: string;
  attribute_schema: KindAttributeField[];
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateCustomizationKindInput = Omit<
  CustomizationKind,
  "id" | "created_at" | "updated_at"
>;

export type UpdateCustomizationKindInput = Partial<
  Omit<CustomizationKind, "id" | "slug" | "created_at" | "updated_at">
>;

export interface PrintTemplate {
  item_id: string;
  label: string;
  attributes: Record<string, string | number>;
  width_mm: number;
  height_mm: number;
  print_dpi: number;
  mockup_path: string | null;
  mask_path: string | null;
  safe_area: SafeArea | null;
  created_at: string;
  updated_at: string;
}

export type CreatePrintTemplateInput = Omit<
  PrintTemplate,
  "created_at" | "updated_at"
>;

export type UpdatePrintTemplateInput = Partial<
  Omit<PrintTemplate, "item_id" | "created_at" | "updated_at">
>;
