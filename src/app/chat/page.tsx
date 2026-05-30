import { cookies } from "next/headers";

import { getHistory } from "@/lib/assistant/chatHistory";
import { getUser } from "@/lib/auth";
import { GUEST_CHAT_COOKIE } from "@/lib/constants";

import ChatWidget from "./ChatWidget";

export default async function ChatPage() {
  const user = await getUser();
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get(GUEST_CHAT_COOKIE)?.value ?? null;

  let initialMessages: { role: "user" | "assistant"; text: string }[] = [];

  const userRef = user?.id ?? guestCookie;
  if (userRef) {
    const history = await getHistory(userRef);
    initialMessages = history
      .filter((m) => m.role !== "summary")
      .map((m) => ({ role: m.role as "user" | "assistant", text: m.message }));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Asistente</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Pregunta sobre productos, disponibilidad o realiza un pedido.
        </p>
      </div>
      <ChatWidget isAuthenticated={Boolean(user)} initialMessages={initialMessages} />
    </div>
  );
}
