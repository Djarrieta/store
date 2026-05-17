"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { OrderItem, OrderStatus } from "@/types";
import type { ShippingAddressSnapshot } from "@/types";

export async function approveOrder(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("approve_order", { p_order_id: id });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function rejectOrder(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending_approval");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function fulfillOrder(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "fulfilled" })
    .eq("id", id)
    .eq("status", "approved");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export interface UpdateOrderData {
  status?: OrderStatus;
  notes?: string | null;
  tracking_code?: string | null;
  shipping_address?: ShippingAddressSnapshot | null;
  shipping_cost?: number;
  items?: OrderItem[];
  total?: number;
}

export async function updateOrder(id: string, data: UpdateOrderData) {
  await requireAdmin();
  const supabase = createServiceClient();

  const patch: Record<string, unknown> = {};
  if (data.status !== undefined) patch.status = data.status;
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.tracking_code !== undefined) patch.tracking_code = data.tracking_code;
  if (data.shipping_address !== undefined) patch.shipping_address = data.shipping_address;
  if (data.shipping_cost !== undefined) patch.shipping_cost = data.shipping_cost;
  if (data.items !== undefined) patch.items = data.items;
  if (data.total !== undefined) patch.total = data.total;

  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}`);
}

export async function updateTrackingCode(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();
  const tracking_code = ((formData.get("tracking_code") as string) ?? "").trim() || null;
  const { error } = await supabase
    .from("orders")
    .update({ tracking_code })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/orders/${id}`);
}
