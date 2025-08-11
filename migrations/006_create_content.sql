-- migrations/006_create_content.sql
-- Content pieces table (user-scoped)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,             -- 'post', 'video', 'idea', etc.
  status TEXT,           -- 'draft', 'scheduled', 'published'
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_user ON public.content_pieces(user_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON public.content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_content_type ON public.content_pieces(type);
