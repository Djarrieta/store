import type { CategoryWithParent } from "./category";
import type { CustomizationKind } from "./print-template";

export interface ProductImage {
  url: string;
  description?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  discount: number;
  images: ProductImage[];
  category_id: string | null;
  tags: string[];
  ocultar: boolean;
  customizable: boolean;
  customization_kind_id: string | null;
  created_at: string;
  updated_at: string;
}

// Joined shape fetched via Supabase nested select:
// .select('*, category:category_id(*, parent:parent_id(*))')
export interface ProductWithCategory extends Product {
  category: CategoryWithParent | null;
}

// Joined shape including the customization kind row.
// .select('*, customization_kind:customization_kind_id(*)')
export interface ProductWithKind extends Product {
  customization_kind: CustomizationKind | null;
}

export type CreateProductInput = Omit<Product, "id" | "created_at" | "updated_at">;
export type UpdateProductInput = Partial<CreateProductInput>;
