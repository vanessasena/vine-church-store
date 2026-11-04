-- Optional subcategory within an item's category; existing items remain ungrouped.
ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory TEXT;
