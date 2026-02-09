-- RUN THIS IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/qcmnnfrvujxytcwmnquy/sql/new

-- 1. Add customer_email column to staging_orders
ALTER TABLE staging_orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Add matched column to track matched orders
ALTER TABLE staging_orders ADD COLUMN IF NOT EXISTS matched BOOLEAN DEFAULT FALSE;

-- 3. Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_staging_orders_email ON staging_orders(customer_email);

-- 4. Create index for finding unmatched orders
CREATE INDEX IF NOT EXISTS idx_staging_orders_unmatched ON staging_orders(customer_email, matched) WHERE matched = FALSE;

-- 5. Add brand column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;

-- 6. Add category column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

-- 7. Add category_id if missing (optional but good practice)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID;
