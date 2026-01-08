# User Orders Permission Implementation

## Summary
This implementation adds user permission tracking to your Vine Church Store system. Users now need `orders_permission` set to `TRUE` in the database to access the system.

## Changes Made

### 1. Database Migration
**File:** `migrations/create_users_table.sql`
- Created new `public.users` table
- Linked to Supabase `auth.users` via foreign key
- Fields:
  - `id` (UUID, primary key, references auth.users)
  - `email` (TEXT, unique)
  - `role` (TEXT, default: 'member')
  - `orders_permission` (BOOLEAN, default: false)
  - `created_at` and `updated_at` (timestamps)
- Added indexes for faster lookups

### 2. Type Definitions
**File:** `lib/types.ts`
- Added new `User` interface with fields for the users table

### 3. Authentication Context
**File:** `app/contexts/AuthContext.tsx`
- Added `hasOrdersPermission` state
- Added `checkOrdersPermission()` function to verify user permissions
- Updated `signIn()` method to:
  - Check if user exists in `users` table
  - Verify `orders_permission` is TRUE
  - Sign out user automatically if permission denied
  - Return permission status to login page
- Updated `signOut()` to clear permission state

### 4. Login Page
**File:** `app/login/page.tsx`
- Updated form submission to handle permission check
- Display error message if user lacks permission

### 5. User Management API
**File:** `pages/api/users.js`
- GET endpoint: Fetch user permissions by email
- POST endpoint: Create new user record
- PUT endpoint: Update user permissions and role

## Implementation Steps

### Step 1: Run the Migration
1. Go to Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `migrations/create_users_table.sql`
5. Click "Run"

### Step 2: Create User Records
For each user who should have access, insert a record:
```sql
INSERT INTO public.users (id, email, role, orders_permission, created_at, updated_at)
VALUES (
  '<auth-user-id>',
  'user@example.com',
  'member',
  true,
  NOW(),
  NOW()
);
```

Or use the API endpoint to create user records programmatically:
```bash
POST /api/users
{
  "user_id": "auth-user-id",
  "email": "user@example.com",
  "role": "member",
  "orders_permission": true
}
```

### Step 3: Test the Login Flow
1. Try logging in with a user that has `orders_permission = false` → Should be denied
2. Try logging in with a user that has `orders_permission = true` → Should be allowed
3. Verify permission is checked even if Supabase authentication succeeds

## API Endpoints

### GET /api/users
Fetch user permissions by email
```
GET /api/users?email=user@example.com

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "member",
  "orders_permission": true,
  "created_at": "2024-01-01T...",
  "updated_at": "2024-01-08T..."
}
```

### POST /api/users
Create a new user record
```
POST /api/users
{
  "user_id": "auth-user-id",
  "email": "user@example.com",
  "role": "member",
  "orders_permission": false
}

Response: Same as GET response
```

### PUT /api/users
Update user permissions/role
```
PUT /api/users
{
  "email": "user@example.com",
  "orders_permission": true,
  "role": "admin"
}

Response: Updated user record
```

## Next Steps (Optional)
1. Add an admin dashboard to manage user permissions
2. Add automatic user record creation when new Supabase users are created
3. Add role-based access control (RBAC) for admin vs member features
4. Add audit logging for permission changes

## Error Messages
- "You do not have permission to access this system. Please contact an administrator." - User's `orders_permission` is false
- "Unable to verify permissions. Please try again." - Error checking database, sign-in will be cancelled

## Security Notes
- Users must have BOTH valid Supabase auth credentials AND `orders_permission = true`
- Users are automatically signed out if permission check fails
- All permission checks are done server-side in AuthContext
