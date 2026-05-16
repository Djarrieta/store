export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  type: 'product' | 'variant';
  created_at: string;
}

// Category with its parent preloaded — used in product joined queries
// Fetched via: .select('*, parent:parent_id(*)')
export interface CategoryWithParent extends Category {
  parent: Category | null;
}

// Convenience type for a category with its children preloaded
export interface CategoryWithChildren extends Category {
  children: Category[];
}

export type CreateCategoryInput = Omit<Category, "id" | "created_at">;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
