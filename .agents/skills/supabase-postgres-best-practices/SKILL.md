---
name: supabase-postgres-best-practices
description: Apply Supabase and Postgres performance and safety best practices.
---

When editing DB schema, queries, or data access in this repository:

- Keep migrations idempotent and ordered with zero-padded numeric prefixes.
- Enforce RLS on every table and define explicit policies.
- Use auth-aware checks for writes and privileged operations.
- Prefer generated columns and indexes for frequent search/filter patterns.
- Keep text truncation and validation in server actions as defense in depth.
- Use server Supabase client for server code and browser client for client code.
- Revalidate cached paths after mutations and redirect after successful writes.

Query guidance:

- Select only needed fields in hot paths.
- Use count + range for pagination.
- Normalize search terms for accent-insensitive search.
- Avoid bypassing RLS with direct DB access in request handlers.

Operational guidance:

- Keep seed files deterministic and safe to re-run.
- Use scripts/db-reset.ts for local reset flow.
