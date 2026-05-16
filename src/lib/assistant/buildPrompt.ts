import { createServiceClient } from "@/lib/supabase/service";
import { getHistory } from "./chatHistory";
import { fetchContextTopics } from "./contextTopics";
import { ASSISTANT_PROMPT } from "./prompt";

export async function buildPrompt(userMessage: string, userRef: string): Promise<string> {
  const supabase = createServiceClient();

  const [{ data: contentRows }, { data: products }, history, contextTopics] =
    await Promise.all([
      supabase.from("content").select("key, value"),
      supabase
        .from("products")
        .select("title, price, discount, tags, category:category_id(name), items(stock)")
        .limit(100),
      getHistory(userRef),
      fetchContextTopics(),
    ]);

  // Store content
  const storeContent =
    contentRows && contentRows.length > 0
      ? contentRows.map((c) => `${c.key}: ${c.value}`).join("\n")
      : "Sin información de la tienda disponible.";

  // Product catalog — compact one-liner per product
  const productCatalog =
    products && products.length > 0
      ? products
          .map((p) => {
            const cat =
              p.category && typeof p.category === "object" && "name" in p.category
                ? (p.category as { name: string }).name
                : "Sin categoría";
            const stockItems = Array.isArray(p.items) ? p.items : [];
            const totalStock = stockItems.reduce(
              (sum: number, it: { stock: number }) => sum + (it.stock ?? 0),
              0,
            );
            const discountStr = p.discount > 0 ? ` | Descuento: ${p.discount}%` : "";
            const tagsStr =
              p.tags && p.tags.length > 0 ? ` | Tags: ${p.tags.join(", ")}` : "";
            return `- ${p.title} | Categoría: ${cat} | Precio: $${p.price}${discountStr} | Stock: ${totalStock}${tagsStr}`;
          })
          .join("\n")
      : "Sin productos disponibles.";

  // Conversation history
  const conversationHistory =
    history.length > 0
      ? history
          .map((h) => `${h.role === "user" ? "Usuario" : "Asistente"}: ${h.message}`)
          .join("\n")
      : "Sin conversación previa.";

  return ASSISTANT_PROMPT
    .replace("{{date}}", new Date().toLocaleDateString("es-CO"))
    .replace("{{storeContent}}", storeContent)
    .replace("{{productCatalog}}", productCatalog)
    .replace("{{contextTopics}}", contextTopics)
    .replace("{{conversationHistory}}", conversationHistory)
    .replace("{{userMessage}}", userMessage.trim().slice(0, 2000));
}
