"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  categories: "Categorías",
  products: "Productos",
  items: "Inventario",
  content: "Contenido",
  orders: "Pedidos",
  new: "Nuevo",
  edit: "Editar",
};

const NAV_LINKS = [
  { href: "/admin/categories", label: "Categorías" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/content", label: "Contenido" },
  { href: "/admin/orders", label: "Pedidos" },
];

function isUUID(segment: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
}

export default function AdminNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Top-level: /admin or /admin/[section]
  const isTopLevel = segments.length <= 2;

  if (isTopLevel) {
    return (
      <nav className="flex gap-2">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border-2 border-black bg-[var(--card)] px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  // Deep page: build breadcrumb, skipping UUIDs
  // Only section-level segments are linkable (admin has no page, slugs/IDs/actions are not)
  const LINKABLE_SEGMENTS = new Set(["categories", "products", "items", "content", "orders"]);

  const crumbs: { label: string; href?: string }[] = [];
  let accPath = "";

  for (const segment of segments) {
    accPath += `/${segment}`;
    if (isUUID(segment)) continue;
    const isLinkable = LINKABLE_SEGMENTS.has(segment);
    crumbs.push({
      label: SEGMENT_LABELS[segment] ?? segment,
      href: isLinkable ? accPath : undefined,
    });
  }

  // Last crumb is current page — no link
  if (crumbs.length > 0) {
    crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label };
  }

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {crumb.href ? (
              <Link href={crumb.href} className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[var(--muted)]">{crumb.label}</span>
            )}
            {!isLast && <span className="text-[var(--muted)]">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
