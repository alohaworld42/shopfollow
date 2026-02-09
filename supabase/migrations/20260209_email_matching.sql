-- Migration: Add email-based order matching + missing columns
-- Run this in your Supabase SQL Editor

-- ============================================
-- STAGING ORDERS TABLE
-- ============================================

-- Add customer_email column to store the email from WooCommerce/Shopify orders
ALTER TABLE staging_orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add matched boolean to track if order has been linked to a user
ALTER TABLE staging_orders ADD COLUMN IF NOT EXISTS matched BOOLEAN DEFAULT FALSE;

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_staging_orders_email ON staging_orders(customer_email);

-- Create index for finding unmatched orders
CREATE INDEX IF NOT EXISTS idx_staging_orders_unmatched ON staging_orders(customer_email, matched) WHERE matched = FALSE;

-- ============================================
-- PRODUCTS TABLE - Add missing columns
-- ============================================

-- Add brand column (used in search and feed)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;

-- Add category column if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Allow users to read their own staging orders
DROP POLICY IF EXISTS "Users can read own staging orders" ON staging_orders;
CREATE POLICY "Users can read own staging orders" ON staging_orders
    FOR SELECT USING (auth.uid()::text = user_id);

-- Allow service role to insert orders (from webhooks)
DROP POLICY IF EXISTS "Service role can insert staging orders" ON staging_orders;
CREATE POLICY "Service role can insert staging orders" ON staging_orders
    FOR INSERT WITH CHECK (true);

-- Allow service role to update orders (for matching)
DROP POLICY IF EXISTS "Service role can update staging orders" ON staging_orders;
CREATE POLICY "Service role can update staging orders" ON staging_orders
    FOR UPDATE USING (true);

-- ============================================
-- DONE - Verify columns exist
-- ============================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'staging_orders';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'products';
