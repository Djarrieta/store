// Removes objects from the `item-images` storage bucket that are not
// referenced by any row in `products.images` or `items.images`.
//
// Run independently:    npm run db:remove-orphans
// Or chained after a db:reset (see package.json scripts).
//
// Uses fetch against the PostgREST and Storage REST APIs to avoid pulling
// in @supabase/supabase-js (which requires WebSocket support on Node < 22).
const { readFileSync } = require("fs");
const { join } = require("path");

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "../.env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local not found — rely on shell environment
  }
}

loadEnvLocal();

const BUCKET = "item-images";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local",
  );
  process.exit(1);
}

const baseHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function http(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { ...baseHeaders, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${init.method ?? "GET"} ${url} → ${res.status} ${text}`);
  }
  return res.json();
}

function extractPath(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function collectReferencedPaths() {
  const referenced = new Set();

  for (const table of ["products"]) {
    const rows = await http(`${SUPABASE_URL}/rest/v1/${table}?select=images`);
    for (const row of rows) {
      const images = Array.isArray(row.images) ? row.images : [];
      for (const img of images) {
        if (!img || typeof img.url !== "string") continue;
        const path = extractPath(img.url);
        if (path) referenced.add(path);
      }
    }
  }

  return referenced;
}

async function listPrefix(prefix) {
  // Storage REST: POST /storage/v1/object/list/{bucket}
  // Returns only direct children of `prefix` (files + folder placeholders).
  const items = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const page = await http(
      `${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix,
          limit: pageSize,
          offset,
          sortBy: { column: "name", order: "asc" },
        }),
      },
    );
    if (!Array.isArray(page) || page.length === 0) break;
    items.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return items;
}

async function listAllObjects() {
  // Recursively walk the bucket so files under subfolders (e.g. seed/...)
  // are visible and can be matched against referenced URLs.
  const all = [];
  const queue = [""];
  while (queue.length > 0) {
    const prefix = queue.shift();
    const items = await listPrefix(prefix);
    for (const obj of items) {
      if (!obj || typeof obj.name !== "string") continue;
      const fullPath = prefix ? `${prefix}/${obj.name}` : obj.name;
      // Folder placeholders have id === null → recurse into them.
      if (obj.id === null || obj.id === undefined) {
        queue.push(fullPath);
        continue;
      }
      all.push(fullPath);
    }
  }
  return all;
}

async function removeObjects(paths) {
  // Storage REST: DELETE /storage/v1/object/{bucket} with { prefixes: [...] }
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { ...baseHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE failed → ${res.status} ${text}`);
  }
}

async function main() {
  console.log(`→ Scanning bucket "${BUCKET}" for orphan objects...`);

  const [referenced, objects] = await Promise.all([
    collectReferencedPaths(),
    listAllObjects(),
  ]);

  const orphans = objects.filter((name) => !referenced.has(name));

  console.log(
    `  ${objects.length} object(s) in bucket · ${referenced.size} referenced · ${orphans.length} orphan(s)`,
  );

  if (orphans.length === 0) {
    console.log("✓ No orphans to remove.");
    return;
  }

  const chunkSize = 100;
  let removed = 0;
  for (let i = 0; i < orphans.length; i += chunkSize) {
    const chunk = orphans.slice(i, i + chunkSize);
    await removeObjects(chunk);
    removed += chunk.length;
  }

  console.log(`✓ Removed ${removed} orphan object(s).`);
}

main().catch((err) => {
  console.error(`✗ ${err.message ?? err}`);
  process.exit(1);
});
