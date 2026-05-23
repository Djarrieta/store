import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { OrderCustomizationSnapshot } from "@/types";

/**
 * Render the final print-ready PNG for a single order line and upload it to
 * `customizations-print`. Uses the SNAPSHOT (decision #17) so it works even
 * if the original item/template/customizations rows are later deleted.
 *
 * Returns the storage object path.
 */
export async function renderPrintFile(
  snapshot: OrderCustomizationSnapshot,
  orderId: string,
  lineIndex: number,
): Promise<string> {
  // Lazy-load: @napi-rs/canvas resolves a native binding at require time.
  // Importing at module top would crash any page that transitively imports
  // this file (e.g. admin/orders/[id]) when the binding is missing.
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");

  const supabase = createServiceClient();
  const { template, transform } = snapshot;

  const targetW = Math.round((template.width_mm / 25.4) * template.print_dpi);
  const targetH = Math.round((template.height_mm / 25.4) * template.print_dpi);

  // Download source from private bucket via signed URL.
  const sourceUrl = await signFor(
    supabase,
    "customizations-source",
    snapshot.source_image_path,
  );
  const sourceBuf = await fetchBuffer(sourceUrl);
  const img = await loadImage(sourceBuf);

  const canvas = createCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");

  const drawnW = transform.scale * targetW;
  const drawnH = (img.height / img.width) * drawnW;

  ctx.save();
  ctx.translate(transform.x * targetW, transform.y * targetH);
  ctx.rotate(transform.rotation); // around top-left, decision #6
  ctx.drawImage(img, 0, 0, drawnW, drawnH);
  ctx.restore();

  if (template.mask_path) {
    const maskUrl = await signFor(
      supabase,
      "print-templates",
      template.mask_path,
    );
    const maskBuf = await fetchBuffer(maskUrl);
    const mask = await loadImage(maskBuf);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0, targetW, targetH);
  }

  const pngBuffer = await canvas.encode("png");
  const path = `${orderId}/${lineIndex}.png`;

  const { error } = await supabase.storage
    .from("customizations-print")
    .upload(path, pngBuffer, {
      contentType: "image/png",
      upsert: true,
    });
  if (error) throw new Error(error.message);
  return path;
}

async function signFor(
  supabase: ReturnType<typeof createServiceClient>,
  bucket: string,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 10);
  if (error) throw new Error(`Signing ${bucket}/${path}: ${error.message}`);
  return data.signedUrl;
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
