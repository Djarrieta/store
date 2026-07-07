"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SiteNavProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
}

export default function SiteNav({ isAuthenticated, isAdmin }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile accordion whenever the route changes. Adjusting state
  // during render (instead of in an effect) is the recommended React pattern.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const links: { href: string; label: string }[] = [
    { href: "/", label: "Inicio" },
    { href: "/about", label: "Nosotros" },
    ...(isAdmin ? [{ href: "/admin/products", label: "Admin" }] : []),
    ...(!isAuthenticated ? [{ href: "/login", label: "Ingresar" }] : []),
  ];

  const linkClass = (href: string) =>
    clsx(
      "text-xs uppercase tracking-[0.18em] transition-colors",
      pathname === href
        ? "text-[var(--accent)]"
        : "text-[var(--muted)] hover:text-[var(--accent)]",
    );

  return (
    <>
      {/* Desktop inline nav */}
      <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={linkClass(l.href)}>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger toggle */}
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="site-mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn-icon)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] transition-colors hover:border-[var(--accent)] md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile accordion panel */}
      <div
        id="site-mobile-nav"
        className={clsx(
          "absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-all duration-300 md:hidden",
          open ? "max-h-96 opacity-100" : "pointer-events-none max-h-0 opacity-0",
        )}
      >
        <nav aria-label="Menú móvil" className="flex flex-col divide-y divide-[var(--border)]">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "px-5 py-3 text-sm uppercase tracking-[0.14em] transition-colors",
                pathname === l.href
                  ? "text-[var(--accent)]"
                  : "text-[var(--fg)] hover:bg-[var(--card)] hover:text-[var(--accent)]",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
