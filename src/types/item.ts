export interface Item {
  id: string;
  product_id: string;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface ItemCategory {
  item_id: string;
  category_id: string;
}

export interface ItemVariantCategory {
  id: string;
  name: string;
  parent_id: string | null;
  parent: { id: string; name: string } | null;
}

export interface ItemWithCategories extends Item {
  item_categories: Array<{ category: ItemVariantCategory }>;
}

export type CreateItemInput = Omit<Item, "id" | "created_at" | "updated_at">;

export type UpdateItemInput = Partial<CreateItemInput>;
