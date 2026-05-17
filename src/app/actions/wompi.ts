"use server";

import { randomUUID } from "crypto";

import { generateWompiSignature } from "@/lib/wompi";

export async function createWompiCheckout(amountInCents: number): Promise<{
  reference: string;
  integrityHash: string;
}> {
  const reference = randomUUID();
  const integrityHash = generateWompiSignature(reference, amountInCents, "COP");
  return { reference, integrityHash };
}
