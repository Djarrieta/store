// Runs all migrations then all seed files in sort order against the linked project.
// Add new .sql files to supabase/migrations/ or supabase/seed/ — no other changes needed.
const { execSync } = require("child_process");
const { readdirSync } = require("fs");
const { join } = require("path");

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

runDir("supabase/migrations");
runDir("supabase/seed");
