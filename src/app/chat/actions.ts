"use server";

import { requireAuth } from "@/lib/auth";
import { buildPrompt } from "@/lib/assistant/buildPrompt";
import { generateResponse } from "@/lib/assistant/mcpService";
import { addMessage } from "@/lib/assistant/chatHistory";

export async function sendMessage(message: string): Promise<string> {
  const user = await requireAuth();
  const userRef = user.id;
  const trimmed = message.trim().slice(0, 2000);

  if (!trimmed) throw new Error("Message is empty");

  const prompt = await buildPrompt(trimmed, userRef);

  await addMessage(userRef, trimmed, "user");
  const response = await generateResponse(prompt);
  await addMessage(userRef, response, "assistant");

  return response;
}
