---
applyTo: "src/app/chat/**,src/lib/assistant/**,src/app/components/ChatMigration.tsx,src/app/api/assistant/**"
---

## Chat Conversation User Flows

### Identity Model

| State | Identity (`user_ref`) | Channel | Storage |
|-------|----------------------|---------|---------|
| Web guest (first visit) | Client-generated UUID | `web_guest` | Cookie `guest_chat_id` (30 days) |
| WhatsApp guest (first message) | Bot-generated UUID keyed by phone | `whatsapp` | Bot's internal state |
| Authenticated (any channel) | Supabase `auth.users.id` | `auth` | Server session |

### Entry Points

| Channel | Entry | API |
|---------|-------|-----|
| Web UI | `/chat` page → `ChatWidget` → server action `sendMessage()` | Direct server action call |
| WhatsApp | External bot → `POST /api/assistant` with shared secret | REST API (`x-assistant-secret` header) |

---

## Web UI Flows

### Flow 1: First-time web visitor opens chat

1. `/chat` page: `getUser()` → `null`, no `guest_chat_id` cookie → `initialMessages = []`.
2. Widget shows welcome message, empty history.
3. On first submit, `ChatWidget.getOrCreateGuestId()` generates `crypto.randomUUID()` and sets cookie (30 days).
4. Server action `sendMessage(text, cart, guestId)`:
   - Validates UUID format.
   - Calls `user_exists(guestId)` RPC to prevent impersonation of real auth users.
   - Sets `userRef = guestId`, `channel = "web_guest"`.
5. Builds prompt (empty history), generates LLM response.
6. Stores both messages: `user_ref = guestId`, `channel = 'web_guest'`.

**Result:** Guest conversation tied to UUID in browser cookie.

---

### Flow 2: Returning web visitor continues conversation

1. `/chat` page reads `guest_chat_id` cookie → existing UUID.
2. `getHistory(guestId)` retrieves previous messages (last 20, or latest summary + messages after it).
3. Widget renders with existing history.
4. New messages use same UUID. Context preserved.
5. When messages since last summary ≥ 20, `summarizeIfNeeded()` creates a summary row via LLM.

**Result:** Seamless continuation. Automatic summarization keeps context window bounded.

---

### Flow 3: Web guest with history logs in for the first time

1. Auth callback completes → user has session.
2. Root layout renders `<ChatMigration isAuthenticated={true} />`.
3. Component reads `guest_chat_id` cookie → calls `migrateGuestChat(guestId)`.
4. `migrateChatSession(guestRef, authUserId)`:
   - If auth user already has a summary → deletes guest's summary rows (avoids duplicates).
   - Updates ALL guest messages: `user_ref = authUserId`, `channel = 'auth'`.
   - Inserts into `chat_migration_log` (unique on `guest_ref`).
5. Client deletes `guest_chat_id` cookie on success.
6. Future `/chat` loads use `auth.users.id` → full unified history.

**Result:** All guest history merged into authenticated identity. Migration is idempotent.

---

### Flow 4: Auth user chats without session, then logs in

Scenario: session expired, incognito, or logged out.

1. Without session → `getUser()` returns `null` → new `guest_chat_id` cookie generated.
2. Messages stored with new guest UUID, `channel = 'web_guest'`.
3. On login → same migration as Flow 3 triggers:
   - Guest messages moved to auth user's `user_ref`.
   - Merged chronologically with existing auth history.
   - Guest summary deleted if auth user already has one.
4. Cookie deleted.

**Result:** Unauthenticated conversation merged into existing authenticated history. Order tools (blocked for guests) become available.

---

## WhatsApp Flows

### Flow 5: First-time WhatsApp user sends a message

1. User sends a message to the store's WhatsApp number.
2. The external WhatsApp bot generates a UUID for this phone number and stores it in its own state (keyed by phone).
3. Bot calls `POST /api/assistant` with `{ message, userRef: <bot-uuid>, channel: "whatsapp" }` and the shared `x-assistant-secret` header.
4. API route authenticates the secret, then checks `chat_migration_log` for this `userRef` — not found (first time).
5. Builds prompt (empty history), generates LLM response.
6. Stores both messages: `user_ref = bot-uuid`, `channel = 'whatsapp'`.
7. Returns `{ response }` to the bot → bot sends it back to the user via WhatsApp.

**Result:** Guest conversation stored in DB under bot-generated UUID with `channel = 'whatsapp'`.

---

### Flow 6: Returning WhatsApp user continues conversation

1. User sends another message via WhatsApp.
2. Bot looks up existing UUID for this phone number in its state.
3. Bot calls `POST /api/assistant` with the same `userRef`.
4. API route checks `chat_migration_log` → not found → proceeds normally.
5. `buildPrompt` calls `getHistory(userRef)` → retrieves existing conversation history (with summarization).
6. Generates response with full context, stores messages, returns to bot.

**Result:** Conversation continuity across WhatsApp sessions. Same summarization logic applies (every 20 messages).

---

### Flow 7: WhatsApp user links to a web account (migration via login link)

This flow is triggered when the bot sends a login link to the user (e.g., for placing an order that requires authentication).

1. Bot sends user a link: `https://store.example/login?wa_ref=<bot-uuid>`.
2. User clicks the link → `/login` page renders `LoginActions` component.
3. `LoginActions` reads `wa_ref` from URL search params.
4. Before triggering OAuth redirect, calls server action `setWaRefCookie(waRef)`:
   - Sets an **HttpOnly** cookie `wa_ref` with value = bot UUID, `maxAge = 600` (10 min), `path = /auth`.
5. OAuth flow proceeds → Google login → redirects to `/auth/callback`.
6. Auth callback route (`/auth/callback/route.ts`):
   - Exchanges code for session.
   - Upserts user profile.
   - **Reads `wa_ref` cookie** → finds the bot UUID.
   - Calls `migrateChatSession(waRef, user.id)`:
     - Guest WhatsApp messages moved: `user_ref = authUserId`, `channel = 'auth'`.
     - `chat_migration_log` records `{ guest_ref: waRef, auth_user_id: user.id, channel: 'web_guest' }`.
   - Deletes the `wa_ref` cookie.
7. Redirects user to the store.

**Result:** All WhatsApp conversation history is now under the authenticated user. Migration recorded for lazy linkage.

---

### Flow 8: WhatsApp message after migration (lazy linkage)

After the user has migrated (Flow 7), the bot still has the old UUID in its state.

1. User sends a new WhatsApp message.
2. Bot calls `POST /api/assistant` with the **old** `userRef` (bot hasn't updated yet).
3. API route checks `chat_migration_log` for `guest_ref = oldUserRef`:
   - **Finds entry** → returns `{ migrated: true, authUserId: "<auth-user-id>" }`.
   - Does NOT process the message.
4. Bot receives the migration signal:
   - Updates its internal mapping: phone → `authUserId`.
   - Re-sends the message with `{ userRef: authUserId, channel: "auth" }`.
5. API route processes normally with the authenticated `userRef`.

**Result:** Bot self-heals its mapping on first post-migration message. No message is lost — bot retries with correct identity.

---

### Flow 9: WhatsApp user who already has a web account (both channels active)

Scenario: User already chats via web (authenticated) and then contacts via WhatsApp for the first time.

1. Bot generates a new UUID for the phone (doesn't know about web account).
2. Messages stored with `channel = 'whatsapp'`, separate `user_ref`.
3. These are **separate histories** until the user triggers Flow 7 (login link from WhatsApp).
4. After migration, both histories merge under the same `auth.users.id`.

**Result:** Until explicitly linked, WhatsApp and web are separate conversations. Migration unifies them.

---

## Shared Behaviors (All Channels)

### Summarization

- Triggered after every `addMessage()` call.
- Counts messages since last summary (or all time).
- If count ≥ 20 (`SUMMARY_THRESHOLD`): LLM generates a ~150 word summary in Spanish.
- Summary stored as `role = 'summary'`.
- `getHistory()` returns `[latest summary + messages after it]` instead of raw last 20.

### Guest Capabilities (web_guest & whatsapp)

- Can ask questions about products, prices, availability.
- Can get recommendations.
- **Cannot place orders** — order tools are blocked in `mcpService.ts` for non-`auth` channels.
- Prompted to log in when attempting order-related actions.

### Migration Rules

- `migrateChatSession()` is used by **both** web and WhatsApp flows.
- If auth user already has a summary → guest's summary rows are deleted (auth summary takes precedence).
- All guest messages are re-attributed: `user_ref = authUserId`, `channel = 'auth'`.
- `chat_migration_log` unique index on `guest_ref` → migration is idempotent (second call is a no-op insert).

---

## Key Constraints

- **Guests cannot place orders** — order tools blocked for `web_guest`/`whatsapp` channels in `mcpService.ts`.
- **Guest ID validation (web only)** — `user_exists()` RPC prevents guest UUID collision with real users.
- **Migration is one-time per guest** — unique index on `chat_migration_log.guest_ref`.
- **Cookie expiry: `guest_chat_id` = 30 days** — messages remain in DB even if cookie expires (orphaned unless migration happens).
- **Cookie expiry: `wa_ref` = 10 minutes** — short-lived, only survives the OAuth redirect.
- **RLS: `USING (false)`** — all `chat_messages` access goes through service client only.
- **Summarization threshold = 20 messages** — every 20 messages since last summary triggers LLM summarization.
- **`ChatMigration` component is in root layout** — ensures web guest migration triggers on ANY page load after login, not just `/chat`.
- **WhatsApp bot authenticates via `x-assistant-secret`** — no public access to `/api/assistant`.
- **Lazy linkage is transparent to the user** — bot handles the re-mapping internally, user sees no interruption.
