import { createServiceClient } from "@/lib/supabase/service";

/**
 * Returns a short plain-text summary of dynamic store context to inject into the prompt.
 * Highlights: active discounts, low stock, new arrivals.
 */
export async function fetchStoreSnapshot(): Promise<string> {
  const supabase = createServiceClient();

  const { data: onSale } = await supabase
    .from("products")
    .select("title, discount")
    .order("discount", { ascending: false })
    .limit(20);

  const lines: string[] = [];

  if (onSale && onSale.length > 0) {
    const list = onSale.map((p) => `${p.title} (${p.discount}% off)`).join(", ");
    lines.push(`Productos en descuento: ${list}.`);
  }

  return lines.length > 0 ? lines.join("\n") : "Sin novedades destacadas en este momento.";
}
