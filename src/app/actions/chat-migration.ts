"use server";

import { cookies } from "next/headers";

import { WA_REF_COOKIE } from "@/lib/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function setWaRefCookie(waRef: string): Promise<void> {
  if (!waRef || !UUID_RE.test(waRef)) throw new Error("Invalid wa_ref");
  const cookieStore = await cookies();
  cookieStore.set(WA_REF_COOKIE, waRef, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/auth",
  });
}
