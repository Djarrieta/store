export interface ItemImage {
  url: string;
  description?: string;
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  images: ItemImage[];
  price: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export type CreateItemInput = Omit<Item, "id" | "created_at" | "updated_at">;

export type UpdateItemInput = Partial<CreateItemInput>;
