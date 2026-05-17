"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Ship } from "@/types";

export async function createShip(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("ships").insert({
    department: (formData.get("department") as string).trim(),
    city: (formData.get("city") as string).trim(),
    price_cop: parseFloat(formData.get("price_cop") as string),
    estimated_days: parseInt(formData.get("estimated_days") as string, 10),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/ships");
  redirect("/admin/ships");
}

export async function updateShip(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ships")
    .update({
      department: (formData.get("department") as string).trim(),
      city: (formData.get("city") as string).trim(),
      price_cop: parseFloat(formData.get("price_cop") as string),
      estimated_days: parseInt(formData.get("estimated_days") as string, 10),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/ships");
  redirect("/admin/ships");
}

export async function deleteShip(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("ships").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ships");
}

export async function updateShipsConfig(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const raw = (formData.get("free_above_cop") as string).trim();
  const freeAboveCop = raw === "" ? null : parseFloat(raw);

  const { error } = await supabase
    .from("ships_config")
    .update({ free_above_cop: freeAboveCop })
    .eq("singleton", true);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/ships");
  redirect("/admin/ships");
}

export async function getShips(): Promise<Ship[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ships")
    .select("*")
    .order("department")
    .order("city");

  if (error) throw new Error(error.message);
  return (data as Ship[] | null) ?? [];
}
