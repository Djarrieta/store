DROP TABLE IF EXISTS public.chat_messages CASCADE;

CREATE TABLE public.chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ref   text NOT NULL,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_user_ref_idx ON public.chat_messages (user_ref, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages: no public access"
  ON public.chat_messages FOR ALL USING (false);
