"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { sendMessage, migrateGuestChat } from "./actions";
import { useCart } from "@/lib/cart";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import { Form } from "@/app/components/FormCard";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const STORAGE_KEY = "chat_messages";

export default function ChatWidget({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { items: cartItems } = useCart();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Message[]) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMigratedRef = useRef(false);

  // Migrate guest localStorage history to DB on login
  useEffect(() => {
    if (!isAuthenticated || hasMigratedRef.current) return;
    hasMigratedRef.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const msgs = JSON.parse(stored) as Message[];
      if (!msgs.length) return;
      migrateGuestChat(msgs).then(() => {
        localStorage.removeItem(STORAGE_KEY);
      }).catch(() => {/* silent — history stays in localStorage */});
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  useEffect(() => {
    if (!isPending) inputRef.current?.focus();
  }, [isPending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);

    startTransition(async () => {
      try {
        const response = await sendMessage(text, cartItems);
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
            {!isAuthenticated && (
              <span className="block mt-1 text-xs">
                <a href="/login" className="underline font-medium">Inicia sesión</a> para guardar tu historial y hacer pedidos.
              </span>
            )}
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
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                msg.text
              )}
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
      <Form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={isPending}
          fullWidth={false}
          className="flex-1"
        />
        <Button
          variant="primary"
          size="lg"
          shadow
          type="submit"
          disabled={isPending || !input.trim()}
        >
          Enviar
        </Button>
      </Form>
    </div>
  );
}
