"use client";

import { useState } from "react";
import { toSlug } from "@/lib/format";
import Input from "@/app/components/Input";

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
      <label className="grid gap-1 text-sm font-medium">
        Nombre
        <Input
          name="name"
          required
          defaultValue={defaultName}
          placeholder={namePlaceholder}
          onChange={(e) => setSlug(toSlug(e.target.value))}
        />
      </label>

      <div className="grid gap-1 text-sm font-medium">
        <span className="flex items-center gap-2">
          Slug
          <span className="rounded bg-black/5 px-1.5 py-0.5 text-xs font-normal text-black/40">
            auto-generado
          </span>
        </span>
        <input
          readOnly
          tabIndex={-1}
          value={slug}
          placeholder="se genera desde el nombre…"
          className="w-full cursor-default rounded-md border-2 border-dashed border-black/20 bg-gray-50 px-3 py-2 font-mono text-sm text-black/40 outline-none"
        />
        <input type="hidden" name="slug" value={slug} />
      </div>
    </>
  );
}
