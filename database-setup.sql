-- Vine Church Cafeteria Management Database Setup
-- Run this in your Supabase SQL Editor

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  price DECIMAL(10, 2),
  has_custom_price BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  payment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table (junction table for orders and items)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10, 2) NOT NULL,
  item_name_at_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_categories_name ON categories(name);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Insert sample categories
INSERT INTO categories (name) VALUES
  ('Beverages'),
  ('Snacks'),
  ('Lunch'),
  ('Breakfast'),
  ('Desserts');

-- Migration: Add payment_type column to existing orders table
-- Run this if your orders table already exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_type TEXT;
