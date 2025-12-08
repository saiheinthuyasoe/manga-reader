# Cloudflare R2 Configuration

## R2 Bucket Configuration

R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev

## How to get these values:

1. **Create Cloudflare R2 Bucket:**

   - Go to Cloudflare Dashboard → R2 → Create Bucket
   - Name your bucket (e.g., "manga-reader-storage")

2. **Get Account ID:**

   - Found in Cloudflare Dashboard URL or R2 overview page
   - Format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

3. **Create R2 API Token:**

   - Go to R2 → Manage R2 API Tokens → Create API Token
   - Select "Object Read & Write" permissions
   - Copy the Access Key ID and Secret Access Key

4. **Enable Public Access (Optional but recommended for serving images):**

   - Go to your R2 bucket → Settings → Public Access
   - Enable "Allow Access" and copy the public URL
   - Format: `https://pub-xxxxxxxxxxxxx.r2.dev`

5. **Update `.env.local`:**
   - Copy the example values above
   - Replace with your actual credentials
   - Update `next.config.ts` hostname with your R2 public URL domain

## Important Notes:

- Keep your R2 credentials secure
- Never commit `.env.local` to version control
- The public URL is needed for Next.js Image optimization
- R2 is S3-compatible, so we use AWS SDK
