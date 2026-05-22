"use server";

import { requireAuth } from "@/lib/auth";
import type { CartItem } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateWompiSignature } from "@/lib/wompi";
import type { ShippingAddressSnapshot } from "@/types";

export async function createOrderAndCheckout(
  cartItems: CartItem[],
  shippingAddress: ShippingAddressSnapshot,
  shippingCost: number,
): Promise<{
  orderId: string;
  reference: string;
  integrityHash: string;
  amountInCents: number;
}> {
  const user = await requireAuth();
  const supabase = await createClient();

  const itemsSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = itemsSubtotal + shippingCost;

  const itemsAmountInCents = cartItems.reduce(
    (sum, i) => sum + i.amountInCents * i.quantity,
    0,
  );
  const amountInCents = itemsAmountInCents + Math.round(shippingCost * 100);

  const orderItems = cartItems.map((item) => ({
    product_id: item.productId,
    item_id: item.itemId,
    title: item.title,
    qty: item.quantity,
    unit_price: item.price,
    sku: null,
  }));

  const userName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.display_name as string | undefined) ??
    user.email ??
    null;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_ref: user.id,
      user_name: userName,
      status: "created",
      items: orderItems,
      total,
      shipping_address: shippingAddress,
      shipping_cost: shippingCost,
    })
    .select("id")
    .single();

  if (error || !order) throw new Error(error?.message ?? "Failed to create order");

  const integrityHash = generateWompiSignature(order.id as string, amountInCents, "COP");

  return { orderId: order.id as string, reference: order.id as string, integrityHash, amountInCents };
}

export async function markOrderPaid(orderId: string) {
  const user = await requireAuth();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: "pending_approval" })
    .eq("id", orderId)
    .eq("user_ref", user.id)
    .eq("status", "created");

  if (error) throw new Error(error.message);
}

export async function cancelOrder(orderId: string) {
  const user = await requireAuth();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("user_ref", user.id)
    .eq("status", "created");

  if (error) throw new Error(error.message);
}
