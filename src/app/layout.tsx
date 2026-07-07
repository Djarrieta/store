import "./globals.css";

import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";

import CartDrawer from "@/app/components/CartDrawer";
import CartIcon from "@/app/components/CartIcon";
import ChatFAB from "@/app/components/ChatFAB";
import ChatMigration from "@/app/components/ChatMigration";
import Logo from "@/app/components/Logo";
import SiteNav from "@/app/components/SiteNav";
import UserMenu from "@/app/components/UserMenu";
import { getUser, isAdmin } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CRISTA — Naturalmente tú",
  description: "Ropa para mujeres que florecen. Simple, natural, femenina.",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const adminStatus = await isAdmin(user?.id);

  const supabasePublic = await createClient();
  let freeShippingAbove: number | null = null;
  {
    const { data } = await supabasePublic
      .from("ships_config")
      .select("free_above_cop")
      .single();
    freeShippingAbove = (data?.free_above_cop as number | null) ?? null;
  }

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
    <html lang="es" className={`${playfair.variable} ${montserrat.variable} antialiased`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <CartProvider isAuthenticated={Boolean(user)} freeShippingAbove={freeShippingAbove}>
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8">
            <header className="relative mb-8 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Logo height={48} priority />
                <div className="flex items-center gap-4">
                  <SiteNav isAuthenticated={Boolean(user)} isAdmin={adminStatus} />
                  <CartIcon />
                  <UserMenu user={user} avatarUrl={profile?.avatar_url ?? null} />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <CartDrawer />
          <ChatFAB />
          <ChatMigration isAuthenticated={Boolean(user)} />
        </CartProvider>
      </body>
    </html>
  );
}
