"use client";

import { useState } from "react";

import Input from "@/app/components/Input";
import { toSlug } from "@/lib/format";


interface Props {
  defaultName?: string;
  defaultSlug?: string;
  namePlaceholder?: string;
}

export default function NameWithSlug({
  defaultName = "",
  defaultSlug = "",
  namePlaceholder = "ej. Talla Ropa",
}: Props) {
  const [slug, setSlug] = useState(defaultSlug || toSlug(defaultName));

  return (
    <>
      <Input
        label="Nombre"
        name="name"
        required
        defaultValue={defaultName}
        placeholder={namePlaceholder}
        onChange={(e) => setSlug(toSlug(e.target.value))}
      />

      <label className="grid gap-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          Slug
          <span className="rounded bg-[var(--fg)]/5 px-1.5 py-0.5 text-xs font-normal text-[var(--fg)]/40">
            auto-generado
          </span>
        </span>
        <Input
          readOnly
          tabIndex={-1}
          value={slug}
          placeholder="se genera desde el nombre…"
          className="cursor-default rounded-md border-dashed border-[var(--border)]/20 bg-[var(--bg)] font-mono text-[var(--fg)]/40 outline-none"
        />
        <input type="hidden" name="slug" value={slug} />
      </label>
    </>
  );
}
