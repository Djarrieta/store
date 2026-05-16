import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <nav className="flex gap-2">
        <Link
          href="/admin/categories"
          className="rounded-lg border-2 border-black bg-[var(--card)] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Categories
        </Link>
        <Link
          href="/admin/products"
          className="rounded-lg border-2 border-black bg-[var(--card)] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Products
        </Link>
        <Link
          href="/admin/items"
          className="rounded-lg border-2 border-black bg-[var(--card)] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Stock
        </Link>
        <Link
          href="/admin/content"
          className="rounded-lg border-2 border-black bg-[var(--card)] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Content
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-lg border-2 border-black bg-[var(--accent)] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Orders
        </Link>
      </nav>
      {children}
    </div>
  );
}

