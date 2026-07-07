import Image from "next/image";

import Button from "@/app/components/Button";
import { createClient } from "@/lib/supabase/server";
import type { Content, HomeHero } from "@/types";

function parseHero(value: string | undefined): HomeHero | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<HomeHero>;
    const images = Array.isArray(parsed.images)
      ? parsed.images.filter(
          (img): img is { url: string } =>
            !!img && typeof (img as { url?: unknown }).url === "string",
        )
      : [];
    return {
      title: parsed.title ?? "",
      subtitle: parsed.subtitle ?? "",
      description: parsed.description ?? "",
      cta_label: parsed.cta_label ?? "",
      cta_href: parsed.cta_href ?? "",
      images,
    };
  } catch {
    return null;
  }
}

export default async function Hero() {
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("content")
    .select("*")
    .eq("key", "home_hero")
    .maybeSingle<Content>();

  const hero = parseHero(entry?.value);

  // Render nothing unless there's meaningful content to show.
  if (!hero || (!hero.title.trim() && hero.images.length === 0)) return null;

  const mainImage = hero.images[0];

  const content = (
    <div className="flex max-w-2xl flex-col gap-4">
      {hero.subtitle.trim() && (
        <span
          className={`text-xs font-medium uppercase tracking-[0.28em] ${
            mainImage ? "text-[var(--accent-foreground)]/80" : "text-[var(--accent)]"
          }`}
        >
          {hero.subtitle}
        </span>
      )}
      {hero.title.trim() && (
        <h1
          className={`font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl lg:text-6xl ${
            mainImage ? "text-white" : "text-[var(--fg)]"
          }`}
        >
          {hero.title}
        </h1>
      )}
      {hero.description.trim() && (
        <p
          className={`max-w-prose text-base leading-relaxed ${
            mainImage ? "text-white/85" : "text-[var(--muted)]"
          }`}
        >
          {hero.description}
        </p>
      )}
      {hero.cta_label.trim() && hero.cta_href.trim() && (
        <div className="pt-2">
          <Button href={hero.cta_href} variant="primary" size="xl" shadow>
            {hero.cta_label}
          </Button>
        </div>
      )}
    </div>
  );

  if (!mainImage) {
    return (
      <section className="mb-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-soft)] sm:p-10 lg:p-14">
        {content}
      </section>
    );
  }

  return (
    <section className="relative mb-8 flex min-h-[24rem] items-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] shadow-[var(--shadow-soft)] sm:min-h-[28rem] lg:min-h-[32rem]">
      <Image
        src={mainImage.url}
        alt={hero.title || "Imagen destacada"}
        fill
        unoptimized
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Darkening gradient overlay so the light text stays readable over any image. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/25"
      />
      <div className="relative w-full p-8 sm:p-12 lg:p-16">{content}</div>
    </section>
  );
}
