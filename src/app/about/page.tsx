import { createClient } from "@/lib/supabase/server";

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("content")
    .select("key, value")
    .like("key", "about_paragraph%")
    .order("key");

  const paragraphs = (entries ?? []).map((e) => e.value).filter(Boolean);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border-4 border-black bg-[var(--card)] p-6 shadow-[6px_6px_0_0_#111]">
        <h1 className="font-display text-4xl font-bold tracking-tight">Nosotros</h1>
        {paragraphs.map((text, i) => (
          <p key={i} className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
