// Creates (or ensures) a dev user with email + password for local sign-in.
// Uses the Supabase Auth Admin REST API with the service role key. Idempotent.
//
// Reads from .env.local:
//   DEV_USER_EMAIL    (default: dev@local.test)
//   DEV_USER_PASSWORD (default: devpassword)
//
// Run independently:  node supabase/seed-dev-user.js
// Or chained via      npm run db:reset
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.DEV_USER_EMAIL || "dev@local.test";
const PASSWORD = process.env.DEV_USER_PASSWORD || "devpassword";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function findUserByEmail(email) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?per_page=200`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET admin/users → ${res.status} ${await res.text()}`);
  const body = await res.json();
  const users = Array.isArray(body) ? body : body.users ?? [];
  return users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase()) || null;
}

async function createUser(email, password) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`POST admin/users → ${res.status} ${await res.text()}`);
  return res.json();
}

async function updatePassword(userId, password) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${userId}`;
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`PUT admin/users/${userId} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function grantAdmin(userId) {
  const restHeaders = {
    ...headers,
    Prefer: "resolution=merge-duplicates,return=minimal",
  };

  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: restHeaders,
    body: JSON.stringify({ id: userId, display_name: EMAIL.split("@")[0], is_admin: true }),
  });
  if (!profileRes.ok) {
    throw new Error(`upsert profiles → ${profileRes.status} ${await profileRes.text()}`);
  }

  // Ensure is_admin is true even if the row pre-existed without it.
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ is_admin: true }),
    },
  );
  if (!patchRes.ok) {
    throw new Error(`patch profiles → ${patchRes.status} ${await patchRes.text()}`);
  }

  const adminRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_users`, {
    method: "POST",
    headers: restHeaders,
    body: JSON.stringify({ user_id: userId }),
  });
  if (!adminRes.ok) {
    throw new Error(`upsert admin_users → ${adminRes.status} ${await adminRes.text()}`);
  }
}

async function main() {
  console.log(`→ Ensuring dev user '${EMAIL}' exists...`);
  const existing = await findUserByEmail(EMAIL);
  let user;
  if (existing) {
    user = await updatePassword(existing.id, PASSWORD);
    console.log(`  ✓ Updated password for existing user (id=${user.id})`);
  } else {
    user = await createUser(EMAIL, PASSWORD);
    console.log(`  ✓ Created user (id=${user.id})`);
  }
  await grantAdmin(user.id);
  console.log(`  ✓ Granted admin to ${user.id}`);
  console.log(`✓ Dev user ready (admin). Sign in with ${EMAIL} / ${PASSWORD}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message ?? err}`);
  process.exit(1);
});
