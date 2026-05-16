import Link from "next/link";

interface NavLinksProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
}

export default function NavLinks({ isAuthenticated, isAdmin }: NavLinksProps) {
  return (
    <nav className="flex items-center gap-2">
      <Link href="/about" className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold">
        Nosotros
      </Link>
      {isAdmin && (
        <Link
          href="/admin/products"
          className="rounded-lg border-2 border-black bg-[var(--card)] px-3 py-1 text-sm font-semibold"
        >
          Admin
        </Link>
      )}
      {!isAuthenticated && (
        <Link
          href="/login"
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-3 py-1 text-sm font-semibold"
        >
          Ingresar
        </Link>
      )}
    </nav>
  );
}
