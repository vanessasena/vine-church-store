-- Migration: Create categories table and update items table
-- Run this in your Supabase SQL Editor

-- Step 1: Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert existing categories from items table
INSERT INTO categories (name)
SELECT DISTINCT category
FROM items
WHERE category IS NOT NULL AND category != '';

-- Step 3: Add category_id column to items table
ALTER TABLE items ADD COLUMN category_id UUID REFERENCES categories(id);

-- Step 4: Update items to reference categories
UPDATE items
SET category_id = (
  SELECT id FROM categories WHERE categories.name = items.category
);

-- Step 5: Make category_id NOT NULL after populating
ALTER TABLE items ALTER COLUMN category_id SET NOT NULL;

-- Step 6: Drop the old category text column
ALTER TABLE items DROP COLUMN category;

-- Step 7: Update the index to use category_id instead of category
DROP INDEX IF EXISTS idx_items_category;
CREATE INDEX idx_items_category_id ON items(category_id);

-- Step 8: Enable RLS for categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 9: Create policy for categories table
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Step 10: Update order_items table to store category_id as well
ALTER TABLE order_items ADD COLUMN item_category_id_at_time UUID;

-- Step 11: Populate existing order_items with category_id based on category name
UPDATE order_items
SET item_category_id_at_time = (
  SELECT id FROM categories WHERE categories.name = order_items.item_category_at_time
)
WHERE item_category_at_time IS NOT NULL;

-- Step 12: Remove the redundant item_category_at_time column
ALTER TABLE order_items DROP COLUMN item_category_at_time;

-- Step 13: Remove the item_category_id_at_time column (use current item category instead)
ALTER TABLE order_items DROP COLUMN item_category_id_at_time;