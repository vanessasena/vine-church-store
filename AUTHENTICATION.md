# Authentication Setup Guide

This guide explains how to set up authentication for the Vine Church Store application using Supabase Auth and Resend for email notifications.

## Prerequisites

1. A Supabase account (free tier works)
2. A Resend account for sending emails (free tier works)
3. Node.js 18+ installed

## Step 1: Database Setup

Run the authentication migration script in your Supabase SQL Editor:

```sql
-- Run this in your Supabase SQL Editor
-- File: database-migration-auth.sql
```

This will:
- Create the `access_requests` table to track user access requests
- Update Row Level Security policies to require authentication
- Set up proper indexes for performance

## Step 2: Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates (optional, but recommended):
   - Go to **Authentication** > **Email Templates**
   - Customize the confirmation email template
   - Customize the password reset email template

4. Get your API keys:
   - Go to **Settings** > **API**
   - Copy your `Project URL` (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - Copy your `anon/public` key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Copy your `service_role` key (this is your `SUPABASE_SERVICE_ROLE_KEY`)
   - ⚠️ **Important**: Keep your service role key secret! Never expose it in client-side code.

## Step 3: Configure Resend

1. Sign up for a Resend account at [resend.com](https://resend.com)
2. Verify your domain (or use the test domain for development)
3. Go to **API Keys** and create a new API key
4. Copy your API key (this is your `RESEND_API_KEY`)

## Step 4: Environment Variables

Create a `.env.local` file in the root of your project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend Configuration
RESEND_API_KEY=your-resend-api-key

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com

# Optional: App URL (used in emails)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Replace the placeholder values with your actual keys.

## Step 5: Email Configuration

### For Development (Using Resend Test Domain)

If you're using Resend's test domain (`onboarding@resend.dev`), emails will only be sent to the email address associated with your Resend account. This is perfect for testing.

### For Production (Using Your Own Domain)

1. In Resend, add and verify your domain
2. Update the `from` address in the API files:
   - `pages/api/access-requests.js` (line ~43)
   - `pages/api/approve-request.js` (lines ~76 and ~115)
   
   Change from:
   ```javascript
   from: 'Vine Church Store <onboarding@resend.dev>',
   ```
   
   To:
   ```javascript
   from: 'Vine Church Store <noreply@yourdomain.com>',
   ```

## Authentication Flow

### 1. Access Request
1. User visits `/request-access`
2. Fills out the form with name, email, and reason
3. System creates an access request in the database
4. Admin receives email notification

### 2. Admin Approval
1. Admin logs in and visits `/admin`
2. Reviews pending access requests
3. Can add notes and approve or reject
4. On approval:
   - User account is created in Supabase Auth
   - Temporary password is generated
   - User receives welcome email with credentials
5. On rejection:
   - User receives rejection email

### 3. User Login
1. Approved user visits `/login`
2. Signs in with email and temporary password
3. Should change password after first login (feature to be added)

### 4. Protected Routes
All main routes (`/`, `/items`, `/orders`, `/reports`, `/admin`) require authentication:
- Unauthenticated users are redirected to `/login`
- Login and request-access pages are public

## First Admin User

Since the admin panel requires authentication, you need to create the first admin user manually:

### Option 1: Using Supabase Dashboard
1. Go to **Authentication** > **Users** in Supabase dashboard
2. Click **Add User**
3. Enter email and password
4. User can now log in and access the admin panel

### Option 2: Using SQL
```sql
-- This will bypass the normal signup flow
-- Run in Supabase SQL Editor after enabling auth
```

Note: After the first admin is created, they can approve other users through the admin panel.

## Security Considerations

1. **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code. It should only be used in API routes.

2. **Row Level Security**: The migration script sets up RLS policies. Make sure they match your security requirements:
   - Authenticated users can manage all data
   - Anonymous users can only read categories and items (needed for the order form)

3. **Email Validation**: Consider adding email domain restrictions if you only want to allow specific email domains.

4. **Password Policy**: Configure password requirements in Supabase:
   - Go to **Authentication** > **Policies**
   - Set minimum password length
   - Consider enabling password strength requirements

## Troubleshooting

### Emails Not Sending
- Check that your Resend API key is correct
- For development, ensure you're using the email address associated with your Resend account
- Check Resend dashboard for email logs and errors

### Users Can't Log In
- Ensure the user account was created successfully (check Supabase Auth > Users)
- Verify the password is correct
- Check browser console for error messages

### Access Requests Not Appearing
- Verify database migration ran successfully
- Check API endpoint is working: `/api/access-requests`
- Look for errors in browser console

### Build Errors
- Ensure all environment variables are set
- Make sure `.env.local` exists (use `.env.example` as template)
- Run `npm install` to ensure all dependencies are installed

## Testing the Flow

1. **Test Access Request**:
   - Visit `/request-access`
   - Fill out the form
   - Check that admin receives email
   - Verify request appears in database

2. **Test Admin Approval**:
   - Log in as admin
   - Go to `/admin`
   - Approve a pending request
   - Verify user receives email with credentials
   - Check user appears in Supabase Auth > Users

3. **Test User Login**:
   - Log out as admin
   - Visit `/login`
   - Sign in with approved user credentials
   - Verify access to protected routes

## Next Steps

Consider implementing:
- Password reset functionality
- Change password on first login
- Email domain whitelist
- Admin role management
- User profile management
- Session timeout configuration
