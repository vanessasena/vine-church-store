# Vine Church Store - AI Coding Assistant Instructions

## Overview
This is a Next.js 15 cafeteria management system for Vine Church using App Router, Supabase, and TypeScript. The application manages items and customer orders with real-time synchronization.

## Architecture
- **Frontend**: Next.js 15 App Router with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes (pages/api/) with Supabase integration
- **Database**: PostgreSQL via Supabase (3 tables: items, orders, order_items)
- **Styling**: Tailwind CSS 4 with gradient backgrounds and card layouts

## Data Model
```typescript
// Core entities in lib/types.ts
Item: { id, name, category, price, created_at }
Order: { id, customer_name, total_cost, is_paid, created_at, order_items[] }
OrderItem: { id, order_id, item_id, quantity, price_at_time, item_name_at_time }
```

## Key Patterns

### API Routes Structure
- **RESTful endpoints**: `/api/items` and `/api/orders` handle CRUD operations
- **Method switching**: Use `req.method` for GET/POST/PUT/DELETE in single handler
- **Supabase queries**: Always use `.select()`, `.insert()`, `.update()`, `.delete()` with error handling
- **Nested data**: Orders fetch with `order_items(*, items(*))` for complete relationship data

### Frontend Patterns
- **Client components**: All pages use `'use client'` for interactivity
- **State management**: Local useState with useEffect for data fetching
- **Form handling**: Controlled inputs with validation and optimistic updates
- **Navigation**: Simple anchor tags (`<a href="/route">`) instead of Next.js Link

### UI Conventions
- **Card layouts**: White backgrounds with `rounded-lg shadow-md p-6`
- **Color scheme**: Blue/purple gradients, green for actions, red for delete
- **Grid layouts**: Responsive grids using `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Form styling**: Consistent input classes with focus states

## Development Workflow

### Database Changes
1. Update SQL schema in `database-setup.sql`
2. Run SQL in Supabase dashboard
3. Update TypeScript types in `lib/types.ts`
4. Modify API routes for new fields
5. Update frontend components

### Adding Features
- New pages go in `app/[route]/page.tsx`
- API endpoints in `pages/api/[endpoint].js`
- Shared types in `lib/types.ts`
- Supabase client is pre-configured in `lib/supabase.ts`

### Environment Setup
Required: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Critical Implementation Details

### Order Creation Flow
Orders must create both order record AND order_items in transaction-like pattern:
1. Calculate total_cost from cart items
2. Insert order with customer_name, total_cost, is_paid: false
3. Map cart to order_items with price_at_time and item_name_at_time snapshots
4. Return complete order with nested order_items and items data

### Supabase Query Patterns
- **Fetch with relations**: `select('*, order_items(*, items(*))')`
- **Error handling**: Always check `error` before using `data`
- **Ordering**: Use `order('created_at', { ascending: false })` for recent-first

### State Management
- Fetch data in useEffect on component mount
- Re-fetch after mutations (create/update/delete)
- Use loading states during async operations
- Form reset after successful submission

## Testing & Debugging
- Run `npm run dev` for development server
- Check Supabase dashboard for database state
- Use browser dev tools for API response debugging
- No formal test suite - manual testing via UI