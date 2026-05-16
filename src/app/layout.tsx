import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getUser, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/app/components/UserMenu";
import NavLinks from "@/app/components/NavLinks";
import { CartProvider } from "@/lib/cart";
import CartIcon from "@/app/components/CartIcon";
import CartDrawer from "@/app/components/CartDrawer";
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
        <CartProvider>
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
          {user && (
            <Link
              href="/chat"
              title="Asistente"
              className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-3 border-black bg-[var(--accent)] shadow-[4px_4px_0_0_#111] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </Link>
          )}
        </CartProvider>
      </body>
    </html>
  );
}
