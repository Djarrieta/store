"use client";

import { useEffect, useRef } from "react";

import { GUEST_CHAT_COOKIE } from "@/lib/constants";

import { migrateGuestChat } from "../chat/actions";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export default function ChatMigration({ isAuthenticated }: { isAuthenticated: boolean }) {
  const hasMigratedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasMigratedRef.current) return;
    hasMigratedRef.current = true;
    const guestId = getCookie(GUEST_CHAT_COOKIE);
    if (!guestId) return;
    migrateGuestChat(guestId)
      .then(() => deleteCookie(GUEST_CHAT_COOKIE))
      .catch(() => {/* retry on next page load */});
  }, [isAuthenticated]);

  return null;
}
