export type CustomizationKind = "phone_case" | "tshirt" | "mug";

export interface PhoneCaseAttributes {
  brand: string;
  model: string;
}

export interface TshirtAttributes {
  placement: "front" | "back";
}

export interface MugAttributes {
  wrap: "full" | "partial";
}

export type PrintTemplateAttributes =
  | PhoneCaseAttributes
  | TshirtAttributes
  | MugAttributes
  | Record<string, unknown>;

export interface SafeArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrintTemplate {
  item_id: string;
  kind: CustomizationKind;
  label: string;
  attributes: PrintTemplateAttributes;
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
