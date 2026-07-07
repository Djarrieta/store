export interface Content {
  key: string;
  value: string;
  pinned: boolean;
  updated_at: string;
}

/** Shape stored (as JSON) under the `home_hero` content key. */
export interface HomeHero {
  title: string;
  subtitle: string;
  description: string;
  cta_label: string;
  cta_href: string;
  images: { url: string }[];
}
