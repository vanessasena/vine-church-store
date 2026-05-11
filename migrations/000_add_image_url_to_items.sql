-- Migration: Add image_url column to items table
-- Date: 2025-11-05
-- Description: Adds support for item images stored in Supabase storage

-- Add image_url column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to the column
COMMENT ON COLUMN items.image_url IS 'URL to the item image stored in Supabase storage (item-images bucket)';
