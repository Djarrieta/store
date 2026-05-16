export interface OrderItem {
  product_id: string;
  title: string;
  qty: number;
  unit_price: number;
  sku: string | null;
}

export type OrderStatus = "pending_approval" | "approved" | "rejected" | "fulfilled";

export interface Order {
  id: string;
  user_ref: string;
  user_name: string | null;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateOrderInput = Omit<Order, "id" | "status" | "created_at" | "updated_at">;
