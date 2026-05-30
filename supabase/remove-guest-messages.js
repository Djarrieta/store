/**
 * Removes expired guest chat messages and old migration log entries (>30 days).
 * Usage: node supabase/remove-guest-messages.js
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: e1, count: c1 } = await supabase
    .from("chat_messages")
    .delete({ count: "exact" })
    .neq("channel", "auth")
    .lt("created_at", thirtyDaysAgo);

  if (e1) {
    console.error("Error deleting guest messages:", e1.message);
  } else {
    console.log(`Deleted ${c1 ?? 0} expired guest chat messages.`);
  }

  const { error: e2, count: c2 } = await supabase
    .from("chat_migration_log")
    .delete({ count: "exact" })
    .lt("migrated_at", thirtyDaysAgo);

  if (e2) {
    console.error("Error deleting migration log entries:", e2.message);
  } else {
    console.log(`Deleted ${c2 ?? 0} expired migration log entries.`);
  }
}

main();
