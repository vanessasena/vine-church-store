# Testing Guide: Activate/Deactivate Items Feature

This document describes how to test the new activate/deactivate items feature.

## Database Setup

Before testing, run the migration to add the `is_active` column to your database:

```sql
-- Execute in your Supabase SQL Editor
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_items_is_active ON items(is_active);
UPDATE items SET is_active = TRUE WHERE is_active IS NULL;
```

Or use the migration file: `migrations/add_is_active_to_items.sql`

## Test Scenarios

### 1. Items Management Page

#### Test: New Items are Active by Default
1. Navigate to `/items`
2. Create a new item (e.g., "Coffee")
3. Verify the new item shows "Active" status in green badge
4. Verify the button shows "Deactivate"

#### Test: Toggle Item Status
1. Find an active item in the list
2. Click the "Deactivate" button
3. Verify the status changes to "Inactive" (gray badge)
4. Verify the button changes to "Activate"
5. Click "Activate" again
6. Verify the status returns to "Active" (green badge)

#### Test: Edit Item Preserves Status
1. Deactivate an item
2. Click "Edit" on that item
3. Change the item name or price
4. Submit the form
5. Verify the item remains "Inactive" after editing

### 2. Orders Page - Create New Order

#### Test: Only Active Items are Shown
1. Make sure you have both active and inactive items in the database
2. Navigate to `/orders`
3. Click "+ New Order"
4. Enter a customer name
5. Verify that only **active** items appear in the "Available Items" grid
6. Verify that inactive items are **not** shown

#### Test: Category Filter with Active Items
1. In the new order form, apply a category filter
2. Verify only active items in that category are shown
3. Inactive items in that category should not appear

### 3. Orders Page - Edit Order

#### Test: Only Active Items in Edit Modal
1. Create or find an existing unpaid order
2. Click "Edit" on the order
3. Verify that only active items appear in the "Available Items" section
4. Verify inactive items cannot be added to the order

### 4. Visual Verification

#### Expected UI Elements

**Items Page:**
- Status column showing "Active" (green) or "Inactive" (gray) badges
- Action buttons showing "Deactivate" (gray) or "Activate" (green)
- All items visible regardless of status

**Orders Page:**
- Available items grid only shows active items
- No visual indicator needed (inactive items simply don't appear)

## Expected Behavior Summary

1. **New items**: Default to active status
2. **Items page**: Shows all items with status badges and toggle buttons
3. **Orders page**: Filters to show only active items when creating/editing orders
4. **Edit items**: Preserves the current active/inactive status
5. **Database**: Uses `is_active` boolean column with default TRUE

## Common Issues

If items are not filtering correctly:
1. Verify the database migration has been applied
2. Check that the `is_active` column exists in the items table
3. Ensure existing items have `is_active = true` set
4. Clear browser cache and refresh the page
