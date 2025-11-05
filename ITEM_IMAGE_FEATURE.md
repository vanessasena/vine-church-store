# Item Image Upload Feature

This document describes the item image upload feature that has been added to the Vine Church Store application.

## Overview

Items can now have associated images that are displayed throughout the application. Images are stored in Supabase Storage and URLs are saved in the database.

## Features

### 1. Image Upload on Item Creation/Edit
- File input field in the item form (Items Management page)
- Image preview before submission
- Automatic upload to Supabase storage
- File size limit: 5MB
- Supported formats: All image types (jpg, png, gif, etc.)

### 2. Image Display
- **Items Management Page**: Shows thumbnail (48x48px) in the items list table
- **Orders Page**: Shows larger preview (w-full x 96px) on item cards when creating/editing orders
- **Fallback**: "No image" placeholder shown when no image is uploaded

## Setup Instructions

### 1. Database Migration

Run the migration script to add the `image_url` column to the items table:

```sql
-- In Supabase SQL Editor, run:
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;
```

Or use the migration file in `/migrations/add_image_url_to_items.sql`

### 2. Supabase Storage Setup

**IMPORTANT**: You must create the storage bucket before using the image upload feature.

1. Go to your Supabase project dashboard
2. Navigate to **Storage** section
3. Click **"New bucket"**
4. Name it exactly: `item-images`
5. Set it to **Public** bucket
6. Click **Create bucket**

#### Storage Policies (Already Public Bucket)

Since it's a public bucket, images will be publicly accessible. However, you should still add upload policies:

1. Click on the `item-images` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Add the following policy to allow authenticated users to upload:

```sql
CREATE POLICY "Authenticated users can upload" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'item-images');
```

5. Optionally add a policy to allow deleting (for future cleanup features):

```sql
CREATE POLICY "Authenticated users can delete" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'item-images');
```

## Technical Implementation

### Database Schema
- **Table**: `items`
- **New Column**: `image_url` (TEXT, nullable)
- Stores the public URL of the uploaded image

### API Changes
- **POST /api/items**: Accepts `image_url` parameter
- **PUT /api/items**: Accepts `image_url` parameter

### Frontend Changes

#### app/items/page.tsx
- Added image upload input with file selection
- Image preview functionality
- Upload to Supabase storage before form submission
- Display images in items table

#### app/orders/page.tsx
- Display item images in the "Available Items" grid
- Shows images in both new order and edit order modals

#### lib/types.ts
- Updated `Item` interface to include `image_url?: string | null`

### Storage Integration
Images are uploaded using the Supabase JavaScript client:

```typescript
const { data, error } = await supabase.storage
  .from('item-images')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

const { data: urlData } = supabase.storage
  .from('item-images')
  .getPublicUrl(filePath);
```

## Usage

### Adding an Item with Image

1. Go to **Items Management** page
2. Fill in the item details (Name, Category, Price)
3. Click **"Choose File"** under "Item Image (optional)"
4. Select an image file (max 5MB)
5. Preview will appear below the file input
6. Click **"Add Item"** to save

### Editing an Item's Image

1. Click **"Edit"** on an item in the items list
2. The current image (if any) will be shown in the preview
3. To change the image, select a new file
4. Click **"Update Item"** to save

### Viewing Images

- **Items Table**: See small thumbnails next to each item name
- **Orders Page**: See larger images on item selection cards
- Images help quickly identify items when creating orders

## File Naming Convention

Uploaded images are automatically renamed to prevent conflicts:
- Format: `{timestamp}-{random}.{extension}`
- Example: `1699564834123-abc123.jpg`

## Security Considerations

1. **File Size Validation**: Frontend limits to 5MB
2. **File Type Validation**: Only image files are accepted
3. **Authentication**: Only authenticated users can upload (via storage policies)
4. **Public Access**: Images are publicly readable (suitable for a store catalog)

## Future Enhancements

Potential improvements for future versions:
- Image compression/optimization before upload
- Multiple images per item
- Image deletion when item is deleted
- Image cropping/editing tools
- Bulk image upload
- Image zoom on hover/click

## Troubleshooting

### Issue: "Failed to upload image"
**Solutions**:
- Verify the `item-images` bucket exists in Supabase Storage
- Check that the bucket is set to public
- Verify storage policies allow authenticated uploads
- Check file size is under 5MB
- Ensure internet connection is stable

### Issue: Images not displaying
**Solutions**:
- Verify the image URL is stored correctly in the database
- Check that the bucket is set to public
- Try accessing the image URL directly in browser
- Check browser console for CORS errors

### Issue: Upload button disabled
**Solutions**:
- Ensure you've filled in all required fields (Name, Category, Price if not custom)
- Check that a category is selected
- Verify form validation passes

## Support

For issues or questions about this feature, please create an issue in the GitHub repository or contact the development team.
