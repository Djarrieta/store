"use server";

import { buildPrompt } from "@/lib/assistant/buildPrompt";
import { addMessage, type ChatChannel, migrateChatSession } from "@/lib/assistant/chatHistory";
import { generateResponse } from "@/lib/assistant/mcpService";
import { getUser, requireAuth } from "@/lib/auth";
import type { CartItem } from "@/lib/cart";
import { createServiceClient } from "@/lib/supabase/service";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function sendMessage(
  message: string,
  cartItems: CartItem[] = [],
  guestId: string | null = null,
): Promise<string> {
  const user = await getUser();
  const trimmed = message.trim().slice(0, 2000);

  if (!trimmed) throw new Error("Message is empty");

  let userRef: string;
  let channel: ChatChannel;

  if (user) {
    userRef = user.id;
    channel = "auth";
  } else if (guestId) {
    if (!UUID_RE.test(guestId)) throw new Error("Invalid guest ID format");
    // Ensure the guestId is NOT an existing auth user (prevents impersonation)
    const supabase = createServiceClient();
    const { data: exists } = await supabase.rpc("user_exists", { p_id: guestId });
    if (exists) throw new Error("Invalid guest ID");
    userRef = guestId;
    channel = "web_guest";
  } else {
    throw new Error("Authentication or guest ID required");
  }

  const prompt = await buildPrompt(trimmed, userRef, cartItems, channel);
  const response = await generateResponse(prompt, channel);

  await addMessage(userRef, trimmed, "user", channel);
  await addMessage(userRef, response, "assistant", channel);

  return response;
}

export async function migrateGuestChat(guestId: string): Promise<void> {
  if (!guestId || !UUID_RE.test(guestId)) return;
  const user = await requireAuth();
  await migrateChatSession(guestId, user.id);
}
