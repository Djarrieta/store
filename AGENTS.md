<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Required checks after changes

- **Database changes**: After any modifications to Supabase migrations, schema, or seed files, run `npm run db:reset` to apply changes locally.
- **Schema changes**: When modifying data models or table schemas, edit the existing migration scripts in `supabase/migrations/` directly (no new migration files needed). Retrocompatibility is not required — this is a development environment with no real data.
- **Lint check**: After any code changes, run `npm run lint:check` (zero warnings allowed). This script runs `eslint --max-warnings 0`.
