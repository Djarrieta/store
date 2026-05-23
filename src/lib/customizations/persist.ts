"use client";

import { createCustomization } from "@/app/actions/customizations";
import type { CartItem } from "@/lib/cart";

import { deleteSource, getSource } from "./indexedDb";
import { deleteLocalCustomization, getLocalCustomization } from "./localStore";

/**
 * Upload every customized cart line (those with `customizationLocalKey`),
 * returning a new array where the local key has been replaced by the
 * server-issued `OrderCustomizationSnapshot`. Throws on the first failure.
 *
 * Caller (BuyNowButton) is responsible for calling `cleanupPersistedLocals`
 * after the order has been successfully created.
 */
export async function persistPendingCustomizations(
  items: CartItem[],
): Promise<CartItem[]> {
  const out: CartItem[] = [];
  for (const item of items) {
    if (!item.customizationLocalKey) {
      out.push(item);
      continue;
    }
    const localKey = item.customizationLocalKey;
    const record = getLocalCustomization(localKey);
    const blob = await getSource(localKey);
    if (!record || !blob) {
      throw new Error(
        `No se encontró la personalización guardada para "${item.title}". Vuelve a editarla.`,
      );
    }
    const previewBlob = dataUrlToBlob(record.previewDataUrl);

    const fd = new FormData();
    fd.set("itemId", item.itemId);
    fd.set("transform", JSON.stringify(record.transform));
    fd.set("sourceWidth", String(record.sourceWidth));
    fd.set("sourceHeight", String(record.sourceHeight));
    fd.set("source", blob, sourceFilename(blob));
    fd.set("preview", previewBlob, "preview.png");

    const snapshot = await createCustomization(fd);
    out.push({ ...item, customization: snapshot });
  }
  return out;
}

/** Drop the IndexedDB blob + localStorage record for every persisted line. */
export async function cleanupPersistedLocals(items: CartItem[]): Promise<void> {
  for (const item of items) {
    if (!item.customizationLocalKey) continue;
    try {
      await deleteSource(item.customizationLocalKey);
    } catch {
      // ignore
    }
    deleteLocalCustomization(item.customizationLocalKey);
  }
}

function sourceFilename(blob: Blob): string {
  if (blob instanceof File && blob.name) return blob.name;
  const ext = (blob.type.split("/")[1] ?? "bin").split("+")[0];
  return `source.${ext}`;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)(?:;base64)?,(.*)$/i.exec(dataUrl);
  if (!match) throw new Error("preview inválido");
  const mime = match[1];
  const isBase64 = /;base64/i.test(dataUrl);
  const data = match[2];
  if (isBase64) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(data)], { type: mime });
}
