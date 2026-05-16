import { createServiceClient } from "@/lib/supabase/service";

/**
 * Returns a short plain-text summary of dynamic store context to inject into the prompt.
 * Highlights: active discounts, low stock, new arrivals.
 */
export async function fetchContextTopics(): Promise<string> {
  const supabase = createServiceClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: onSale }, { data: newArrivals }] = await Promise.all([
    supabase
      .from("products")
      .select("title, discount")
      .gt("discount", 0)
      .order("discount", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("title")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const lines: string[] = [];

  if (onSale && onSale.length > 0) {
    const list = onSale.map((p) => `${p.title} (${p.discount}% off)`).join(", ");
    lines.push(`Productos en descuento: ${list}.`);
  }

  if (newArrivals && newArrivals.length > 0) {
    const list = newArrivals.map((p) => p.title).join(", ");
    lines.push(`Nuevos productos esta semana: ${list}.`);
  }

  return lines.length > 0 ? lines.join("\n") : "Sin novedades destacadas en este momento.";
}
