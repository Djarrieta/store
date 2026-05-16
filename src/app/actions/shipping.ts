"use server";

import { createClient } from "@/lib/supabase/server";
import type { Ship, ShipsConfig } from "@/types";

export type ShippingResult = {
  cost: number;
  estimated_days: number | null;
  isFree: boolean;
  isUnknownCity: boolean;
};

export async function getShippingCost(
  city: string,
  department: string,
  subtotal: number,
): Promise<ShippingResult> {
  const supabase = await createClient();

  const cityNorm = city.toLowerCase().trim();
  const deptNorm = department.toLowerCase().trim();

  const [{ data: ship }, { data: config }] = await Promise.all([
    supabase
      .from("ships")
      .select("price_cop, estimated_days")
      .ilike("city_search", cityNorm)
      .ilike("department_search", deptNorm)
      .limit(1)
      .maybeSingle<Pick<Ship, "price_cop" | "estimated_days">>(),
    supabase
      .from("ships_config")
      .select("free_above_cop")
      .eq("singleton", true)
      .single<Pick<ShipsConfig, "free_above_cop">>(),
  ]);

  if (!ship) {
    return { cost: 0, estimated_days: null, isFree: false, isUnknownCity: true };
  }

  const freeAbove = config?.free_above_cop ?? null;
  const isFree = freeAbove !== null && subtotal >= freeAbove;

  return {
    cost: isFree ? 0 : ship.price_cop,
    estimated_days: ship.estimated_days,
    isFree,
    isUnknownCity: false,
  };
}
