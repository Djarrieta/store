import { createServiceClient } from "@/lib/supabase/service";
import { getHistory, type ChatMessage } from "./chatHistory";
import { fetchStoreSnapshot } from "./contextTopics";
import { ASSISTANT_PROMPT } from "./prompt";
import { formatCurrency } from "@/lib/format";
import type { CartItem } from "@/lib/cart";

const MAX_CART_ITEMS = 50;

export async function buildPrompt(
  userMessage: string,
  userRef: string | null,
  cartItems: CartItem[] = [],
): Promise<string> {
  const supabase = createServiceClient();

  const isGuest = userRef === null;

  const [{ data: pinnedContent }, profileResult, addressesResult, history, contextTopics] =
    await Promise.all([
      supabase.from("content").select("key, value").eq("pinned", true),
      isGuest
        ? Promise.resolve({ data: null })
        : supabase.from("profiles").select("display_name").eq("id", userRef!).single(),
      isGuest
        ? Promise.resolve({ data: null })
        : supabase
            .from("addresses")
            .select("recipient_name, department, city, address_line, neighborhood, phone, is_default")
            .eq("user_id", userRef!)
            .order("is_default", { ascending: false }),
      isGuest ? Promise.resolve([]) : getHistory(userRef!),
      fetchStoreSnapshot(),
    ]);

  const profileData = profileResult.data as { display_name?: string } | null;
  const addressesData = addressesResult.data as Array<{
    recipient_name: string;
    department: string;
    city: string;
    address_line: string;
    neighborhood?: string | null;
    phone: string;
    is_default: boolean;
  }> | null;

  const userInfo = isGuest
    ? "Usuario no autenticado (guest)"
    : profileData?.display_name
      ? `${profileData.display_name} (ID: ${userRef})`
      : `ID: ${userRef}`;

  const userAddresses = isGuest
    ? "El usuario no tiene sesión iniciada."
    : addressesData && addressesData.length > 0
      ? addressesData
          .map((a) => {
            const label = a.is_default ? " [predeterminada]" : "";
            const neighborhood = a.neighborhood ? `, ${a.neighborhood}` : "";
            return `- ${a.recipient_name}${label}: ${a.address_line}${neighborhood}, ${a.city}, ${a.department}. Tel: ${a.phone}`;
          })
          .join("\n")
      : "El usuario no tiene direcciones registradas.";

  const behaviorRow = pinnedContent?.find((c) => c.key === "assistant_behavior");
  const assistantBehavior = behaviorRow?.value ?? "";

  const instructionsRow = pinnedContent?.find((c) => c.key === "assistant_instructions");
  const assistantInstructions = instructionsRow?.value ?? "";

  const SYSTEM_KEYS = new Set(["assistant_behavior", "assistant_instructions"]);

  // Pinned content excluding system entries
  const pinnedContext =
    pinnedContent && pinnedContent.filter((c) => !SYSTEM_KEYS.has(c.key)).length > 0
      ? pinnedContent
          .filter((c) => !SYSTEM_KEYS.has(c.key))
          .map((c) => `${c.key}: ${c.value}`)
          .join("\n")
      : "Sin información fija de la tienda.";

  // Build conversation history block
  const conversationHistory = isGuest ? "Sin historial previo." : buildHistoryBlock(history as import("./chatHistory").ChatMessage[]);

  const guestInstructions = isGuest
    ? `> **USUARIO NO AUTENTICADO**: Puedes responder preguntas sobre productos, categorías, envíos y políticas. Si el usuario quiere comprar, hacer un pedido, ver sus pedidos o necesita datos de su cuenta, indícale que debe iniciar sesión y muéstrale el enlace: [Iniciar sesión](/login). No uses las herramientas \`bot_create_order\`, \`bot_get_my_orders\`, ni \`bot_get_order_status\`.`
    : "";

  const safeCartItems = cartItems.slice(0, MAX_CART_ITEMS);
  let cartSummary: string;
  if (safeCartItems.length === 0) {
    cartSummary = "El carrito está vacío.";
  } else {
    const lines = safeCartItems.map(
      (item) =>
        `- ${item.title} × ${item.quantity} — ${formatCurrency(item.price)} c/u`,
    );
    const subtotal = safeCartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
    cartSummary = lines.join("\n");
  }

  return ASSISTANT_PROMPT
    .replace("{{date}}", new Date().toLocaleDateString("es-CO"))
    .replace("{{userInfo}}", userInfo)
    .replace("{{userAddresses}}", userAddresses)
    .replace("{{assistantBehavior}}", assistantBehavior)
    .replace("{{assistantInstructions}}", assistantInstructions)
    .replace("{{pinnedContent}}", pinnedContext)
    .replace("{{contextTopics}}", contextTopics)
    .replace("{{conversationHistory}}", conversationHistory)
    .replace("{{cartSummary}}", cartSummary)
    .replace("{{guestInstructions}}", guestInstructions)
    .replace("{{userMessage}}", userMessage.trim().slice(0, 2000));
}

function buildHistoryBlock(history: ChatMessage[]): string {
  if (history.length === 0) return "Sin conversación previa.";

  const summaryEntry = history.find((h) => h.role === "summary");
  const recentMessages = history.filter((h) => h.role !== "summary");

  if (summaryEntry) {
    const recentBlock =
      recentMessages.length > 0
        ? recentMessages
            .map((h) => `${h.role === "user" ? "Usuario" : "Asistente"}: ${h.message}`)
            .join("\n")
        : "(sin mensajes recientes)";
    return `[Resumen de conversación previa]\n${summaryEntry.message}\n\n[Mensajes recientes]\n${recentBlock}`;
  }

  return recentMessages
    .map((h) => `${h.role === "user" ? "Usuario" : "Asistente"}: ${h.message}`)
    .join("\n");
}

