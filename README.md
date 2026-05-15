# Store

A full-stack store application built with **Next.js 16**, **Supabase**, and **RetroUI** (NeoBrutalism).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.x |
| UI | React 19 · RetroUI (NeoBrutalism, shadcn-based) + Tailwind CSS |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Scripts | Bun |
| Linter | ESLint (eslint-config-next) |

## Getting Started

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker or Podman (for local Supabase)
- Bun (for scripts)

### Setup

```bash
# Install dependencies
npm install

# Start local Supabase
npm run db:start

# Create .env.local from the example values
cp .env.local.example .env.local
# Edit .env.local with your local Supabase URL and anon key

# Reset DB (run migrations + seed)
npm run db:reset

# Start dev server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:5002
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5003/postgres
```

For Google OAuth (optional for local dev):

```env
SUPABASE_AUTH_GOOGLE_CLIENT_ID=<from Google Cloud Console>
SUPABASE_AUTH_GOOGLE_SECRET=<from Google Cloud Console>
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (nav, fonts, user menu)
│   ├── page.tsx            # Homepage (latest items grid)
│   ├── login/page.tsx      # Login (Google OAuth + dev login)
│   ├── auth/callback/       # OAuth callback handler
│   ├── components/          # Shared UI components
│   └── items/               # Items module (list, detail, form, actions)
├── lib/
│   ├── auth.ts              # getUser(), requireAuth(), ensureProfile()
│   ├── constants.ts         # PAGE_SIZE (24), MAX_TITLE_LENGTH (120), MAX_DESCRIPTION_LENGTH (2000)
│   └── supabase/            # Client, server, and storage helpers
└── types/                   # TypeScript types (Item, Profile, etc.)

supabase/
├── config.toml              # Local Supabase configuration (Postgres 17)
├── migrations/              # Numbered SQL migrations (NN_module.sql)
├── seed/                    # Seed data (~6 items across 2-3 categories)
└── seed.sql                 # Main seed entry point
```

## Key Patterns

- **Server Components by default** — pages and layouts are async Server Components
- **Server Actions** for all mutations (create, update, delete)
- **Row Level Security (RLS)** on every table — all item fields are public for reading
- **Admin-only catalog** — only admins can manage items; public browsing for everyone
- **No ORM** — Supabase JS client used directly (PostgREST)
- **Accent-insensitive search** via generated `*_search` columns
- **Light + dark theme** via RetroUI defaults

## Database

Migrations live in `supabase/migrations/` with zero-padded prefixes (`01_profiles.sql`, `02_items.sql`, …). Each is idempotent (`DROP TABLE IF EXISTS … CASCADE` at top).

The `items` table includes: `id`, `user_id`, `title`, `description`, `tags`, `images` (jsonb), `price` (numeric), `category` (text), `created_at`, `updated_at`.

## Authentication

- **Google OAuth** (production sign-in method)
- **Dev login** (`seed@app.local / password123`) — available in development only

> **Note:** Local Supabase uses Postgres 17. If deploying to hosted Supabase, verify the Postgres major version matches or test migrations against both.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:reset` | Drop, migrate, and seed the database |
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |

## Documentation

- [`TECH_SPEC.md`](./TECH_SPEC.md) — Full technical specification
- [`tasks.md`](./tasks.md) — Pre-implementation review (all decisions resolved)