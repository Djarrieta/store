import Link from "next/link";

interface FilterableListProps {
  q?: string;
  tags?: string;
  mine?: string;
  page: number;
  total: number;
  pageSize: number;
  children: React.ReactNode;
}

export default function FilterableList({
  q,
  tags,
  mine,
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
    if (mine) params.set("mine", mine);
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <form className="grid gap-2 rounded-xl border-2 border-black bg-white p-4 sm:grid-cols-4" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search"
          className="rounded-md border-2 border-black px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          type="text"
          name="tags"
          defaultValue={tags ?? ""}
          placeholder="tag1,tag2"
          className="rounded-md border-2 border-black px-3 py-2 text-sm"
        />
        <label className="flex items-center justify-between rounded-md border-2 border-black px-3 py-2 text-sm">
          My items
          <input type="checkbox" name="mine" value="1" defaultChecked={Boolean(mine)} />
        </label>
        <button
          type="submit"
          className="rounded-md border-2 border-black bg-[var(--accent)] px-3 py-2 text-sm font-semibold sm:col-span-4"
        >
          Apply Filters
        </button>
      </form>

      {children}

      <div className="flex items-center justify-between rounded-xl border-2 border-black bg-white p-3 text-sm">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Link
            href={buildHref(previousPage)}
            className="rounded-md border-2 border-black px-2 py-1 disabled:pointer-events-none"
          >
            Prev
          </Link>
          <Link href={buildHref(nextPage)} className="rounded-md border-2 border-black px-2 py-1">
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
