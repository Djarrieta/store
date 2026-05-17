import { buildPrompt } from "@/lib/assistant/buildPrompt";
import { addMessage } from "@/lib/assistant/chatHistory";
import { generateResponse } from "@/lib/assistant/mcpService";

export async function POST(req: Request): Promise<Response> {
  try {
    // Auth: shared secret for WhatsApp bot callers
    const secret = req.headers.get("x-assistant-secret");
    if (!secret || secret !== process.env.ASSISTANT_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      message?: string;
      userRef?: string;
      name?: string;
    };

    if (!body.message?.trim()) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }
    if (!body.userRef?.trim()) {
      return Response.json({ error: "userRef is required" }, { status: 400 });
    }

    const userRef = body.userRef.trim();
    const message = body.message.trim().slice(0, 2000);

    const prompt = await buildPrompt(message, userRef);

    await addMessage(userRef, message, "user");
    const response = await generateResponse(prompt);
    await addMessage(userRef, response, "assistant");

    return Response.json({ response });
  } catch (error) {
    console.error("[/api/assistant]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
