"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ChatFAB() {
  const pathname = usePathname();
  const show =
    pathname === "/" ||
    pathname === "/about" ||
    pathname.startsWith("/products/") ||
    pathname.startsWith("/perfil");
  if (!show) return null;

  return (
    <Link
      href="/chat"
      title="Asistente"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-3 border-black bg-[var(--accent)] shadow-[4px_4px_0_0_#111] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </Link>
  );
}
