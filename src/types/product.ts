import type { CategoryWithParent } from "./category";

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
  created_at: string;
  updated_at: string;
}

// Joined shape fetched via Supabase nested select:
// .select('*, category:category_id(*, parent:parent_id(*))')
export interface ProductWithCategory extends Product {
  category: CategoryWithParent | null;
}

export type CreateProductInput = Omit<Product, "id" | "created_at" | "updated_at">;
export type UpdateProductInput = Partial<CreateProductInput>;
