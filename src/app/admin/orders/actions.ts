"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

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
