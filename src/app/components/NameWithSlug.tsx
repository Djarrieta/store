"use client";

import { useState } from "react";

import { FormField } from "@/app/components/FormCard";
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
      <FormField label="Nombre">
        <Input
          name="name"
          required
          defaultValue={defaultName}
          placeholder={namePlaceholder}
          onChange={(e) => setSlug(toSlug(e.target.value))}
        />
      </FormField>

      <FormField
        label={
          <span className="flex items-center gap-2">
            Slug
            <span className="rounded bg-black/5 px-1.5 py-0.5 text-xs font-normal text-black/40">
              auto-generado
            </span>
          </span>
        }
      >
        <Input
          readOnly
          tabIndex={-1}
          value={slug}
          placeholder="se genera desde el nombre…"
          className="cursor-default rounded-md border-dashed border-black/20 bg-gray-50 font-mono text-black/40 outline-none"
        />
        <input type="hidden" name="slug" value={slug} />
      </FormField>
    </>
  );
}
