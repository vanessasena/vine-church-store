# Vine Church Store - Cafeteria Management App

A modern cafeteria management system built for Vine Church to manage items and orders efficiently.

## Features

- **Items Management**: Register items with categories and prices
- **Orders Management**: Record customer orders and track total costs
- **Payment Tracking**: Mark orders as paid or unpaid
- **Real-time Updates**: Live data synchronization with Supabase

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (via Supabase)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)

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

Edit `.env` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the database:

**For new installations:**
Run the SQL in `database-setup.sql` in your Supabase SQL editor.

**For existing installations (migration required):**
1. First run the migration script `database-migration-category-table.sql` in your Supabase SQL editor
2. This will migrate your existing data from the old `items.category` text field to the new `categories` table structure

The migration script will:
- Create a new `categories` table with `id` and `name` fields
- Extract existing categories from your items and populate the categories table
- Add `category_id` foreign key to the items table
- Update all existing items to reference categories by ID
- Remove the old `category` text field
- Update indexes and add category support to order_items for historical tracking

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vine-church-store/
├── app/
│   ├── items/           # Items management page
│   ├── orders/          # Orders management page
│   └── page.tsx         # Home page
├── pages/api/
│   ├── items.js         # Items API endpoints
│   └── orders.js        # Orders API endpoints
├── lib/
│   ├── supabase.ts      # Supabase client configuration
│   └── types.ts         # TypeScript type definitions
└── public/              # Static assets
```

## API Endpoints

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
