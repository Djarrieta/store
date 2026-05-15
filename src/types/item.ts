export interface ItemImage {
  url: string;
  description?: string;
}

export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  images: ItemImage[];
  price: number;
  category: string;
  created_at: string;
  updated_at: string;
  profile?: { display_name: string; avatar_url: string | null };
}

export type CreateItemInput = Omit<
  Item,
  "id" | "user_id" | "created_at" | "updated_at" | "profile"
>;

export type UpdateItemInput = Partial<CreateItemInput>;
