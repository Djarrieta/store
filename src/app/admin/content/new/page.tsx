import { createContent } from "@/app/admin/content/actions";

export default function AdminNewContentPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">New Content</h1>
      <form action={createContent} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="key" className="block text-sm font-semibold">
            Key
          </label>
          <input
            id="key"
            name="key"
            required
            className="w-full rounded-xl border-2 border-black p-3 text-sm shadow-[3px_3px_0_0_#111] focus:outline-none focus:ring-2 focus:ring-black font-mono"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="value" className="block text-sm font-semibold">
            Value
          </label>
          <textarea
            id="value"
            name="value"
            rows={8}
            className="w-full rounded-xl border-2 border-black p-3 text-sm shadow-[3px_3px_0_0_#111] focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl border-2 border-black bg-[var(--accent)] px-5 py-2 text-sm font-bold shadow-[3px_3px_0_0_#111] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            Create
          </button>
          <a
            href="/admin/content"
            className="rounded-xl border-2 border-black bg-white px-5 py-2 text-sm font-bold shadow-[3px_3px_0_0_#111] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            Cancel
          </a>
        </div>
      </form>
    </section>
  );
}
