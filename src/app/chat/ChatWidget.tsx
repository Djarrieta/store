"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { sendMessage } from "./actions";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const STORAGE_KEY = "chat_messages";

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored) as Message[]);
    } catch {}
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);

    startTransition(async () => {
      try {
        const response = await sendMessage(text);
        setMessages((prev) => [...prev, { role: "assistant", text: response }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Lo siento, ocurrió un error. Inténtalo de nuevo." },
        ]);
      }
    });
  }

  return (
    <div className="flex flex-col h-[70vh] max-w-2xl mx-auto">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-xl border-2 border-black bg-[var(--card)] shadow-[3px_3px_0_0_#111]">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[var(--muted)] mt-8">
            Hola 👋 Pregúntame sobre productos, precios o realiza un pedido.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl border-2 border-black px-4 py-2 text-sm shadow-[2px_2px_0_0_#111] ${
                msg.role === "user"
                  ? "bg-[var(--accent)] font-medium"
                  : "bg-white"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex justify-start">
            <div className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm shadow-[2px_2px_0_0_#111] text-[var(--muted)]">
              Escribiendo…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={isPending}
          className="flex-1 rounded-lg border-2 border-black bg-[var(--card)] px-4 py-2 text-sm font-medium shadow-[2px_2px_0_0_#111] placeholder:text-[var(--muted)] focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-5 py-2 text-sm font-bold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
