export interface Item {
  id: string;
  product_id: string;
  sku: string | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export type CreateItemInput = Omit<Item, "id" | "created_at" | "updated_at">;

export type UpdateItemInput = Partial<CreateItemInput>;
