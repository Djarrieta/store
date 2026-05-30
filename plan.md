# Plan: Server-side Guest Chat Persistence (Multi-Channel)

## Goal

Replace localStorage-based guest chat with server-persisted messages. Support **multiple channels** (web, WhatsApp, future) with a unified guest → authenticated user migration. Guests start chatting immediately; messages are saved to DB with summarization active. When they log in (via any channel), the conversation migrates to their authenticated account.

---

## Current Behavior

- **Authenticated users**: messages stored in `chat_messages` table with `user_ref = user.id`.
- **Web guests**: messages stored only in `localStorage` (key `chat_messages`). On login, `migrateGuestChat()` copies them to DB row-by-row.
- **WhatsApp users**: `/api/assistant` route always persists to DB using `userRef` from the bot caller. No guest/auth distinction exists yet.
- **Problems**:
  - Web guest history is lost on device/browser change.
  - Migration relies on the client sending the full history array (untrusted).
  - WhatsApp users can't transition from guest → authenticated.
  - No way to identify which channel a message came from.

---

## Design Decisions

| Question | Decision |
|----------|----------|
| Guest vs. real user detection | `channel` column on `chat_messages`. If `channel != 'auth'`, the user_ref is a guest/temporary ID. |
| Guest identity (web) | Client-generated UUID stored in a cookie. |
| Guest identity (WhatsApp) | Bot generates a UUID on first contact and stores it in bot state (keyed by phone number). |
| Migration trigger (web) | **Root layout** — migration runs on any authenticated page load, not just /chat. |
| Migration trigger (WhatsApp) | Bot sends a login link (already exists for purchase flow). After login, callback endpoint triggers migration. |
| Initial message loading | **Server-side pre-fetch** — `/chat/page.tsx` reads the cookie and passes messages as props (no client loading flash). |
| Guest summarization | **Allowed** — summaries are created for guest sessions. On migration, summarization is NOT triggered; it fires on the next new message instead. |
| Message persistence ordering | **Save after response** (current pattern). Only persist user+assistant messages after a successful LLM response. Avoids orphan user messages on failure. |
| How server gets guestId (web) | **Client passes it as a parameter** to server actions. Cookie is managed client-side only (server reads it only for pre-fetch in page.tsx). |
| guestId validation | **DB function** — `user_exists(p_id)` (SECURITY DEFINER) queries `auth.users`. Called via `supabase.rpc()` from the service client. |
| WhatsApp login link (wa_ref survival) | **Server action sets HttpOnly cookie** — `LoginActions` calls a server action that sets the `wa_ref` cookie before triggering OAuth. Auth callback reads it post-redirect. |
| Bot learns user is linked | **Lazy check via `chat_migration_log`** — on next message, API looks up the guest UUID in `chat_migration_log`. If found, returns `{ migrated: true, authUserId }`. Bot updates its phone→userRef mapping. |
| Existing data / backfill | **Clean slate** — we are in dev; `db:reset` applies. Migration SQL includes `channel` from the start, no backfill script needed. |
| Shared code | Share helpers (`buildPrompt`, `addMessage`, `getHistory`, `generateResponse`, `migrateChatSession`). Each channel keeps its own orchestration (server action vs. API route). |

---

## Proposed Changes

### 1. Schema change: add `channel` column + `chat_migration_log` table

Update `supabase/migrations/11_chat_messages.sql`:

```sql
CREATE TABLE public.chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ref   text NOT NULL,
  channel    text NOT NULL DEFAULT 'auth' CHECK (channel IN ('auth', 'web_guest', 'whatsapp')),
  role       text NOT NULL CHECK (role IN ('user', 'assistant', 'summary')),
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_user_ref_idx ON public.chat_messages (user_ref, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages: no public access"
  ON public.chat_messages FOR ALL USING (false);

-- Migration log: allows lazy lookups (bot asks "where did guest X go?")
CREATE TABLE public.chat_migration_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_ref    text NOT NULL,
  auth_user_id text NOT NULL,
  channel      text NOT NULL,
  migrated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_migration_log_guest_ref_idx ON public.chat_migration_log (guest_ref);
CREATE UNIQUE INDEX chat_migration_log_guest_ref_uniq ON public.chat_migration_log (guest_ref);

ALTER TABLE public.chat_migration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_migration_log: no public access"
  ON public.chat_migration_log FOR ALL USING (false);

-- DB function: check if a UUID exists in auth.users (used for guestId validation)
CREATE OR REPLACE FUNCTION public.user_exists(p_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_id); $$;
```

- `channel = 'auth'` → `user_ref` is a Supabase Auth user ID (authenticated).
- `channel = 'web_guest'` → `user_ref` is a client-generated UUID (browser guest).
- `channel = 'whatsapp'` → `user_ref` is a bot-generated UUID (WhatsApp guest).

Guest detection: `channel != 'auth'` (no prefix parsing needed).

`chat_migration_log` enables the lazy linkage pattern: when the bot sends a message for a migrated guest UUID, the API looks up `chat_migration_log` to find the new `auth_user_id`.

### 2. Shared helper: `addMessage()` update

```ts
addMessage(userRef: string, message: string, role: string, channel: 'auth' | 'web_guest' | 'whatsapp')
```

All callers (web sendMessage, API route) pass the channel explicitly.

`addMessage` propagates `channel` to `summarizeIfNeeded(userRef, channel)` so that summary rows are inserted with the correct channel value.

### 3. Shared helper: `migrateChatSession()`

New function in `src/lib/assistant/chatHistory.ts`:

```ts
export async function migrateChatSession(guestRef: string, authUserId: string): Promise<void>
```

Logic:
1. If `authUserId` already has a summary row, delete the guest's summary row(s).
2. `UPDATE chat_messages SET user_ref = authUserId, channel = 'auth' WHERE user_ref = guestRef AND channel != 'auth'`.
3. `INSERT INTO chat_migration_log (guest_ref, auth_user_id, channel) ... ON CONFLICT (guest_ref) DO NOTHING` — record the mapping for lazy lookups; idempotent on retry.
4. **Do NOT call `summarizeIfNeeded`** here — summarization fires naturally on the next new message.
5. Atomic — safe to retry (migration_log INSERT is idempotent by guest_ref+auth_user_id).

Used by both the web migration trigger and the WhatsApp login callback.

### 4. Generate a guest session ID (web — client-side)

- On first chat interaction, if the user is NOT authenticated, generate a UUID v4 and persist it in a **cookie** (`guest_chat_id`, non-HttpOnly, SameSite=Lax, 30-day expiry, path=/).
- If the cookie already exists, reuse it.
- Pass this raw UUID as `guestId` to `sendMessage()`.

### 5. Update `sendMessage()` server action (web)

- New signature: `sendMessage(message: string, cartItems: CartItem[], guestId: string | null)`.
- Remove the `guestHistory` parameter entirely.
- Determine `userRef` + `channel`:
  - If authenticated → `user.id`, `channel = 'auth'`.
  - Else if `guestId` provided → validate UUID format AND call `supabase.rpc('user_exists', { p_id: guestId })` (reject if true) → `guestId`, `channel = 'web_guest'`.
  - Else → throw error.
- **Save after response** (current pattern): `buildPrompt` → `generateResponse` → `addMessage(user)` → `addMessage(assistant)`. If LLM fails, nothing is persisted; widget shows error and user can retry.

### 6. Update `/api/assistant/route.ts` (WhatsApp / external)

- Accepts `userRef` from bot (bot-generated UUID for guests, or an auth user ID for linked users).
- New optional field in body: `channel: 'whatsapp' | 'auth'` (defaults to `'whatsapp'`).
- Bot tracks a mapping: phone number → generated UUID. First contact generates a new UUID.
- **Lazy linkage detection**: on each message, if bot sends `channel = 'whatsapp'`, first check `chat_migration_log` for `guest_ref = userRef`. If found → return `{ migrated: true, authUserId }`. Bot updates its mapping and re-sends with the auth user ID + `channel = 'auth'`.
- Persistence ordering: **save after response** (unified with web). If LLM fails, bot can retry; message loss risk accepted.

### 7. Update `buildPrompt.ts`

- Remove `guestHistory` parameter.
- Accept `channel` parameter (or detect guest from `channel != 'auth'`).
- For guests (any channel): skip profile/address queries, but **fetch DB history** via `getHistory(userRef)`.
- Guest instructions and tool restrictions keyed off `isGuest = channel !== 'auth'`.

### 8. Update `generateResponse()` / MCP tools

- New signature: `generateResponse(prompt: string, channel: 'auth' | 'web_guest' | 'whatsapp')` (replaces `userRef: string | null`).
- Tools that require authentication (`bot_create_order`, `bot_get_my_orders`, `bot_get_order_status`) deny access when `channel !== 'auth'`.
- Error message prompts login (includes link for WhatsApp users).

### 9. Update `ChatWidget.tsx`

- Remove all `localStorage` read/write logic for messages.
- Keep `isAuthenticated` prop (used to decide whether to generate/use guest cookie and to show login hint).
- Receive `initialMessages` as a prop (pre-fetched server-side).
- Manage the `guest_chat_id` cookie client-side (generate if missing when user sends first message AND `isAuthenticated === false`).
- Pass `guestId` (from cookie) to `sendMessage()`.

### 10. Update `/chat/page.tsx` (server component)

- Read `guest_chat_id` from `cookies()`.
- If authenticated: fetch history via `getHistory(user.id)`.
- If guest cookie exists: fetch history via `getHistory(cookieValue)`.
- Pass result as `initialMessages` prop to `ChatWidget`.

### 11. Migration trigger: web (root layout)

- Root layout already calls `getUser()` (confirmed). Pass `isAuthenticated` as a prop to a **`ChatMigration`** client component rendered in the layout.
- `ChatMigration` detects: `isAuthenticated === true` AND `guest_chat_id` cookie exists (read client-side).
- Calls `migrateGuestChat(guestId)` server action → internally calls `migrateChatSession(guestId, user.id)`.
- Clears cookie on success.
- Race condition mitigation: atomic UPDATE; cookie only cleared on success; retry on next page load catches stragglers.

### 12. Migration trigger: WhatsApp (login link callback)

- Bot sends a login link: `https://store.example/login?wa_ref=UUID`.
- `/login` page (or `LoginActions.tsx`) detects `wa_ref` query param and calls a **server action** (`setWaRefCookie(waRef)`) that sets an **HttpOnly cookie** (`wa_ref`, SameSite=Lax, max-age=600, path=/auth). This avoids the client needing to set HttpOnly cookies directly.
- **Important**: `await setWaRefCookie(waRef)` must complete before triggering `signInWithOAuth()`. The login button handler should await the cookie-set action first when `wa_ref` is present.
- OAuth flow proceeds normally.
- After OAuth completes, `/auth/callback` reads the `wa_ref` cookie. If present, calls `migrateChatSession(waRefValue, newlyAuthenticatedUserId)` and clears the cookie.
- Bot learns lazily on next message (see step 6 — checks `chat_migration_log`).

### 13. Cleanup: expired guest messages

- Utility script:
  ```sql
  DELETE FROM chat_messages
  WHERE channel != 'auth'
    AND created_at < now() - interval '30 days';

  DELETE FROM chat_migration_log
  WHERE migrated_at < now() - interval '30 days';
  ```
- Run via cron or manually.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/11_chat_messages.sql` | Add `channel` column, `chat_migration_log` table, `user_exists()` function |
| `src/lib/assistant/chatHistory.ts` | Update `addMessage` signature (add channel), add `migrateChatSession()` (with migration_log insert), skip summarize in migration |
| `src/lib/assistant/mcpService.ts` | Change `generateResponse` signature to accept `channel`, update tool-blocking logic |
| `src/lib/assistant/buildPrompt.ts` | Remove `guestHistory` param, accept `channel`, use DB history for all |
| `src/app/chat/ChatWidget.tsx` | Remove localStorage, accept `initialMessages` prop, manage cookie, pass `guestId` param |
| `src/app/chat/actions.ts` | Rewrite `sendMessage` (new sig, save-after, validate guestId via `user_exists()` RPC), rewrite `migrateGuestChat` (calls `migrateChatSession`) |
| `src/app/actions/chat-migration.ts` | New: `setWaRefCookie()` server action (sets HttpOnly cookie for WhatsApp login flow) |
| `src/app/chat/page.tsx` | Read cookie, pre-fetch messages, pass as props |
| `src/app/api/assistant/route.ts` | Accept `channel` in body, pass to helpers, add migration-detection response, unify save-after |
| `src/app/layout.tsx` | Add client component that triggers web guest migration |
| `src/app/login/page.tsx` (or `LoginActions.tsx`) | Detect `wa_ref` query param, store in cookie before OAuth redirect |
| `src/app/auth/callback/route.ts` | Read `wa_ref` cookie, call `migrateChatSession()`, clear cookie |
| `src/lib/constants.ts` | Replace `CHAT_STORAGE_KEY` with `GUEST_CHAT_COOKIE` / `WA_REF_COOKIE` constants |
| `supabase/remove-guest-messages.js` | New cleanup script (uses `channel != 'auth'`) |

---

## Migration Path

1. We are in dev — `npm run db:reset` applies the new schema cleanly (includes `channel` column from the start).
2. **No localStorage backwards-compatibility needed** — simply delete all localStorage chat code. No transitional migration logic.
3. WhatsApp bot update: start generating UUIDs for new contacts, persist via API route with `channel = 'whatsapp'`.

---

## Edge Cases

- **Multiple tabs (web)**: cookie is shared → consistent guestId across tabs.
- **Cookie cleared manually**: guest loses web history (acceptable).
- **User logs out after migration**: new guest session gets a fresh UUID. Previous messages stay under the authenticated user.
- **Same guest logs into different accounts**: migration moves messages to whichever account they log into first. Cookie/bot-state is cleared, so logging into a second account won't re-migrate.
- **Summary conflict on migration**: if the authenticated user already has a summary and the guest also has one, the guest summary is deleted (user's existing summary is more authoritative). Recent guest messages are still moved.
- **Concurrent message + migration**: UPDATE is atomic; cookie only cleared on success, so a retry on next page load catches stragglers.
- **WhatsApp user already linked**: bot stores the auth user ID after first migration. Future messages go directly with `channel = 'auth'`.
- **Cross-channel same user**: a user may have both a web guest session and a WhatsApp guest session. Each migrates independently when login happens on that channel. Both end up under the same `user.id` with `channel = 'auth'`.

---

## Sequence Diagrams

### Web Guest → Login

```
Browser                     Server                      DB
  │ (first message)
  │──cookie: guest_chat_id = UUID──►│
  │──sendMessage(msg, [], UUID)────►│
  │                                 │──buildPrompt + generateResponse──►│
  │                                 │──INSERT(user msg, channel='web_guest')───►│
  │                                 │──INSERT(assistant response)──────►│
  │◄─────response──────────────────│
  │                                 │
  │ (user clicks login)
  │──auth flow────────────────────►│
  │ (page loads, root layout)       │
  │──migrateGuestChat(UUID)───────►│
  │                                 │──UPDATE SET user_ref=userId, channel='auth' WHERE user_ref=UUID──►│
  │                                 │──INSERT migration_log(UUID, userId)──►│
  │ (clear cookie)                  │
```

### WhatsApp Guest → Login

```
WhatsApp Bot                API Route                   DB
  │ (first message from +57...)
  │──POST /api/assistant {userRef: newUUID, channel:'whatsapp'}──►│
  │                                 │──buildPrompt + generateResponse──►│
  │                                 │──INSERT(user_ref=UUID, channel='whatsapp', role='user')──►│
  │                                 │──INSERT(assistant response)──────►│
  │◄─────response──────────────────│
  │                                 │
  │ (user tries to buy → bot sends login link: /login?wa_ref=UUID)
  │                                 │
  │         Browser                 │
  │─────────────────────────────────│──GET /login?wa_ref=UUID──►│
  │                                 │──set cookie: wa_ref=UUID (max-age=600)──►│
  │                                 │──redirect to OAuth provider──►│
  │                                 │──OAuth callback──►│
  │                                 │──GET /auth/callback (reads wa_ref cookie)──►│
  │                                 │──migrateChatSession(UUID, userId)──►│
  │                                 │──UPDATE SET user_ref=userId, channel='auth'──►│
  │                                 │──clear wa_ref cookie──►│
  │                                 │
  │ (next message from +57...)
  │──POST /api/assistant {userRef: UUID, channel:'whatsapp'}──►│
  │                                 │──(checks chat_migration_log for UUID → found: authUserId)──►│
  │                                 │──returns {migrated:true, authUserId}──►│
  │ (bot updates mapping: phone→authUserId)
  │──POST /api/assistant {userRef: authUserId, channel:'auth'}──►│ (retries with correct ref)
```
