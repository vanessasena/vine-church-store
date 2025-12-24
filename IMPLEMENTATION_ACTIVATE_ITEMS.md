# Feature Implementation: Activate/Deactivate Items

## Overview
This feature allows cafeteria managers to activate or deactivate items from the Items Management page. When creating or editing orders, only active items are displayed, enabling daily control over item availability.

## Problem Statement
The cafeteria needed a way to manage which items are available on any given day without permanently deleting items from the system. This allows for:
- Seasonal items that are not always available
- Items that are temporarily out of stock
- Daily menu management without data loss

## Solution
Added an `is_active` boolean field to items with a toggle button in the Items Management page. The Orders page was updated to filter and show only active items.

## Technical Changes

### 1. Database Schema (`database-setup.sql` & `migrations/add_is_active_to_items.sql`)
- Added `is_active BOOLEAN DEFAULT TRUE` column to items table
- Created index on `is_active` for query performance
- Existing items default to active status

### 2. TypeScript Types (`lib/types.ts`)
- Added `is_active: boolean` to the Item interface

### 3. API Routes (`pages/api/items.js`)
- **POST**: New items default to `is_active: true` if not specified
- **PUT**: Preserves `is_active` status when updating other fields
- **PUT**: Allows explicit `is_active` updates via toggle functionality

### 4. Items Management Page (`app/items/page.tsx`)
- Added "Status" column showing Active (green) or Inactive (gray) badges
- Added toggle button that changes between "Activate" and "Deactivate"
- Preserves `is_active` status when editing items through the form
- Shows all items regardless of status (for full management view)

### 5. Orders Page (`app/orders/page.tsx`)
- Modified `getFilteredItems()` to filter by `item.is_active === true`
- Only active items appear when creating new orders
- Only active items appear when editing existing orders
- Category filter works in conjunction with active status filter

## User Interface

### Items Management Page
```
┌─────────────────────────────────────────────────────────┐
│ Items List                                              │
├────────┬──────┬──────────┬───────┬──────────┬──────────┤
│ Image  │ Name │ Category │ Price │ Status   │ Actions  │
├────────┼──────┼──────────┼───────┼──────────┼──────────┤
│ [img]  │Coffee│ Beverage │ $2.50 │ ●Active  │[Deactivate]│
│ [img]  │Tea   │ Beverage │ $2.00 │ ○Inactive│[Activate]  │
└────────┴──────┴──────────┴───────┴──────────┴──────────┘
```

### Orders Page - Available Items
Only shows items with green "Active" status:
- Coffee ✓ (shown)
- Tea ✗ (hidden - inactive)

## Implementation Details

### Default Behavior
- **New items**: Active by default
- **Existing items**: Active by default after migration
- **Edit form**: Preserves current status
- **Toggle button**: Explicitly changes status

### Filter Logic
```typescript
const getFilteredItems = () => {
  // Filter to show only active items
  let filtered = items.filter(item => item.is_active);
  
  if (selectedCategory) {
    filtered = filtered.filter(item => item.category?.name === selectedCategory);
  }
  
  return filtered;
};
```

### Toggle Implementation
```typescript
const toggleActive = async (id: string, currentStatus: boolean) => {
  await fetch('/api/items', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, is_active: !currentStatus }),
  });
  fetchItems();
};
```

## Testing

See `TESTING_ACTIVATE_ITEMS.md` for comprehensive test scenarios.

### Quick Test
1. Navigate to Items Management page
2. Deactivate an item (e.g., "Tea")
3. Navigate to Orders page
4. Click "+ New Order"
5. Verify "Tea" does not appear in available items
6. Return to Items page and activate "Tea"
7. Verify "Tea" now appears in new order form

## Files Changed
- `database-setup.sql` - Added is_active column
- `migrations/add_is_active_to_items.sql` - Migration script
- `lib/types.ts` - Updated Item interface
- `pages/api/items.js` - Handle is_active in CRUD operations
- `app/items/page.tsx` - Added toggle UI and status display
- `app/orders/page.tsx` - Filter active items only

## Security
- No security vulnerabilities introduced (verified with CodeQL)
- Standard API authorization patterns maintained
- No additional data exposure

## Performance
- Added index on `is_active` column for efficient filtering
- No N+1 query issues
- Minimal impact on existing queries

## Future Enhancements
Potential improvements for future iterations:
- Bulk activate/deactivate operations
- Schedule-based activation (e.g., activate on specific days)
- Activation history/audit log
- Quick filter to show only active or inactive items in Items Management page
- Visual indication in Items page when viewing filtered items

## Migration Instructions

For existing installations:
1. Execute `migrations/add_is_active_to_items.sql` in Supabase SQL Editor
2. Deploy updated application code
3. No additional configuration needed

For new installations:
- The updated `database-setup.sql` includes the `is_active` column
