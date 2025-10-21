# Vine Church Cafeteria - Setup Guide

This guide will help you set up and run the Vine Church Cafeteria Management App.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or later installed
- A Supabase account (sign up at https://supabase.com - free tier available)
- Basic knowledge of command line operations

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/vanessasena/vine-church-store.git
cd vine-church-store

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Go to https://supabase.com and sign in
2. Create a new project
3. Wait for the database to be provisioned (takes ~2 minutes)
4. Go to Project Settings > API
5. Copy your Project URL and anon/public API key

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Supabase credentials
# Use your favorite text editor (nano, vim, or VS Code)
nano .env
```

Your `.env` file should look like:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up the Database

1. In Supabase dashboard, go to SQL Editor
2. Copy the contents of `database-setup.sql` from the project root
3. Paste it into the SQL Editor
4. Click "Run" to execute the script

This will create:
- `items` table for cafeteria items
- `orders` table for customer orders
- `order_items` table for order line items
- Necessary indexes for performance
- Sample data (optional)

### 5. Run the Application

```bash
# Development mode (with hot reload)
npm run dev

# Open http://localhost:3000 in your browser
```

### 6. Build for Production

```bash
# Create optimized production build
npm run build

# Run production server
npm start
```

## Using the Application

### Managing Items

1. Click "Items Management" from the home page
2. Fill in the form:
   - Item Name: e.g., "Coffee"
   - Category: e.g., "Beverages"
   - Price: e.g., 2.50
3. Click "Add Item"
4. Items appear in the table on the right
5. Use Edit/Delete buttons to modify items

### Managing Orders

1. Click "Orders Management" from the home page
2. Click "+ New Order"
3. Enter customer name
4. Click on items to add them to the cart
5. Use +/- buttons to adjust quantities
6. Click "Create Order"
7. Use "Mark as Paid/Unpaid" to update payment status
8. Use "Delete" to remove orders

## Troubleshooting

### "Failed to fetch items" error
- Check that your Supabase credentials in `.env` are correct
- Ensure the database tables are created
- Check Supabase dashboard for any errors

### Port 3000 already in use
```bash
# Use a different port
PORT=3001 npm run dev
```

### Build errors
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Deploy to Other Platforms

The app can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- Render
- Heroku
- AWS/Azure/GCP

Make sure to set the environment variables on your hosting platform.

## Database Maintenance

### Backup Your Data

In Supabase dashboard:
1. Go to Database > Backups
2. Enable automatic backups (recommended)
3. Or manually export data using SQL Editor

### Reset Database

If you need to start fresh:

```sql
-- Run in Supabase SQL Editor
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- Then run the database-setup.sql script again
```

## Support

For issues or questions:
- Check the README.md file
- Open an issue on GitHub
- Contact the development team

## Security Notes

- Never commit `.env` files to version control
- Keep your Supabase keys secure
- Enable Row Level Security (RLS) in production
- Consider adding authentication for production use
