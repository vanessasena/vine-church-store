# Authentication System Overview

This document provides a high-level overview of the authentication system implemented for Vine Church Store.

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Request Access Form        │
│  (/request-access)          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Access Request API         │
│  (POST /api/access-requests)│
└──────┬──────────────────────┘
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
┌─────────────────┐          ┌──────────────┐
│  Database       │          │  Resend API  │
│  access_requests│          │  (Email)     │
└─────────────────┘          └──────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │ Admin Email   │
                            └───────┬───────┘
                                    │
                                    ▼
┌─────────────────────────────────────────┐
│  Admin Panel (/admin)                   │
│  - View pending requests                │
│  - Approve/Reject with notes            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Approve Request API                │
│  (POST /api/approve-request)        │
└──────┬──────────────────────────────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐   ┌─────────────┐   ┌──────────────┐
│ Supabase Auth│   │  Database   │   │  Resend API  │
│ (Create User)│   │  (Update)   │   │  (Email)     │
└──────────────┘   └─────────────┘   └──────┬───────┘
                                             │
                                             ▼
                                     ┌───────────────┐
                                     │ User Email    │
                                     │ (Credentials) │
                                     └───────┬───────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────┐
│  Login Page (/login)                            │
│  - Email/Password authentication                │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Authenticated Session                          │
│  - Access to all protected routes               │
│  - Header shows user email & sign out button    │
└─────────────────────────────────────────────────┘
```

## User Flows

### New User Onboarding Flow

1. **User visits the app** → Redirected to `/login` (not authenticated)
2. **User clicks "Request Access"** → Goes to `/request-access`
3. **User fills form**:
   - Full Name
   - Email Address
   - Reason for Access (optional)
4. **User submits** → Request created in database
5. **Admin receives email** → Notification of new request
6. **Admin logs in** → Goes to `/admin`
7. **Admin reviews request**:
   - Can add notes
   - Approves or rejects
8. **On Approval**:
   - User account created in Supabase Auth
   - Temporary password generated
   - User receives welcome email with credentials
9. **User logs in** → Can access all protected routes

### Existing User Login Flow

1. **User visits the app** → Redirected to `/login`
2. **User enters credentials**:
   - Email
   - Password
3. **User clicks "Sign In"** → Authentication via Supabase Auth
4. **On success** → Redirected to home page
5. **User can access**:
   - Home (/)
   - Items Management (/items)
   - Orders Management (/orders)
   - Reports (/reports)
   - Admin Panel (/admin)

### Admin Access Request Review Flow

1. **Admin receives email** → Notification of new request
2. **Admin logs in** → Goes to `/admin`
3. **Admin sees**:
   - Pending Requests section (with count)
   - Reviewed Requests section
4. **For each pending request, admin sees**:
   - Full Name
   - Email
   - Request Date
   - Reason for Access
5. **Admin can**:
   - Add admin notes
   - Approve → Creates user & sends welcome email
   - Reject → Sends rejection email

## API Endpoints

### Public Endpoints (No Auth Required)

- `POST /api/access-requests` - Submit access request
- All pages under `/login` and `/request-access`

### Protected Endpoints (Auth Required)

- `GET /api/access-requests` - List all requests (admin only)
- `POST /api/approve-request` - Approve/reject request (admin only)
- `GET /api/items` - Get items (via protected route)
- `POST /api/items` - Create item (via protected route)
- `GET /api/orders` - Get orders (via protected route)
- `POST /api/orders` - Create order (via protected route)
- `GET /api/reports` - Get reports (via protected route)
- `GET /api/categories` - Get categories (via protected route)

## Database Schema

### access_requests Table

```sql
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);
```

### Row Level Security Policies

All main tables (categories, items, orders, order_items) require authentication:

```sql
-- Authenticated users can manage all data
CREATE POLICY "Authenticated users can manage ..." 
  ON table_name FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

-- Anonymous users can read (for public-facing features if needed)
CREATE POLICY "Anonymous users can read ..." 
  ON table_name FOR SELECT TO anon 
  USING (true);
```

## Email Templates

### Admin Notification Email

**Sent to**: Admin (configured in `ADMIN_EMAIL` env var)
**Sent when**: User submits access request
**Contains**:
- Requester's name
- Requester's email
- Reason for access
- Request timestamp
- Link to admin panel (future enhancement)

### User Approval Email

**Sent to**: User
**Sent when**: Admin approves access request
**Contains**:
- Welcome message
- Login credentials (email + temporary password)
- Link to login page
- Reminder to change password on first login

### User Rejection Email

**Sent to**: User
**Sent when**: Admin rejects access request
**Contains**:
- Rejection notification
- Admin notes (if provided)
- Contact information for support

## Security Considerations

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Public (safe in client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public (safe in client)
- `SUPABASE_SERVICE_ROLE_KEY` - **SECRET** (server-side only)
- `RESEND_API_KEY` - **SECRET** (server-side only)
- `ADMIN_EMAIL` - Not secret but should be valid

### Authentication Flow Security

1. **Password Generation**: Random 12-character passwords with mixed case, numbers, and symbols
2. **Email Verification**: Supabase Auth email_confirm set to true
3. **Session Management**: Handled by Supabase Auth
4. **Protected Routes**: Client-side and server-side protection via RLS policies

### Best Practices Implemented

- Service role key never exposed to client
- All API routes validate request data
- Database uses UUID for all IDs
- Timestamps for audit trail
- Row Level Security enabled on all tables
- HTTPS required for production (enforced by Supabase)

## Components & Files

### React Components

- `app/contexts/AuthContext.tsx` - Authentication context provider
- `app/components/ProtectedRoute.tsx` - Route protection wrapper
- `app/components/Header.tsx` - Navigation with auth status
- `app/login/page.tsx` - Login page
- `app/request-access/page.tsx` - Access request form
- `app/admin/page.tsx` - Admin panel

### API Routes

- `pages/api/access-requests.js` - Handle access requests
- `pages/api/approve-request.js` - Handle approvals/rejections

### Utilities

- `lib/supabase.ts` - Public Supabase client
- `lib/supabase-admin.ts` - Admin Supabase client
- `lib/resend.ts` - Email client
- `lib/types.ts` - TypeScript types

## Future Enhancements

Potential improvements to consider:

1. **Password Reset Flow**
   - Self-service password reset
   - Email verification for reset

2. **User Profile Management**
   - Change password
   - Update profile information

3. **Role-Based Access Control**
   - Admin vs regular user roles
   - Permission-based feature access

4. **Enhanced Admin Features**
   - User management (view all users)
   - Revoke access
   - Audit log

5. **Security Improvements**
   - Two-factor authentication
   - Session timeout
   - Failed login attempt tracking

6. **Email Enhancements**
   - Custom email templates
   - Email branding
   - Email verification for new users

7. **Monitoring & Analytics**
   - Track login attempts
   - User activity logs
   - Access request analytics
