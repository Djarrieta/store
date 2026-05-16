import { createServiceClient } from "@/lib/supabase/service";
import { getHistory, type ChatMessage } from "./chatHistory";
import { fetchContextTopics } from "./contextTopics";
import { ASSISTANT_PROMPT } from "./prompt";

export async function buildPrompt(userMessage: string, userRef: string): Promise<string> {
  const supabase = createServiceClient();

  const [{ data: pinnedContent }, history, contextTopics] = await Promise.all([
    supabase.from("content").select("key, value").eq("pinned", true),
    getHistory(userRef),
    fetchContextTopics(),
  ]);

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
  const conversationHistory = buildHistoryBlock(history);

  return ASSISTANT_PROMPT
    .replace("{{date}}", new Date().toLocaleDateString("es-CO"))
    .replace("{{userRef}}", userRef)
    .replace("{{assistantBehavior}}", assistantBehavior)
    .replace("{{assistantInstructions}}", assistantInstructions)
    .replace("{{pinnedContent}}", pinnedContext)
    .replace("{{contextTopics}}", contextTopics)
    .replace("{{conversationHistory}}", conversationHistory)
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

