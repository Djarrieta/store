import Link from "next/link";

interface FilterableListProps {
  q?: string;
  tags?: string;
  page: number;
  total: number;
  pageSize: number;
  children: React.ReactNode;
}

export default function FilterableList({
  q,
  tags,
  page,
  total,
  pageSize,
  children,
}: FilterableListProps) {
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
      <form className="grid gap-2 rounded-xl border-2 border-black bg-white p-4 sm:grid-cols-3" method="get">
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
        <button
          type="submit"
          className="rounded-md border-2 border-black bg-[var(--accent)] px-3 py-2 text-sm font-semibold sm:col-span-3"
        >
          Aplicar filtros
        </button>
      </form>

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
