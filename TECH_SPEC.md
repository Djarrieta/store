# Tech Spec — Project Boilerplate

> A complete technical specification for bootstrapping a new project using the same stack, patterns, and conventions as this codebase. Domain-agnostic — replace the example "<module>" names with your own.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Environment Variables](#3-environment-variables)
4. [Supabase Setup](#4-supabase-setup)
5. [Database Schema Conventions](#5-database-schema-conventions)
6. [Profiles & User Management](#6-profiles--user-management)
7. [Authentication](#7-authentication)
8. [Image / File Storage](#8-image--file-storage)
9. [Accent-Insensitive Search](#9-accent-insensitive-search)
10. [Creating a New Module (Step-by-Step)](#10-creating-a-new-module-step-by-step)
11. [TypeScript Type Patterns](#11-typescript-type-patterns)
12. [Server Actions Pattern](#12-server-actions-pattern)
13. [List Page Pattern (with Search, Filter, Pagination)](#13-list-page-pattern-with-search-filter-pagination)
14. [Detail Page Pattern](#14-detail-page-pattern)
15. [Form Page Pattern](#15-form-page-pattern)
16. [Shared UI Components](#16-shared-ui-components)
17. [Styling & Theming](#17-styling--theming)
18. [Scripts & DB Reset](#18-scripts--db-reset)
19. [Join Tables & Nested Modules](#19-join-tables--nested-modules)
20. [API Routes (import/export)](#20-api-routes-importexport)

---

## 1. Tech Stack

| Layer             | Technology                                       | Version      |
| ----------------- | ------------------------------------------------ | ------------ |
| Framework         | **Next.js** (App Router)                         | 16.x         |
| Language          | **TypeScript**                                   | 5.x          |
| React             | **React**                                        | 19.x         |
| Styling           | **RetroUI** (NeoBrutalism, shadcn-based) + Tailwind CSS | per RetroUI  |
| Backend / DB      | **Supabase** (Postgres + Auth + Storage + RLS)   | —            |
| Supabase Client   | `@supabase/supabase-js` + `@supabase/ssr`        | 2.x / 0.10.x |
| Linter            | **ESLint** (eslint-config-next)                  | 9.x          |
| Package Manager   | **npm**                                          | —            |

### Key Design Decisions

- **No ORM** — Supabase JS client is used directly (PostgREST under the hood).
- **Server Components by default** — pages and layouts are async Server Components.
- **Server Actions** for all mutations (create, update, delete) — no custom API routes for CRUD.
- **API Routes** only for special operations (import/export bundles).
- **Row Level Security (RLS)** on every table — all data access goes through Supabase client which respects RLS.
- **No additional state management** — React state + Server Components + `revalidatePath`.

### AI Agent Skills

The project uses the following Copilot agent skills (`.agents/skills/`):

| Skill                              | Purpose                                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend-design`                  | Generates distinctive, production-grade UI with high design quality. Used for all web components, pages, and layouts.                          |
| `supabase-postgres-best-practices` | Postgres performance optimization and best practices from Supabase. Used when writing, reviewing, or optimizing queries, schema, or DB config. |

---

## 2. Project Structure

```
├── public/images/             # Static assets (illustrations, icons)
├── src/
│   ├── middleware.ts           # Supabase session refresh
│   ├── app/
│   │   ├── globals.css         # Tailwind + theme tokens
│   │   ├── layout.tsx          # Root layout (nav, fonts, user menu)
│   │   ├── page.tsx            # Landing / home page
│   │   ├── login/page.tsx      # Login page (OAuth + dev login)
│   │   ├── auth/callback/route.ts  # OAuth callback handler
│   │   ├── api/                # API routes (import/export only)
│   │   ├── components/         # Shared UI components
│   │   └── <module>/           # One folder per domain module
│   │       ├── page.tsx        # List page (Server Component)
│   │       ├── actions.ts      # Server Actions (CRUD)
│   │       ├── <Module>Card.tsx    # Card component for list
│   │       ├── <Module>Form.tsx    # Create/Edit form
│   │       ├── [id]/page.tsx       # Detail page
│   │       ├── [id]/edit/page.tsx  # Edit page
│   │       └── new/page.tsx        # Create page
│   ├── lib/
│   │   ├── auth.ts             # getUser(), requireAuth(), ensureProfile()
│   │   ├── constants.ts        # PAGE_SIZE (24), MAX_TITLE_LENGTH (120), MAX_DESCRIPTION_LENGTH (2000)
│   │   ├── format.ts           # Utility formatters
│   │   ├── hooks/              # Client-side hooks
│   │   └── supabase/
│   │       ├── client.ts       # Browser Supabase client
│   │       ├── server.ts       # Server Supabase client (cookies)
│   │       └── storage.ts      # File upload helpers
│   └── types/
│       ├── index.ts            # Re-exports + Profile type
│       └── <module>.ts         # Types per module
├── supabase/
│   ├── migrations/             # Numbered SQL migration files
│   ├── seed/                   # Seed data SQL files
│   └── seed.sql                # Main seed entry point
└── package.json
```

---

## 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
ADMIN_USER_IDS=<comma-separated-user-ids>
```

The `NEXT_PUBLIC_` prefix exposes them to the browser (needed for the Supabase client).

---

## 4. Supabase Setup

### Hosted Environments

Use two hosted Supabase projects:

- **Development** project for daily work and testing
- **Production** project for live traffic

Set project-specific values in environment files (for example: `.env.local` for development and deployment platform variables for production).

### Migration Flow (Remote Projects)

Apply migrations to hosted projects with Supabase CLI:

```bash
# Link CLI to the development project first
npx supabase link --project-ref <dev-project-ref>

# Push migrations to development
npx supabase db push

# Re-link to production when promoting changes
npx supabase link --project-ref <prod-project-ref>

# Push the same tested migrations to production
npx supabase db push
```

> **Tip:** Keep migration files idempotent and versioned in `supabase/migrations/` so the same SQL can be promoted from dev to prod safely.

### Supabase Client Setup

**Browser client** (`src/lib/supabase/client.ts`):

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

**Server client** (`src/lib/supabase/server.ts`):

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component — safe to ignore */
          }
        },
      },
    },
  );
}
```

### Middleware (`src/middleware.ts`)

Refreshes the Supabase auth session on every request. This is **required** for SSR auth to work:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await supabase.auth.getUser(); // Refresh session
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 5. Database Schema Conventions

### Migration Files

- Location: `supabase/migrations/`
- Naming: `NN_<module>.sql` with **zero-padded two-digit prefix** (e.g., `01_profiles.sql`, `02_items.sql`, … `10_storage.sql`). Zero-padding ensures alphabetical sort matches numeric order — without it, `10_…` would sort before `2_…` and break migration run order. Pick the next available number per migration; do not hard-code specific numbers in code or docs.
- Numbered prefix enforces execution order (foreign key dependencies)
- Each file is **idempotent** — uses `DROP TABLE IF EXISTS ... CASCADE` at the top

### Standard Table Template

Every entity table follows this pattern:

```sql
CREATE TABLE public.<entities> (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL DEFAULT auth.uid()
                     REFERENCES auth.users(id) ON DELETE CASCADE,
    title       text NOT NULL,
    description text,
    tags        text[] NOT NULL DEFAULT '{}',
    -- ... module-specific columns ...
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### Common Columns (all entity tables)

| Column           | Type                        | Purpose                         |
| ---------------- | --------------------------- | ------------------------------- |
| `id`             | `uuid` (PK, auto)           | Primary key                     |
| `user_id`        | `uuid` (FK → auth.users)    | Owner, defaults to `auth.uid()` |
| `title`          | `text NOT NULL`             | Main display field              |
| `description`    | `text` (nullable)           | Optional description            |
| `tags`           | `text[] NOT NULL DEFAULT '{}'` | Free-form tag array (filterable) |
| `created_at`     | `timestamptz DEFAULT now()` | Creation timestamp              |
| `updated_at`     | `timestamptz DEFAULT now()` | Auto-updated via trigger        |

### Auto-Update Trigger

Defined once, reused across all tables:

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE TRIGGER <table>_updated_at
  BEFORE UPDATE ON public.<table>
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
```

### Row Level Security (RLS)

Every table has RLS enabled with four standard policies:

```sql
ALTER TABLE public.<entities> ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public content)
CREATE POLICY "<entities>: public read"
  ON public.<entities> FOR SELECT USING (true);

-- Only owner can insert
CREATE POLICY "<entities>: owner insert"
  ON public.<entities> FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only owner can update
CREATE POLICY "<entities>: owner update"
  ON public.<entities> FOR UPDATE
  USING (auth.uid() = user_id);

-- Only owner can delete
CREATE POLICY "<entities>: owner delete"
  ON public.<entities> FOR DELETE
  USING (auth.uid() = user_id);
```

> **Note:** The "public read" policy makes all content visible to everyone. If you need private data, change the SELECT policy to `USING (auth.uid() = user_id)`.

### Items Table (Store Module)

The `items` table extends the standard template with store-specific columns:

```sql
CREATE TABLE public.items (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL DEFAULT auth.uid()
                     REFERENCES auth.users(id) ON DELETE CASCADE,
    title       text NOT NULL,
    description text,
    tags        text[] NOT NULL DEFAULT '{}',
    images      jsonb NOT NULL DEFAULT '[]'::jsonb,
    price       numeric(10,2) NOT NULL DEFAULT 0,
    category    text NOT NULL DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
```

| Column     | Type             | Purpose                               |
| ---------- | ---------------- | ------------------------------------- |
| `price`    | `numeric(10,2)`  | Item price in USD (e.g. 19.99)        |
| `category` | `text NOT NULL`  | Fixed category (e.g. Electronics)     |

### Access Model: Admin-Only Catalog

This store uses an **admin-only** catalog model — only admins can create, update, and delete items. Public users can browse and view items.

RLS policies for items use admin checks instead of the generic `auth.uid() = user_id` pattern. Admin status is determined by a list of admin user IDs or an `is_admin` flag on the profiles table. The exact mechanism is defined at implementation time.

---

## 6. Profiles & User Management

### Profiles Table

The `profiles` table is a **public mirror** of `auth.users`:

```sql
CREATE TABLE public.profiles (
    id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL DEFAULT '',
    avatar_url   text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
```

### Auto-Create on Signup (Database Trigger)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### FK from Entity Tables to Profiles

This allows PostgREST to **join** profile data when querying entities:

```sql
ALTER TABLE public.<entities>
  ADD CONSTRAINT <entities>_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);
```

This dual FK (`user_id` → `auth.users` AND `user_id` → `profiles`) enables the `profile:profiles(display_name, avatar_url)` select syntax.

### Server-Side Auth Helpers (`src/lib/auth.ts`)

> **Important:** This file does **not** start with `"use server"`. These are server-only utility functions called from Server Components, route handlers, and Server Actions — they are not themselves callable from the client. Do not add `"use server"` here, or every export becomes a public RPC endpoint.

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user);
  return user;
}

export async function ensureProfile(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: (user.user_metadata?.full_name ??
        user.user_metadata?.display_name ??
        user.email?.split("@")[0] ??
        "") as string,
      avatar_url: (user.user_metadata?.avatar_url ?? null) as string | null,
    },
    { onConflict: "id" },
  );
}
```

---

## 7. Authentication

### OAuth Flow (Google)

1. **Login page** calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`
2. User authenticates with Google → redirected to `/auth/callback?code=...`
3. **Callback route** (`src/app/auth/callback/route.ts`) exchanges the code for a session:
   ```ts
   const { error } = await supabase.auth.exchangeCodeForSession(code);
   ```
4. Callback also **upserts the profile** to ensure it exists
5. Redirects to home page

### Open Redirect Protection

The callback route validates the `next` query parameter to prevent open redirects:

```ts
const next = searchParams.get("next") ?? "/";
const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
// ...
return NextResponse.redirect(`${origin}${safeNext}`);
```

Without this, an attacker could craft `?next=//evil.com` to redirect users after login.

### Dev Login (local only)

For development, a password-based login is available using a seed user:

```ts
await supabase.auth.signInWithPassword({
  email: "seed@app.local",
  password: "password123",
});
```

This button is only rendered when `process.env.NODE_ENV === 'development'`.

### Using Auth in Pages

- **Read-only pages**: Use `getUser()` — returns `null` if not logged in (page still renders)
- **Mutation pages**: Use `requireAuth()` — redirects to `/login` if not authenticated

```tsx
// List page — show content to everyone, conditionally show edit buttons
const user = await getUser();
const isOwner = user?.id === entity.user_id;

// Create/Edit page — must be logged in
const user = await requireAuth();
```

---

## 8. Image / File Storage

### Supabase Storage Bucket (migration: `NN_storage.sql`)

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('<module>-images', '<module>-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "public_read_<module>_images" ON storage.objects
  FOR SELECT USING (bucket_id = '<module>-images');

-- Authenticated upload
CREATE POLICY "allow_upload_<module>_images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = '<module>-images' AND auth.uid() IS NOT NULL);

-- Authenticated delete
CREATE POLICY "allow_delete_<module>_images" ON storage.objects
  FOR DELETE USING (bucket_id = '<module>-images' AND auth.uid() IS NOT NULL);
```

### Upload Helper (`src/lib/supabase/storage.ts`)

```ts
import { createClient } from "@/lib/supabase/client";

export async function uploadImage(file: File, bucket: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
```

### Image Data Model

Images are stored as a JSONB array on the entity:

```sql
images jsonb NOT NULL DEFAULT '[]'::jsonb
```

TypeScript type:

```ts
interface EntityImage {
  url: string;
  description?: string;
}
```

### Next.js Image Configuration

For images from known domains (e.g., Supabase storage), configure `remotePatterns` in `next.config.ts`:

```ts
images: {
  remotePatterns: [{
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  }],
},
```

For images from **arbitrary user-provided URLs** (unknown domains), use `<Image unoptimized />`:

```tsx
import Image from "next/image";

<Image
  src={userProvidedUrl}
  alt={title}
  width={128}
  height={128}
  unoptimized
/>;
```

This skips Next.js image optimization (which requires whitelisted domains) but still provides lazy loading and layout shift prevention.

### Security Headers

Configure CSP and other security headers in `next.config.ts`:

```ts
headers: async () => [
  {
    source: "/:path*",
    headers: [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https: data:",
          "font-src 'self'",
          "connect-src 'self' *.supabase.co",
        ].join("; "),
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ],
  },
],
```

> **Note:** `img-src 'self' https: data:` allows images from any HTTPS source. This is safe — images cannot execute JavaScript. The critical directive is `script-src 'self'` which blocks injected scripts.

---

## 9. Accent-Insensitive Search

For apps with multilingual or accented content (Spanish, Portuguese, French, etc.):

### Setup (migration: `NN_unaccent_search.sql`)

```sql
-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA extensions;

-- Immutable wrapper (required for generated columns)
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$
  SELECT extensions.unaccent($1);
$$;

-- Generated search columns on each searchable table
ALTER TABLE public.<entities>
  ADD COLUMN IF NOT EXISTS title_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(title))) STORED;

ALTER TABLE public.<entities>
  ADD COLUMN IF NOT EXISTS description_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(coalesce(description, '')))) STORED;
```

> **Important:** The `_search` columns are **derived**, lowercased, accent-stripped copies used only for matching. The stored `title` and `description` columns keep the original casing the user typed (e.g. `"iPhone 15 Pro"`), and the UI renders them as-is.

### Querying

On the client side, normalize the search term before querying:

```ts
const term = `%${query
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")}%`;

query = query.or(`title_search.ilike.${term},description_search.ilike.${term}`);
```

---

## 10. Creating a New Module (Step-by-Step)

This is the complete recipe for adding a new domain module. We'll use **"recipes"** as an example.

### Step 1: Database Migration

Create `supabase/migrations/NN_recipes.sql`:

```sql
DROP TABLE IF EXISTS public.recipes CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.recipes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL DEFAULT auth.uid()
                         REFERENCES auth.users(id) ON DELETE CASCADE,
    title           text NOT NULL,
    description     text,
    tags            text[] NOT NULL DEFAULT '{}',
    images          jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Module-specific columns:
    prep_time_mins  integer NOT NULL DEFAULT 0,
    cook_time_mins  integer NOT NULL DEFAULT 0,
    servings        integer NOT NULL DEFAULT 1,
    --
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes: public read" ON public.recipes
  FOR SELECT USING (true);
CREATE POLICY "recipes: owner insert" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes: owner update" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recipes: owner delete" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);
```

Add FK to profiles and search column in the profiles/search migration files:

```sql
-- In profiles migration:
ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- In search migration:
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS title_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(title))) STORED;
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS description_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(coalesce(description, '')))) STORED;
```

### Step 2: TypeScript Types

Create `src/types/recipe.ts`:

```ts
export interface RecipeImage {
  url: string;
  description: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  images: RecipeImage[];
  tags: string[];
  prep_time_mins: number;
  cook_time_mins: number;
  servings: number;
  created_at: string;
  updated_at: string;
  profile?: { display_name: string; avatar_url: string | null };
}

export type CreateRecipeInput = Omit<
  Recipe,
  "id" | "user_id" | "created_at" | "updated_at" | "profile"
>;

export type UpdateRecipeInput = Partial<CreateRecipeInput>;
```

Re-export from `src/types/index.ts`:

```ts
export * from "./recipe";
```

### Step 3: Server Actions

Create `src/app/recipes/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import type { CreateRecipeInput, UpdateRecipeInput } from "@/types";
import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from "@/lib/constants";

export async function createRecipe(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const input: CreateRecipeInput = {
    title: (formData.get("title") as string)
      .trim()
      .slice(0, MAX_TITLE_LENGTH),
    description:
      (formData.get("description") as string)
        ?.trim()
        .slice(0, MAX_DESCRIPTION_LENGTH) || null,
    images: JSON.parse((formData.get("images") as string) || "[]"),
    tags: ((formData.get("tags") as string) || "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
    prep_time_mins: Number(formData.get("prep_time_mins")) || 0,
    cook_time_mins: Number(formData.get("cook_time_mins")) || 0,
    servings: Number(formData.get("servings")) || 1,
  };

  const { error } = await supabase
    .from("recipes")
    .insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function updateRecipe(id: string, formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const input: UpdateRecipeInput = {
    title: (formData.get("title") as string)
      .trim()
      .slice(0, MAX_TITLE_LENGTH),
    description:
      (formData.get("description") as string)
        ?.trim()
        .slice(0, MAX_DESCRIPTION_LENGTH) || null,
    images: JSON.parse((formData.get("images") as string) || "[]"),
    tags: ((formData.get("tags") as string) || "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
    prep_time_mins: Number(formData.get("prep_time_mins")) || 0,
    cook_time_mins: Number(formData.get("cook_time_mins")) || 0,
    servings: Number(formData.get("servings")) || 1,
  };

  const { error } = await supabase
    .from("recipes")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
  redirect(`/recipes/${id}`);
}

export async function deleteRecipe(id: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function deleteRecipes(ids: string[]) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipes")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
}
```

### Step 4: List Page

Create `src/app/recipes/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { Recipe } from "@/types";
import RecipeCard from "./RecipeCard";
import PageHeader from "@/app/components/PageHeader";
import FilterableList from "@/app/components/FilterableList";
import { PAGE_SIZE } from "@/lib/constants";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tags?: string;
    page?: string;
    mine?: string;
  }>;
}) {
  const { q, tags: tagsParam, page: pageStr, mine } = await searchParams;
  const user = await getUser();
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const activeTags = (tagsParam ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select("*, profile:profiles(display_name, avatar_url)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    const term = `%${q
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")}%`;
    query = query.or(`title_search.ilike.${term},description_search.ilike.${term}`);
  }

  if (activeTags.length > 0) query = query.contains("tags", activeTags);
  if (mine && user) query = query.eq("user_id", user.id);

  const { data: recipes, count } = await query
    .range(from, to)
    .returns<Recipe[]>();

  const total = count ?? 0;

  return (
    <PageHeader
      title="Recipes"
      createHref="/recipes/new"
      createLabel="New Recipe"
      isEmpty={total === 0 && !q && activeTags.length === 0 && !mine}
      emptyText="No recipes yet."
    >
      <FilterableList /* ... */ />
    </PageHeader>
  );
}
```

### Step 5: Detail Page

Create `src/app/recipes/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { deleteRecipe } from "../actions";
import type { Recipe } from "@/types";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single<Recipe>();

  if (!recipe) notFound();

  const user = await getUser();
  const isOwner = user?.id === recipe.user_id;

  return (
    <div>
      <h1>{recipe.title}</h1>
      {/* Display fields, edit/delete buttons if isOwner */}
    </div>
  );
}
```

### Step 6: Form Component

Create `src/app/recipes/RecipeForm.tsx` as a `"use client"` component:

- Receives optional `defaultValues` prop for edit mode
- Uses `<form action={...}>` with Server Actions
- Handles image upload via the storage helper
- Serializes complex fields (images, tags) as hidden inputs

### Step 7: Create & Edit Pages

**Create** (`src/app/recipes/new/page.tsx`):

```tsx
import { requireAuth } from "@/lib/auth";
import RecipeForm from "../RecipeForm";
import { createRecipe } from "../actions";

export default async function NewRecipePage() {
  await requireAuth();
  return <RecipeForm action={createRecipe} />;
}
```

**Edit** (`src/app/recipes/[id]/edit/page.tsx`):

```tsx
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecipeForm from "../../RecipeForm";
import { updateRecipe } from "../../actions";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();
  if (!recipe || recipe.user_id !== user.id) notFound();

  const updateWithId = updateRecipe.bind(null, id);
  return <RecipeForm action={updateWithId} defaultValues={recipe} />;
}
```

---

## 11. TypeScript Type Patterns

### Base Entity Type

```ts
export interface <Entity> {
  id: string
  user_id: string
  title: string
  description: string | null
  tags: string[]
  created_at: string
  updated_at: string
  profile?: { display_name: string; avatar_url: string | null }
}
```

### Input Types (derived via Omit)

```ts
// For creating — omit server-managed fields
export type Create<Entity>Input = Omit<
  <Entity>,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'profile'
>

// For updating — all fields optional
export type Update<Entity>Input = Partial<Create<Entity>Input>
```

### Nested Types (join tables)

When module A contains module B via a join table:

```ts
export interface AWithBs extends A {
  a_bs: AB[]; // join table rows with nested B
}

export interface AB {
  id: string;
  a_id: string;
  b_id: string;
  position: number;
  created_at: string;
  b: BWithChildren; // nested child entity
}
```

---

## 12. Server Actions Pattern

All CRUD mutations use **Next.js Server Actions** (`'use server'`):

```ts
"use server";

import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from "@/lib/constants";

export async function create<Entity>(formData: FormData) {
  const user = await requireAuth(); // 1. Auth check
  const supabase = await createClient(); // 2. Get server client
  const input = {
    // 3. Parse & truncate input — preserve original casing
    title: (formData.get("title") as string)
      .trim()
      .slice(0, MAX_TITLE_LENGTH),
    description:
      (formData.get("description") as string)
        ?.trim()
        .slice(0, MAX_DESCRIPTION_LENGTH) || null,
    // ...
  };
  const { error } = await supabase // 4. DB operation
    .from("<entities>")
    .insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message); // 5. Error handling
  revalidatePath("/<entities>"); // 6. Cache invalidation
  redirect("/<entities>"); // 7. Redirect
}
```

### Key Patterns

- **Always call `requireAuth()`** before any mutation
- **Always include `.eq('user_id', user.id)`** on update/delete for defense-in-depth (RLS is the primary guard)
- **Truncate text inputs** with `.slice(0, MAX_TITLE_LENGTH)` / `.slice(0, MAX_DESCRIPTION_LENGTH)` to enforce length limits server-side
- **Preserve original casing** of `title` / `description` when storing — the lowercased form lives only in the generated `*_search` columns. UI always renders the stored value as-is.
- **Use `revalidatePath()`** after mutations to bust the Next.js cache
- **Use `redirect()`** to navigate after successful operations
- **Bind IDs** for update/delete: `updateEntity.bind(null, id)`

---

## 13. List Page Pattern (with Search, Filter, Pagination)

```tsx
export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tags?: string;
    page?: string;
    mine?: string;
  }>;
}) {
  const { q, tags, page: pageStr, mine } = await searchParams;
  const user = await getUser(); // nullable — page is public

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("<entities>")
    .select("*, profile:profiles(display_name, avatar_url)", { count: "exact" })
    .order("created_at", { ascending: false });

  // Search (accent-insensitive)
  if (q?.trim()) {
    const term = `%${q
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")}%`;
    query = query.or(`title_search.ilike.${term},description_search.ilike.${term}`);
  }

  // Tag filter
  if (activeTags.length > 0) query = query.contains("tags", activeTags);

  // "My items" filter
  if (mine && user) query = query.eq("user_id", user.id);

  const { data, count } = await query.range(from, to);
  // Render with PageHeader + FilterableList + EntityCard
}
```

### Key Features

- **`{ count: 'exact' }`** — Supabase returns total count for pagination
- **`.range(from, to)`** — offset-based pagination
- **`profile:profiles(...)`** — join profile data via the FK

---

## 14. Detail Page Pattern

```tsx
export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: entity } = await supabase
    .from("<entities>")
    .select("*")
    .eq("id", id)
    .single();

  if (!entity) notFound();

  const user = await getUser();
  const isOwner = user?.id === entity.user_id;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Entities", href: "/entities" },
          { label: entity.title },
        ]}
      />
      <h1>{entity.title}</h1>
      {/* Display all fields */}
      {isOwner && (
        <>
          <Link href={`/entities/${id}/edit`}>Edit</Link>
          <form action={deleteEntity.bind(null, id)}>
            <button>Delete</button>
          </form>
        </>
      )}
    </>
  );
}
```

---

## 15. Form Page Pattern

Forms are **Client Components** (`"use client"`) that receive a Server Action:

```tsx
"use client";

import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from "@/lib/constants";

interface FormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<Entity>;
}

export default function EntityForm({ action, defaultValues }: FormProps) {
  return (
    <form action={action}>
      <input
        name="title"
        maxLength={MAX_TITLE_LENGTH}
        defaultValue={defaultValues?.title ?? ""}
      />
      <textarea
        name="description"
        maxLength={MAX_DESCRIPTION_LENGTH}
        defaultValue={defaultValues?.description ?? ""}
      />
      {/* Complex fields serialized as hidden inputs */}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <button type="submit">{defaultValues ? "Update" : "Create"}</button>
    </form>
  );
}
```

> **Note:** `maxLength` prevents the browser from accepting more characters. The server actions also truncate with `.slice()` as defense-in-depth.

---

## 16. Shared UI Components

| Component           | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `PageHeader`        | Title, empty state, create button wrapper                               |
| `FilterableList`    | Search bar + tag filter + "mine" toggle + pagination                    |
| `EntityCard`        | Reusable card (thumbnail, title, description, tags, meta, creator info) |
| `Badge`             | Tag/badge pill with link                                                |
| `Breadcrumb`        | Breadcrumb navigation                                                   |
| `SearchableSelect`  | Dropdown with search for selecting related entities                     |
| `SelectionProvider` | Context for multi-select with bulk actions                              |
| `UserMenu`          | Avatar + dropdown with logout                                           |
| `NavLinks`          | Desktop + mobile navigation links                                       |

---

## 17. Styling & Theming

### RetroUI (NeoBrutalism)

Uses [RetroUI](https://retroui.dev/docs) — a NeoBrutalism-styled component library built on shadcn conventions. Follow RetroUI's recommended installation and Tailwind version.

Theme tokens and global styles are defined in `globals.css` per RetroUI's setup guide.

### Fonts

Two Google Fonts loaded via `next/font`:

- **Outfit** — display/headings (`font-display`)
- **Inter** — body text (`font-sans`)

### Light + Dark Theme

The app supports both light and dark modes using RetroUI's default theming. A theme toggle is available in the UI.

---

## 18. Scripts & Migration Workflow

This project does not require running a local Supabase stack. Schema changes are promoted through hosted **dev** and **prod** projects via migrations.

Recommended flow:

1. Create a new migration in `supabase/migrations/`
2. Push to hosted development project (`supabase db push`)
3. Validate app behavior against the dev project
4. Promote the same migration set to production

### `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 19. Join Tables & Nested Modules

When modules have parent-child relationships (e.g., a "Routine" contains "Sets", a "Set" contains "Exercises"):

### Join Table Schema

```sql
CREATE TABLE public.parent_children (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    child_id  uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    position  integer NOT NULL DEFAULT 0,
    -- Optional extra fields (e.g., rounds, day_of_week)
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (parent_id, child_id)
);

CREATE INDEX parent_children_pos ON public.parent_children(parent_id, position);
```

### RLS on Join Tables

Join table RLS checks ownership of the **parent**:

```sql
CREATE POLICY "parent_children: owner insert" ON public.parent_children
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.parents WHERE id = parent_id AND user_id = auth.uid())
  );
```

### Querying Nested Data

Supabase PostgREST supports nested selects:

```ts
const { data } = await supabase
  .from("parents")
  .select(
    `
    *,
    parent_children(
      id, position, rounds,
      child:children(*, child_items(*))
    )
  `,
  )
  .eq("id", id)
  .single();
```

### Creating with Relations

In the Server Action, insert the parent first, then the join table rows:

```ts
const { data: parent } = await supabase
  .from("parents")
  .insert(input)
  .select("id")
  .single();

const rows = childEntries.map((entry, i) => ({
  parent_id: parent.id,
  child_id: entry.id,
  position: i,
}));
await supabase.from("parent_children").insert(rows);
```

### Updating Relations

Delete all existing join rows, then re-insert (replace strategy):

```ts
await supabase.from("parent_children").delete().eq("parent_id", id);
await supabase.from("parent_children").insert(newRows);
```

---

## 20. API Routes (import/export)

API routes are used only for bundle import/export operations (not for standard CRUD):

```
src/app/api/<module>/import/route.ts    # POST — import a bundle JSON
src/app/api/<module>/[id]/export/route.ts  # GET — export as JSON
```

### Bundle Types

Define bundle types for import/export:

```ts
export interface EntityBundle {
  entity: Pick<Entity, 'title' | 'description' | ...>
  children: BundleChild[]
}
```

This allows users to share entities as JSON files that can be imported into other accounts.

---

## Quick Reference: New Module Checklist

- [ ] `supabase/migrations/NN_<module>.sql` — table + RLS + trigger
- [ ] Add FK to profiles in profiles migration
- [ ] Add search column in the unaccent search migration (`NN_unaccent_search.sql`)
- [ ] `src/types/<module>.ts` — Entity + CreateInput + UpdateInput types
- [ ] Re-export from `src/types/index.ts`
- [ ] `src/app/<module>/actions.ts` — create, update, delete Server Actions (with `.slice()` truncation using `MAX_TITLE_LENGTH` / `MAX_DESCRIPTION_LENGTH`)
- [ ] `src/app/<module>/page.tsx` — list page
- [ ] `src/app/<module>/[id]/page.tsx` — detail page
- [ ] `src/app/<module>/[id]/edit/page.tsx` — edit page
- [ ] `src/app/<module>/new/page.tsx` — create page
- [ ] `src/app/<module>/<Module>Card.tsx` — card component
- [ ] `src/app/<module>/<Module>Form.tsx` — form component (with `maxLength` on text inputs)
- [ ] Add nav link in `src/app/components/NavLinks.tsx`
- [ ] Add nav buttons in `src/app/layout.tsx`
- [ ] Use `<Image unoptimized />` instead of `<img>` for user-provided image URLs
- [ ] (Optional) Storage bucket migration if module has images
- [ ] (Optional) Join table migration if module has child entities
- [ ] (Optional) API routes for import/export (with `.slice()` truncation on text fields)
- [ ] (Optional) Seed data in `supabase/seed/`
