"use client";

import { useMemo, useState } from "react";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import type { Item, ItemImage } from "@/types";

interface ItemFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<Item>;
}

export default function ItemForm({ action, defaultValues }: ItemFormProps) {
  const [imagesText, setImagesText] = useState(
    (defaultValues?.images ?? []).map((img) => img.url).join("\n"),
  );

  const serializedImages = useMemo(() => {
    const images: ItemImage[] = imagesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ url }));
    return JSON.stringify(images);
  }, [imagesText]);

  return (
    <form action={action} className="space-y-4 rounded-xl border-2 border-black bg-white p-5">
      <label className="grid gap-1 text-sm font-medium">
        Title
        <input
          name="title"
          maxLength={MAX_TITLE_LENGTH}
          required
          defaultValue={defaultValues?.title ?? ""}
          className="rounded-md border-2 border-black px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Description
        <textarea
          name="description"
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={5}
          defaultValue={defaultValues?.description ?? ""}
          className="rounded-md border-2 border-black px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Price
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultValues?.price ?? 0}
            className="rounded-md border-2 border-black px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Category
          <input
            name="category"
            required
            defaultValue={defaultValues?.category ?? ""}
            className="rounded-md border-2 border-black px-3 py-2"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        Tags (comma-separated)
        <input
          name="tags"
          defaultValue={(defaultValues?.tags ?? []).join(",")}
          className="rounded-md border-2 border-black px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Image URLs (one per line)
        <textarea
          value={imagesText}
          onChange={(event) => setImagesText(event.target.value)}
          rows={4}
          className="rounded-md border-2 border-black px-3 py-2"
        />
      </label>

      <input type="hidden" name="images" value={serializedImages} />

      <button
        type="submit"
        className="rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold"
      >
        {defaultValues ? "Update Item" : "Create Item"}
      </button>
    </form>
  );
}
