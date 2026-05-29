// Runs all migrations then all seed files in sort order against the linked project.
// Add new .sql files to supabase/migrations/ or supabase/seed/ — no other changes needed.
const { execSync } = require("child_process");
const { readdirSync, readFileSync } = require("fs");
const { join } = require("path");

// Load .env.local so env vars are available without requiring a separate shell export
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

const runDir = (dir) => {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const path = join(dir, file);
    console.log(`→ ${path}`);
    execSync(`npx supabase db query --linked -f "${path}"`, {
      stdio: "inherit",
    });
  }
};

loadEnvLocal();
runDir("supabase/migrations");

// Create (or refresh) a local dev user for email+password sign-in from the UI.
// Must run BEFORE seeds so that seed data referencing the dev user's UUID succeeds.
console.log("→ Running supabase/seed-dev-user.js...");
execSync("node supabase/seed-dev-user.js", { stdio: "inherit" });

runDir("supabase/seed");

// Upload binary seed assets (mockups, gallery images) to Supabase Storage.
// Must run BEFORE seed-customizable.js so the URLs the inserts reference exist.
console.log("→ Running supabase/seed-storage.js...");
execSync("node supabase/seed-storage.js", { stdio: "inherit" });

// Insert the customizable demo product (Camiseta Personalizable) + variations + templates.
// Uses PostgREST + service role; deterministic UUIDs make it idempotent.
console.log("→ Running supabase/seed-customizable.js...");
execSync("node supabase/seed-customizable.js", { stdio: "inherit" });

// Grant admin to users listed in ADMIN_USER_IDS (comma-separated UUIDs).
// Sets both profiles.is_admin (UI visibility) and admin_users table (RLS).
const adminUserIds = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => /^[0-9a-f-]{36}$/i.test(s)); // validate UUID format

if (adminUserIds.length > 0) {
  console.log(`→ Granting admin to ${adminUserIds.length} user(s) from ADMIN_USER_IDS...`);
  for (const uid of adminUserIds) {
    const sql = `
      INSERT INTO public.profiles (id, display_name, avatar_url)
        SELECT id,
               coalesce(raw_user_meta_data->>'display_name', split_part(email,'@',1)),
               raw_user_meta_data->>'avatar_url'
        FROM auth.users WHERE id = '${uid}'
        ON CONFLICT (id) DO NOTHING;
      UPDATE public.profiles SET is_admin = true WHERE id = '${uid}';
      INSERT INTO public.admin_users (user_id) VALUES ('${uid}') ON CONFLICT DO NOTHING;
    `;
    execSync(`npx supabase db query --linked "${sql.replace(/\n\s*/g, " ").trim()}"`, { stdio: "inherit" });
  }
  console.log("✓ Admin users seeded.");
} else {
  console.warn("⚠  ADMIN_USER_IDS not set or invalid — skipping. Add comma-separated UUIDs to .env.local and re-run db:reset.");
}
