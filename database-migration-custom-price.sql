-- Migration: Add has_custom_price column to items table
-- Run this in your Supabase SQL Editor if your items table already exists

-- Add has_custom_price column (default false for existing items)
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_custom_price BOOLEAN DEFAULT FALSE;

-- Make price column nullable (since items with custom price won't have a preset price)
ALTER TABLE items ALTER COLUMN price DROP NOT NULL;
