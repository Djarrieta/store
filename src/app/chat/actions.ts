"use server";

import { buildPrompt } from "@/lib/assistant/buildPrompt";
import { addMessage } from "@/lib/assistant/chatHistory";
import { generateResponse } from "@/lib/assistant/mcpService";
import { getUser,requireAuth } from "@/lib/auth";
import type { CartItem } from "@/lib/cart";

export async function sendMessage(message: string, cartItems: CartItem[] = []): Promise<string> {
  const user = await getUser();
  const userRef = user?.id ?? null;
  const trimmed = message.trim().slice(0, 2000);

  if (!trimmed) throw new Error("Message is empty");

  const prompt = await buildPrompt(trimmed, userRef, cartItems);
  const response = await generateResponse(prompt, userRef);

  if (userRef) {
    await addMessage(userRef, trimmed, "user");
    await addMessage(userRef, response, "assistant");
  }

  return response;
}

export async function migrateGuestChat(
  messages: { role: "user" | "assistant"; text: string }[],
): Promise<void> {
  if (!messages.length) return;
  const user = await requireAuth();

  for (const msg of messages) {
    await addMessage(user.id, msg.text, msg.role);
  }
}
