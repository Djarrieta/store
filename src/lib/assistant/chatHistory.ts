import { HumanMessage } from "@langchain/core/messages";

import { createServiceClient } from "@/lib/supabase/service";

import { DeepSeekLLMProvider } from "./deepseekProvider";

const SUMMARY_THRESHOLD = 10;

export type ChatChannel = "auth" | "web_guest" | "whatsapp";

export type ChatMessage = { role: "user" | "assistant" | "summary"; message: string };

export async function getHistory(userRef: string): Promise<ChatMessage[]> {
  const supabase = createServiceClient();

  // Find latest summary, if any
  const { data: summaryRow } = await supabase
    .from("chat_messages")
    .select("id, created_at, message")
    .eq("user_ref", userRef)
    .eq("role", "summary")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (summaryRow) {
    // Return the summary + all messages after it
    const { data: recent } = await supabase
      .from("chat_messages")
      .select("role, message")
      .eq("user_ref", userRef)
      .neq("role", "summary")
      .gt("created_at", summaryRow.created_at)
      .order("created_at", { ascending: true });

    return [
      { role: "summary" as const, message: summaryRow.message },
      ...(recent ?? []) as ChatMessage[],
    ];
  }

  // No summary — return last messages
  const { data } = await supabase
    .from("chat_messages")
    .select("role, message")
    .eq("user_ref", userRef)
    .neq("role", "summary")
    .order("created_at", { ascending: false })
    .limit(SUMMARY_THRESHOLD);

  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function addMessage(
  userRef: string,
  message: string,
  role: "user" | "assistant",
  channel: ChatChannel = "auth",
) {
  const supabase = createServiceClient();
  await supabase.from("chat_messages").insert({ user_ref: userRef, message, role, channel });
  await summarizeIfNeeded(userRef, channel);
}

export async function migrateChatSession(guestRef: string, authUserId: string): Promise<void> {
  const supabase = createServiceClient();

  // If the authenticated user already has a summary, delete the guest's summary rows
  const { data: existingSummary } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("user_ref", authUserId)
    .eq("role", "summary")
    .limit(1)
    .single();

  if (existingSummary) {
    await supabase
      .from("chat_messages")
      .delete()
      .eq("user_ref", guestRef)
      .eq("role", "summary");
  }

  // Move all guest messages to the authenticated user
  await supabase
    .from("chat_messages")
    .update({ user_ref: authUserId, channel: "auth" })
    .eq("user_ref", guestRef)
    .neq("channel", "auth");

  // Record the mapping for lazy lookups (idempotent)
  await supabase
    .from("chat_migration_log")
    .insert({ guest_ref: guestRef, auth_user_id: authUserId, channel: "web_guest" })
    .single();
}

async function summarizeIfNeeded(userRef: string, channel: ChatChannel): Promise<void> {
  const supabase = createServiceClient();

  // Count messages since the last summary (or all time if none)
  const { data: lastSummary } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("user_ref", userRef)
    .eq("role", "summary")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const query = supabase
    .from("chat_messages")
    .select("role, message", { count: "exact" })
    .eq("user_ref", userRef)
    .neq("role", "summary")
    .order("created_at", { ascending: true });

  const { data: messages, count } = lastSummary
    ? await query.gt("created_at", lastSummary.created_at)
    : await query;

  if (!count || count < SUMMARY_THRESHOLD || !messages) return;

  const transcript = messages
    .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.message}`)
    .join("\n");

  const llm = new DeepSeekLLMProvider().getInstance();
  const summaryPrompt = `Resume la siguiente conversación de soporte de una tienda en línea en máximo 150 palabras. Preserva: productos mencionados, intenciones del usuario, pedidos creados e información clave solicitada. Solo devuelve el resumen, sin encabezados ni explicaciones.\n\n${transcript}`;

  const response = await llm.invoke([new HumanMessage(summaryPrompt)]);
  const summaryText =
    typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  await supabase
    .from("chat_messages")
    .insert({ user_ref: userRef, message: summaryText.trim(), role: "summary", channel });
}

