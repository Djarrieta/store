import { createServiceClient } from "@/lib/supabase/service";

export async function getHistory(userRef: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("role, message")
    .eq("user_ref", userRef)
    .order("created_at", { ascending: true })
    .limit(20);
  return data ?? [];
}

export async function addMessage(
  userRef: string,
  message: string,
  role: "user" | "assistant",
) {
  const supabase = createServiceClient();
  await supabase.from("chat_messages").insert({ user_ref: userRef, message, role });
}
