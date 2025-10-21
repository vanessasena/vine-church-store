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

Run the following SQL in your Supabase SQL editor:

```sql
-- Create items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_items_category ON items(category);
```

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

### Items API (`/api/items`)

- `GET` - Fetch all items
- `POST` - Create a new item
- `PUT` - Update an item
- `DELETE` - Delete an item

### Orders API (`/api/orders`)

- `GET` - Fetch all orders with items
- `POST` - Create a new order
- `PUT` - Update order payment status
- `DELETE` - Delete an order

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
