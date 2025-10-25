# Vine Church Store - Cafeteria Management App

A modern cafeteria management system built for Vine Church to manage items and orders efficiently.

## Features

- **Authentication**: Secure user authentication with access request workflow
- **Items Management**: Register items with categories and prices
- **Orders Management**: Record customer orders and track total costs
- **Payment Tracking**: Mark orders as paid or unpaid
- **Admin Panel**: Review and approve user access requests
- **Real-time Updates**: Live data synchronization with Supabase

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Authentication**: Supabase Auth with custom access request flow
- **Email**: Resend API for notifications
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (via Supabase)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)
- A Resend account for email notifications (free tier works fine)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vanessasena/vine-church-store.git
cd vine-church-store
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=your-resend-api-key
ADMIN_EMAIL=admin@vinechurch.com
```

> **Note**: For detailed authentication setup instructions, see [AUTHENTICATION.md](AUTHENTICATION.md)

4. Set up the database:

**For new installations:**
1. Run the SQL in `database-setup.sql` in your Supabase SQL editor
2. Run the SQL in `database-migration-auth.sql` to set up authentication tables and policies

**For existing installations (migration required):**
1. First run the migration script `database-migration-category-table.sql` in your Supabase SQL editor
2. Then run `database-migration-auth.sql` to add authentication

The auth migration script will:
- Create an `access_requests` table for managing user access requests
- Update Row Level Security policies to require authentication
- Set up proper indexes for performance

5. Create the first admin user:

Since all routes require authentication, you need to create the first admin user manually in Supabase:
- Go to **Authentication** > **Users** in Supabase dashboard
- Click **Add User** and enter email/password
- This user can then approve other users through the `/admin` panel

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vine-church-store/
├── app/
│   ├── admin/            # Admin panel for access requests
│   ├── items/            # Items management page
│   ├── orders/           # Orders management page
│   ├── reports/          # Sales reports page
│   ├── login/            # Login page
│   ├── request-access/   # Access request form
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts (Auth, Banner)
│   └── page.tsx          # Home page
├── pages/api/
│   ├── access-requests.js  # Access request API
│   ├── approve-request.js  # Approval API
│   ├── categories.js       # Categories API
│   ├── items.js            # Items API
│   ├── orders.js           # Orders API
│   └── reports.js          # Reports API
├── lib/
│   ├── supabase.ts         # Supabase client (public)
│   ├── supabase-admin.ts   # Supabase admin client (server-only)
│   ├── resend.ts           # Resend email client
│   └── types.ts            # TypeScript type definitions
└── public/                 # Static assets
```

## API Endpoints

### Authentication APIs

#### Access Requests API (`/api/access-requests`)

- `GET` - Fetch all access requests (for admin panel)
- `POST` - Create a new access request

#### Approve Request API (`/api/approve-request`)

- `POST` - Approve or reject an access request (creates user account on approval)

### Categories API (`/api/categories`)

- `GET` - Fetch all categories
- `POST` - Create a new category
- `PUT` - Update a category
- `DELETE` - Delete a category (only if not used by any items)

### Items API (`/api/items`)

- `GET` - Fetch all items with category information
- `POST` - Create a new item (requires category_id)
- `PUT` - Update an item
- `DELETE` - Delete an item

### Orders API (`/api/orders`)

- `GET` - Fetch all orders with items and category information
- `POST` - Create a new order
- `PUT` - Update order payment status
- `DELETE` - Delete an order

### Reports API (`/api/reports`)

- `GET` - Generate sales reports with optional month/year filtering

## Usage

### Authentication Flow

1. **Request Access**: New users visit `/request-access` to submit an access request
2. **Admin Review**: Admins receive an email and can review requests at `/admin`
3. **User Login**: Approved users receive credentials via email and can log in at `/login`
4. **Access Protected Pages**: Authenticated users can access all management pages

### Managing Items

1. Navigate to "Items Management" from the home page
2. Fill in the item form with name, category, and price
3. Click "Add Item" to create the item
4. Edit or delete items from the items list

### Managing Orders

1. Navigate to "Orders Management" from the home page
2. Click "+ New Order" to create an order
3. Enter customer name
4. Add items to cart by clicking on available items
5. Adjust quantities as needed
6. Click "Create Order" to submit
7. Mark orders as paid/unpaid from the order history

## Environment Banner

The application includes an environment banner to help identify development and staging environments:

- **Development Environment**: Yellow banner with 🚧 icon
- **Staging Environment**: Orange banner with 🔧 icon
- **Production Environment**: No banner displayed

### Configuration

Set the environment using the `NEXT_PUBLIC_APP_ENV` variable:

```bash
# .env.local
NEXT_PUBLIC_APP_ENV=staging
```

Or use the predefined scripts:

```bash
# Run in staging mode
npm run dev:staging

# Build for staging
npm run build:staging
```

The banner can be dismissed by clicking the × button and will automatically detect:
- Development mode (`NODE_ENV=development`)
- Staging environments (Vercel, Netlify, or custom staging domains)
- Production environments (automatically hidden)

## Building for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
