-- Preserve items used in orders while hiding them from item listings.
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
