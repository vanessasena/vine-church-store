-- Authentication Migration for Vine Church Store
-- Run this in your Supabase SQL Editor

-- Create access_requests table to track user access requests
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);

-- Enable Row Level Security
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
-- For now, we'll allow all operations since we don't have auth set up yet
CREATE POLICY "Allow all operations on access_requests" ON access_requests FOR ALL USING (true) WITH CHECK (true);

-- Update existing table policies to require authentication
-- First, drop the existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on items" ON items;
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;
DROP POLICY IF EXISTS "Allow all operations on order_items" ON order_items;

-- Create new policies that require authentication
-- For authenticated users, allow all operations
CREATE POLICY "Authenticated users can manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage items" ON items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anonymous access to categories and items for read-only (for the order page)
CREATE POLICY "Anonymous users can read categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous users can read items" ON items FOR SELECT TO anon USING (true);
