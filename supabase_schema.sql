-- ── साथी AI — Supabase Schema ──
-- Run this in Supabase Dashboard → SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email            TEXT UNIQUE NOT NULL,
  name             TEXT,
  phone            TEXT,
  dob              TEXT,
  language         TEXT DEFAULT 'hindi',
  user_type        TEXT DEFAULT 'self',
  family_name      TEXT,
  family_phone     TEXT,
  plan             TEXT DEFAULT 'trial',
  plan_paid_at     BIGINT,
  plan_end         BIGINT,
  payment_id       TEXT,
  medicines        JSONB DEFAULT '[]',
  registered_at    BIGINT,
  last_seen        BIGINT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Allow anon key to read/write (for frontend use)
-- WARNING: In production, restrict with RLS per user
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon full access" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
