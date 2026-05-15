import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getUser, isAdmin } from "@/lib/auth";
import UserMenu from "@/app/components/UserMenu";
import NavLinks from "@/app/components/NavLinks";
import { CartProvider } from "@/lib/cart";
import CartIcon from "@/app/components/CartIcon";
import CartDrawer from "@/app/components/CartDrawer";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Store",
  description: "A full-stack store built with Next.js and Supabase",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const adminStatus = await isAdmin(user?.id);

  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} antialiased`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <CartProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8">
            <header className="mb-8 rounded-2xl border-4 border-black bg-[var(--card)] p-4 shadow-[6px_6px_0_0_#111]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link href="/" className="font-display text-2xl font-bold uppercase tracking-tight">
                    Store
                  </Link>
                  <NavLinks isAuthenticated={Boolean(user)} isAdmin={adminStatus} />
                </div>
                <div className="flex items-center gap-2">
                  <CartIcon />
                  <UserMenu user={user} />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
