// Uploads seed images to Supabase Storage according to supabase/seed/images/manifest.json.
// Idempotent: re-uploads overwrite existing objects (x-upsert: true).
//
// Run independently:    node supabase/seed-storage.js
// Or chained via       npm run db:reset
//
// Uses fetch + the Storage REST API with the service role key, mirroring the
// style of remove-orphans.js (no @supabase/supabase-js dependency).
const { readFileSync, statSync } = require("fs");
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local",
  );
  process.exit(1);
}

const IMAGES_DIR = join(__dirname, "seed/images");
const MANIFEST_PATH = join(IMAGES_DIR, "manifest.json");

async function uploadOne({ src, bucket, path, contentType }) {
  const filePath = join(IMAGES_DIR, src);
  // Throws if missing — fail loudly during db:reset.
  statSync(filePath);
  const buffer = readFileSync(filePath);

  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": contentType ?? "application/octet-stream",
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} → ${res.status} ${text}`);
  }
  console.log(`  ✓ ${bucket}/${path} (${buffer.length} bytes)`);
}

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch (err) {
    console.error(`✗ Could not read manifest at ${MANIFEST_PATH}: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(manifest) || manifest.length === 0) {
    console.log("→ Empty manifest — nothing to upload.");
    return;
  }

  console.log(`→ Uploading ${manifest.length} seed image(s) to Supabase Storage...`);
  for (const entry of manifest) {
    await uploadOne(entry);
  }
  console.log("✓ Seed images uploaded.");
}

main().catch((err) => {
  console.error(`✗ ${err.message ?? err}`);
  process.exit(1);
});
