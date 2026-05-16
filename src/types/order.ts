export interface OrderItem {
  product_id: string;
  title: string;
  qty: number;
  unit_price: number;
  sku: string | null;
}

export type OrderStatus = "created" | "pending_approval" | "approved" | "rejected" | "fulfilled" | "cancelled";

export interface Order {
  id: string;
  user_ref: string;
  user_name: string | null;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  notes: string | null;
  tracking_code: string | null;
  shipping_address: import("./address").ShippingAddressSnapshot | null;
  shipping_cost: number;
  address_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateOrderInput = Omit<Order, "id" | "status" | "created_at" | "updated_at">;
