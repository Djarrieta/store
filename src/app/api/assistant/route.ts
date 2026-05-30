import { buildPrompt } from "@/lib/assistant/buildPrompt";
import { addMessage,type ChatChannel } from "@/lib/assistant/chatHistory";
import { generateResponse } from "@/lib/assistant/mcpService";
import { createServiceClient } from "@/lib/supabase/service";

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
      channel?: "whatsapp" | "auth";
    };

    if (!body.message?.trim()) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }
    if (!body.userRef?.trim()) {
      return Response.json({ error: "userRef is required" }, { status: 400 });
    }

    const userRef = body.userRef.trim();
    const message = body.message.trim().slice(0, 2000);
    const channel: ChatChannel = body.channel ?? "whatsapp";

    // Lazy linkage detection: check if this guest has been migrated
    if (channel === "whatsapp") {
      const supabase = createServiceClient();
      const { data: migrationEntry } = await supabase
        .from("chat_migration_log")
        .select("auth_user_id")
        .eq("guest_ref", userRef)
        .single();

      if (migrationEntry) {
        return Response.json({ migrated: true, authUserId: migrationEntry.auth_user_id });
      }
    }

    const prompt = await buildPrompt(message, userRef, [], channel);
    const response = await generateResponse(prompt, channel);

    await addMessage(userRef, message, "user", channel);
    await addMessage(userRef, response, "assistant", channel);

    return Response.json({ response });
  } catch (error) {
    console.error("[/api/assistant]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
