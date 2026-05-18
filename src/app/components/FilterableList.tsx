"use client";

import { useState } from "react";

import Badge from "@/app/components/Badge";
import Button from "@/app/components/Button";
import { Form } from "@/app/components/FormCard";
import Input from "@/app/components/Input";

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
      <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface)]">
        <Button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
        >
          <span className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center rounded-md border-2 border-[var(--border)] p-1 transition-colors ${hasFilters ? "bg-[var(--accent)]" : "bg-transparent"}`}
            >
              <FunnelIcon active={hasFilters} />
            </span>
            <span>Filtros</span>
            {hasFilters && (
              <Badge variant="primary" size="sm">
                {[q && "búsqueda", tags && "etiquetas"].filter(Boolean).join(" · ")}
              </Badge>
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
          <Form
            className="grid gap-2 border-t-2 border-[var(--border)] p-4 sm:grid-cols-3"
            method="get"
          >
            <Input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar"
              className="sm:col-span-2"
            />
            <Input
              type="text"
              name="tags"
              defaultValue={tags ?? ""}
              placeholder="tag1,tag2"
            />
            <div className="flex gap-2 sm:col-span-3">
              <Button variant="primary" size="md" type="submit" className="flex-1">
                Aplicar filtros
              </Button>
              {hasFilters && (
                <Button href="?" variant="secondary" size="md">
                  Limpiar
                </Button>
              )}
            </div>
          </Form>
        )}
      </div>

      {children}

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              href={buildHref(previousPage)}
              variant="secondary"
              size="sm"
            >
              Anterior
            </Button>
            <Button href={buildHref(nextPage)} variant="secondary" size="sm">
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
