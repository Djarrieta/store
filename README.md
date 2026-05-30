# Store

A full-stack store application built with **Next.js 16**, **Supabase**, and **RetroUI** (NeoBrutalism).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.x |
| UI | React 19 · RetroUI (NeoBrutalism, shadcn-based) + Tailwind CSS |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Linter | ESLint (eslint-config-next) |

## Getting Started

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Setup

```bash
# Install dependencies
npm install

# Create .env.local from the example values
cp .env.local.example .env.local
# Edit .env.local with your dev Supabase URL and anon key

# Link to your remote Supabase project (requires login)
npm run db:link

# Reset/seed the database
npm run db:reset

# Start dev server (runs on http://localhost:5000)
npm run dev
```

### Supabase Environments

Use two hosted Supabase projects:

- `dev` for development/testing
- `prod` for production traffic

Push migrations with Supabase CLI:

```bash
npx supabase link --project-ref <dev-project-ref>
npx supabase db push

# after validation in dev
npx supabase link --project-ref <prod-project-ref>
npx supabase db push
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
ADMIN_USER_IDS=<comma-separated-user-ids>
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
│   ├── layout.tsx          # Root layout (nav, fonts, user menu, chat migration)
│   ├── page.tsx            # Homepage (latest items grid)
│   ├── login/page.tsx      # Login (Google OAuth + dev login)
│   ├── auth/callback/       # OAuth callback handler
│   ├── chat/               # AI assistant (multi-channel, guest + auth)
│   ├── components/          # Shared UI components
│   └── items/               # Items module (list, detail, form, actions)
├── lib/
│   ├── auth.ts              # getUser(), requireAuth(), ensureProfile()
│   ├── constants.ts         # PAGE_SIZE, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, cookie names
│   ├── assistant/           # AI assistant helpers (chat history, prompt builder, MCP tools)
│   └── supabase/            # Client, server, and storage helpers
└── types/                   # TypeScript types (Item, Profile, etc.)

supabase/
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

- **Google OAuth** (sign-in method)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint:check` | Run ESLint (zero warnings) |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:reset` | Reset and seed the database |

## AI Assistant / Chat

The store includes a multi-channel AI assistant (web + WhatsApp) with server-persisted chat history:

- **Guests** can chat immediately — messages are stored in the DB with a `channel` flag (`web_guest` / `whatsapp`).
- **Migration on login** — guest messages are automatically moved to the authenticated user's account via `migrateChatSession()`.
- **WhatsApp integration** — external bot communicates via `/api/assistant` with a shared secret; lazy linkage detects when a guest migrates.

## Documentation

- [`TECH_SPEC.md`](./TECH_SPEC.md) — Full technical specification
- [`tasks.md`](./tasks.md) — Pre-implementation review (all decisions resolved)