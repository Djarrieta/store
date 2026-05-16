"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/types";

export async function getMyAddresses(): Promise<Address[]> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<Address[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAddress(formData: FormData): Promise<Address> {
  const user = await requireAuth();
  const supabase = await createClient();

  const neighborhood = (formData.get("neighborhood") as string | null)?.trim();

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      recipient_name: (formData.get("recipient_name") as string).trim(),
      department: (formData.get("department") as string).trim(),
      city: (formData.get("city") as string).trim(),
      address_line: (formData.get("address_line") as string).trim(),
      neighborhood: neighborhood || null,
      phone: (formData.get("phone") as string).trim(),
      is_default: formData.get("is_default") === "true",
    })
    .select()
    .single<Address>();

  if (error || !data) throw new Error(error?.message ?? "Error al guardar la dirección");
  revalidatePath("/perfil");
  return data;
}

export async function updateAddress(id: string, formData: FormData): Promise<void> {
  const user = await requireAuth();
  const supabase = await createClient();

  const neighborhood = (formData.get("neighborhood") as string | null)?.trim();

  const { error } = await supabase
    .from("addresses")
    .update({
      recipient_name: (formData.get("recipient_name") as string).trim(),
      department: (formData.get("department") as string).trim(),
      city: (formData.get("city") as string).trim(),
      address_line: (formData.get("address_line") as string).trim(),
      neighborhood: neighborhood || null,
      phone: (formData.get("phone") as string).trim(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/perfil");
}

export async function deleteAddress(id: string): Promise<void> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/perfil");
}

export async function setDefaultAddress(id: string): Promise<void> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/perfil");
}
