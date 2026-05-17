import "./globals.css";

import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Link from "next/link";

import CartDrawer from "@/app/components/CartDrawer";
import CartIcon from "@/app/components/CartIcon";
import ChatFAB from "@/app/components/ChatFAB";
import NavLinks from "@/app/components/NavLinks";
import UserMenu from "@/app/components/UserMenu";
import { getUser, isAdmin } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tienda",
  description: "Una tienda completa construida con Next.js y Supabase",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const adminStatus = await isAdmin(user?.id);

  let profile: Profile | null = null;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Profile>();
    profile = data;
  }

  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable} antialiased`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <CartProvider isAuthenticated={Boolean(user)}>
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8">
            <header className="mb-8 rounded-2xl border-4 border-black bg-[var(--card)] p-4 shadow-[6px_6px_0_0_#111]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link href="/" className="font-display text-2xl font-bold uppercase tracking-tight">
                    Tienda
                  </Link>
                  <NavLinks isAuthenticated={Boolean(user)} isAdmin={adminStatus} />
                </div>
                <div className="flex items-center gap-2">
                  <CartIcon />
                  <UserMenu user={user} avatarUrl={profile?.avatar_url ?? null} />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <CartDrawer />
          <ChatFAB />
        </CartProvider>
      </body>
    </html>
  );
}
