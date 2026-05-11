-- Add is_active column to items table
-- This allows items to be activated/deactivated
-- Only active items will be shown when creating orders

ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for better query performance when filtering by is_active
CREATE INDEX IF NOT EXISTS idx_items_is_active ON items(is_active);

-- Update existing items to be active by default
UPDATE items SET is_active = TRUE WHERE is_active IS NULL;
