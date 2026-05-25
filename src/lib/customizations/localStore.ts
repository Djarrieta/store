/**
 * localStorage metadata for in-progress (not-yet-ordered) customizations.
 * Keyed by `localKey` (uuid) so it pairs 1:1 with the IndexedDB source blob.
 *
 * Lifecycle:
 *   1. Customer confirms editor    → `putLocalCustomization()` + put blob to IndexedDB
 *   2. Cart line carries localKey  → preview thumbnail rendered from `previewDataUrl`
 *   3. Re-edit                     → hydrate from this + IndexedDB
 *   4. Order created               → `deleteLocalCustomization()` + delete blob
 */

import type { CustomizationTransform } from "@/types";

import { deleteSource, listKeys } from "./indexedDb";

const LS_PREFIX = "store:customization:";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface LocalCustomization {
  localKey: string;
  itemId: string;
  productId: string;
  kind: { slug: string; label: string };
  templateLabel: string;
  transform: CustomizationTransform;
  sourceWidth: number;
  sourceHeight: number;
  /** Small preview (≤ 1024 px, ≤ 500 KB ideally) used for cart thumbnail. */
  previewDataUrl: string;
  createdAt: number;
}

function keyOf(localKey: string) {
  return `${LS_PREFIX}${localKey}`;
}

export function putLocalCustomization(record: LocalCustomization): void {
  try {
    localStorage.setItem(keyOf(record.localKey), JSON.stringify(record));
  } catch {
    // ignore quota — caller will already have written to IndexedDB
  }
}

export function getLocalCustomization(localKey: string): LocalCustomization | null {
  try {
    const raw = localStorage.getItem(keyOf(localKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalCustomization;
    // Drop legacy records that stored kind as a string union.
    if (typeof parsed.kind === "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function deleteLocalCustomization(localKey: string): void {
  try {
    localStorage.removeItem(keyOf(localKey));
  } catch {
    // ignore
  }
}

export function listLocalKeys(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(LS_PREFIX)) out.push(k.slice(LS_PREFIX.length));
  }
  return out;
}

/**
 * Drop localStorage records older than the TTL and orphan IndexedDB blobs
 * (any key without a matching localStorage record). Best-effort; never throws.
 */
export async function sweepStale(): Promise<void> {
  try {
    const now = Date.now();
    const lsKeys = listLocalKeys();
    const liveLocalKeys = new Set<string>();

    for (const k of lsKeys) {
      const record = getLocalCustomization(k);
      if (!record || now - record.createdAt > TTL_MS) {
        deleteLocalCustomization(k);
        await deleteSource(k).catch(() => {});
      } else {
        liveLocalKeys.add(k);
      }
    }

    const idbKeys = await listKeys();
    for (const k of idbKeys) {
      if (!liveLocalKeys.has(k)) {
        await deleteSource(k).catch(() => {});
      }
    }
  } catch {
    // ignore
  }
}

export function newLocalKey(): string {
  return crypto.randomUUID();
}
