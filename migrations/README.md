# Database Migrations

This folder contains SQL migration scripts for the Vine Church Store database.

## How to Apply Migrations

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file you want to apply
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

## Available Migrations

### 001_add_subcategory_to_items.sql
- **Description**: Adds the optional `subcategory` text column to `items`. Run this migration before deploying subcategory support to an existing database; new databases include it in `database-setup.sql`.
- **Usage**: In Items Management, enter a subcategory (e.g., Snack, Beverage, Lunch) or reuse a suggestion from the selected category. Leave it blank to clear it. New and edited orders group items by category and subcategory, with unassigned items under "Other", plus search and touch-friendly group filters.
- **Note**: Safe to run multiple times; existing items are preserved.

### add_image_url_to_items.sql
- **Date**: 2025-11-05
- **Description**: Adds the `image_url` column to the `items` table to support item images stored in Supabase storage
- **Required for**: Item image upload feature
- **Note**: This migration is safe to run multiple times (uses `IF NOT EXISTS`)

## Storage Bucket Setup

For the image upload feature to work, you also need to create a public storage bucket in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named `item-images`
4. Make it public by:
   - Click on the bucket
   - Go to "Policies"
   - Add a policy to allow public read access:
     ```sql
     CREATE POLICY "Public Access" ON storage.objects
     FOR SELECT
     USING (bucket_id = 'item-images');
     ```
   - Add a policy to allow authenticated users to upload:
     ```sql
     CREATE POLICY "Authenticated users can upload" ON storage.objects
     FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'item-images');
     ```
