import Link from "next/link";

interface NavLinksProps {
  isAuthenticated: boolean;
}

export default function NavLinks({ isAuthenticated }: NavLinksProps) {
  return (
    <nav className="flex items-center gap-2">
      <Link href="/" className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold">
        Home
      </Link>
      <Link
        href="/items"
        className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold"
      >
        Items
      </Link>
      {!isAuthenticated && (
        <Link
          href="/login"
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-3 py-1 text-sm font-semibold"
        >
          Login
        </Link>
      )}
    </nav>
  );
}
