-- Add payment_date column to orders table
-- This column stores when an order was actually paid (can differ from created_at)

ALTER TABLE orders ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;

-- Create index for payment_date for better query performance on paid orders
CREATE INDEX idx_orders_payment_date ON orders(payment_date);
