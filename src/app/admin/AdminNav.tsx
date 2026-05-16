"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  categories: "Categories",
  products: "Products",
  items: "Stock",
  content: "Content",
  orders: "Orders",
  new: "New",
  edit: "Edit",
};

const NAV_LINKS = [
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/items", label: "Stock" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/orders", label: "Orders" },
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
              <Link href={crumb.href} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold">{crumb.label}</span>
            )}
            {!isLast && <span className="text-[var(--muted)]">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
