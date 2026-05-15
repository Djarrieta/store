import { createHash } from "crypto";

/**
 * Generates the Wompi integrity signature (SHA-256) server-side.
 * Never call this from client components — it uses WOMPI_INTEGRITY_SECRET.
 *
 * Format: SHA256(reference + amountInCents + currency + integritySecret)
 * https://docs.wompi.co/docs/colombia/widget-checkout-web/#paso-3-genera-una-firma-de-integridad
 */
export function generateWompiSignature(
  reference: string,
  amountInCents: number,
  currency: string,
): string {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error("WOMPI_INTEGRITY_SECRET is not set");

  const payload = `${reference}${amountInCents}${currency}${secret}`;
  return createHash("sha256").update(payload).digest("hex");
}
