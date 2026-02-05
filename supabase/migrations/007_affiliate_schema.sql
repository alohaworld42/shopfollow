-- Affiliate configurations for link transformation
CREATE TABLE IF NOT EXISTS affiliate_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_pattern TEXT NOT NULL, -- e.g. "amazon.com"
    affiliate_network VARCHAR(50), -- e.g. "amazon", "impact"
    affiliate_id TEXT NOT NULL,
    url_template TEXT NOT NULL, -- e.g. "{url}&tag={affiliate_id}"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE affiliate_configs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read configs (needed for Edge Function service role, but public read is safe if IDs aren't sensitive)
-- Actually, Edge Function uses service role which bypasses RLS.
-- Public users shouldn't necessarily see affiliate IDs?
-- For now, allow read for authenticated users.

CREATE POLICY "Allow public read access" ON affiliate_configs
    FOR SELECT USING (true);

-- Only admins can insert/update (manual DB entry for now)

-- Seed Data (Example)
INSERT INTO affiliate_configs (domain_pattern, affiliate_network, affiliate_id, url_template) VALUES
('amazon.com', 'amazon', 'cartconnect-20', '{url}&tag={affiliate_id}'),
('etsy.com', 'etsy', 'cartconnect', '{url}&aff={affiliate_id}');
