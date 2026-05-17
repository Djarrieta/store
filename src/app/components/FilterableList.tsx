"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/app/components/Button";

interface FilterableListProps {
  q?: string;
  tags?: string;
  page: number;
  total: number;
  pageSize: number;
  children: React.ReactNode;
}

function FunnelIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z" />
    </svg>
  );
}

export default function FilterableList({
  q,
  tags,
  page,
  total,
  pageSize,
  children,
}: FilterableListProps) {
  const hasFilters = Boolean(q || tags);
  const [open, setOpen] = useState(hasFilters);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tags) params.set("tags", tags);
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Filter toggle bar */}
      <div className="rounded-xl border-2 border-black bg-white">
        <Button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
        >
          <span className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center rounded-md border-2 border-black p-1 transition-colors ${hasFilters ? "bg-[var(--accent)]" : "bg-transparent"}`}
            >
              <FunnelIcon active={hasFilters} />
            </span>
            <span>Filtros</span>
            {hasFilters && (
              <span className="rounded-full border-2 border-black bg-[var(--accent)] px-2 py-0.5 text-xs font-bold leading-none">
                {[q && "búsqueda", tags && "etiquetas"].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Button>

        {open && (
          <form
            className="grid gap-2 border-t-2 border-black p-4 sm:grid-cols-3"
            method="get"
          >
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar"
              className="rounded-md border-2 border-black px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              type="text"
              name="tags"
              defaultValue={tags ?? ""}
              placeholder="tag1,tag2"
              className="rounded-md border-2 border-black px-3 py-2 text-sm"
            />
            <div className="flex gap-2 sm:col-span-3">
              <Button variant="primary" size="md" type="submit" className="flex-1">
                Aplicar filtros
              </Button>
              {hasFilters && (
                <Link
                  href="?"
                  className="rounded-md border-2 border-black px-3 py-2 text-sm font-semibold hover:bg-gray-100"
                >
                  Limpiar
                </Link>
              )}
            </div>
          </form>
        )}
      </div>

      {children}

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border-2 border-black bg-white p-3 text-sm">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={buildHref(previousPage)}
              className="rounded-md border-2 border-black px-2 py-1 disabled:pointer-events-none"
            >
              Anterior
            </Link>
            <Link href={buildHref(nextPage)} className="rounded-md border-2 border-black px-2 py-1">
              Siguiente
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
