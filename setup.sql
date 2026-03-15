-- Supabase SQL Editor で実行してください

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES users(id) NOT NULL,
  target_id UUID REFERENCES users(id) NOT NULL,
  rudeness INT CHECK (rudeness BETWEEN 1 AND 10),
  self_conscious INT CHECK (self_conscious BETWEEN 1 AND 10),
  childish INT CHECK (childish BETWEEN 1 AND 10),
  random_talk INT CHECK (random_talk BETWEEN 1 AND 10),
  behavior INT CHECK (behavior BETWEEN 1 AND 10),
  useless_kindness INT CHECK (useless_kindness BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rater_id, target_id)
);
