# Cloudinary Setup Guide

## Step 1: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com/)
2. Click "Sign Up for Free"
3. Complete registration

## Step 2: Get Your Credentials

After logging in, go to your Dashboard. You'll find:

- **Cloud Name**: Your unique Cloudinary identifier
- **API Key**: Your application's API key
- **API Secret**: Your application's secret key

## Step 3: Create Upload Preset

1. In Cloudinary Dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `manga_covers`
   - **Signing Mode**: `Unsigned` (for client-side uploads)
   - **Folder**: `manga-reader/covers` (optional, organizes your images)
   - **Upload control**: Enable if you want restrictions
5. Click **Save**

## Step 4: Configure Environment Variables

Update your `.env.local` file with your Cloudinary credentials:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important**: Replace `your_cloud_name_here`, `your_api_key_here`, and `your_api_secret_here` with your actual Cloudinary credentials.

## Step 5: Restart Development Server

After updating `.env.local`, restart your development server:

```bash
npm run dev
```

## Upload Preset Configuration (Optional)

For better control over uploads, you can configure additional settings in your upload preset:

### Image Transformations

- **Format**: Auto (automatically optimizes format)
- **Quality**: Auto (automatically optimizes quality)
- **Maximum dimensions**: Set width/height limits

### Access Control

- **Delivery type**: Upload
- **Access mode**: Public (for publicly accessible images)

### Folder Structure Recommendations

- `/manga-reader/covers` - Manga cover images
- `/manga-reader/banners` - Banner images
- `/manga-reader/chapters` - Chapter page images

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Use unsigned upload presets** for client-side uploads
3. For sensitive operations, implement server-side upload logic
4. Consider implementing upload restrictions (file size, formats)

## Testing

After setup, test by:

1. Go to `/admin/manga/add`
2. Click on image upload areas
3. Upload a test image
4. Verify image appears in Cloudinary Dashboard

## Troubleshooting

### Upload widget doesn't appear

- Check if `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly
- Verify upload preset name matches your configuration

### Upload fails

- Ensure upload preset is set to "Unsigned"
- Check browser console for error messages
- Verify your Cloudinary account is active

### Images don't display

- Check if image URLs are being saved correctly
- Verify Cloudinary URLs are accessible (not private)
- Check browser network tab for 404 errors

## Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js Cloudinary Guide](https://next.cloudinary.dev/)
- [Upload Widget Documentation](https://cloudinary.com/documentation/upload_widget)
