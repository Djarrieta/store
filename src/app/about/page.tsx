export default function AboutPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border-4 border-black bg-[var(--card)] p-6 shadow-[6px_6px_0_0_#111]">
        <h1 className="font-display text-4xl font-bold tracking-tight">About</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          A community-driven catalog built with Next.js and Supabase.
        </p>
      </div>

      <div className="rounded-2xl border-4 border-black bg-[var(--card)] p-6 shadow-[6px_6px_0_0_#111] space-y-4">
        <h2 className="font-display text-2xl font-bold">What is this?</h2>
        <p className="text-sm leading-relaxed">
          This store is a full-stack application where admins can manage items and users can browse
          the catalog. Items can be searched, filtered by tags, and paginated.
        </p>

        <h2 className="font-display text-2xl font-bold">Tech Stack</h2>
        <ul className="space-y-2 text-sm">
          {[
            ["Next.js 15", "App Router, Server Components, Server Actions"],
            ["Supabase", "Postgres database, Auth, Storage"],
            ["TypeScript", "End-to-end type safety"],
            ["Tailwind CSS", "Utility-first styling"],
          ].map(([tech, desc]) => (
            <li
              key={tech}
              className="flex flex-col gap-0.5 rounded-xl border-2 border-black bg-white p-3 sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="font-semibold">{tech}</span>
              <span className="text-[var(--muted)]">{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
