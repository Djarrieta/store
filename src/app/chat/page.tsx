import { getUser } from "@/lib/auth";

import ChatWidget from "./ChatWidget";

export default async function ChatPage() {
  const user = await getUser();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Asistente</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Pregunta sobre productos, disponibilidad o realiza un pedido.
        </p>
      </div>
      <ChatWidget isAuthenticated={Boolean(user)} />
    </div>
  );
}
