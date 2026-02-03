-- Create table for storing Web Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- User ID (can be null for anonymous, but usually authenticated)
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own subscription" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscription" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can view all subscriptions" ON push_subscriptions
  FOR SELECT USING (true); -- Service role bypasses RLS anyway, but good for explicit intent if needed

-- Index for fast lookup by user
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
-- Index for endpoint (to prevent duplicates efficiently)
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
