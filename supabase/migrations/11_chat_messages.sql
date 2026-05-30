DROP TABLE IF EXISTS public.chat_migration_log CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;

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
