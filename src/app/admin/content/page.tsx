import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/types";
import { deleteContent } from "./actions";
import PageHeader from "@/app/components/PageHeader";

export default async function AdminContentPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("content")
    .select("*")
    .order("key")
    .returns<Content[]>();

  return (
    <PageHeader
      title="Manage Content"
      createHref="/admin/content/new"
      createLabel="New Content"
      isEmpty={false}
    >
      <div className="space-y-3">
        {(entries ?? []).map((entry) => (
          <div
            key={entry.key}
            className="flex items-center justify-between rounded-xl border-2 border-black bg-[var(--card)] p-4 shadow-[3px_3px_0_0_#111]"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold font-mono">{entry.key}</p>
              <p className="mt-1 max-w-xl truncate text-xs text-[var(--muted)]">
                {entry.value || <span className="italic">empty</span>}
              </p>
            </div>
            <div className="ml-4 flex shrink-0 gap-2">
              <Link
                href={`/admin/content/${entry.key}/edit`}
                className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Edit
              </Link>
              <form
                action={async () => {
                  "use server";
                  await deleteContent(entry.key);
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border-2 border-black bg-red-100 px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </PageHeader>
  );
}
