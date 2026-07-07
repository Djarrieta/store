import { updateHero } from "@/app/admin/content/actions";
import { createClient } from "@/lib/supabase/server";
import type { Content, HomeHero } from "@/types";

import HeroForm from "./HeroForm";

const EMPTY_HERO: HomeHero = {
  title: "",
  subtitle: "",
  description: "",
  cta_label: "",
  cta_href: "",
  images: [],
};

function parseHero(value: string | undefined): HomeHero {
  if (!value) return EMPTY_HERO;
  try {
    const parsed = JSON.parse(value) as Partial<HomeHero>;
    return {
      title: parsed.title ?? "",
      subtitle: parsed.subtitle ?? "",
      description: parsed.description ?? "",
      cta_label: parsed.cta_label ?? "",
      cta_href: parsed.cta_href ?? "",
      images: Array.isArray(parsed.images)
        ? parsed.images.filter(
            (img): img is { url: string } =>
              !!img && typeof (img as { url?: unknown }).url === "string",
          )
        : [],
    };
  } catch {
    return EMPTY_HERO;
  }
}

export default async function AdminHeroPage() {
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("content")
    .select("*")
    .eq("key", "home_hero")
    .maybeSingle<Content>();

  const hero = parseHero(entry?.value);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Sección principal (Hero)
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Contenido destacado que se muestra en la parte superior de la página de inicio.
          Deja el título y las imágenes vacíos para ocultarla.
        </p>
      </div>
      <HeroForm action={updateHero} defaultValues={hero} />
    </section>
  );
}
