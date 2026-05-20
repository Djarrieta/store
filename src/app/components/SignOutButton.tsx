"use client";

import { CART_STORAGE_KEY, CHAT_STORAGE_KEY } from "@/lib/constants";

import Button from "./Button";
import { signOut } from "./user-actions";

export default function SignOutButton() {
  async function handleSignOut() {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // ignore — storage may not be available
    }
    await signOut();
  }

  return (
    <Button variant="secondary" size="lg" shadow onClick={handleSignOut}>
      Cerrar sesión
    </Button>
  );
}
