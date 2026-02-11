# Voter App Deployment Guide

## Backend Deployment on Vercel

### 1. Environment Variables Setup

Create a `.env.production` or set these in Vercel Dashboard:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voter-db

# JWT
JWT_SECRET=your-long-random-jwt-secret-key

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional
NODE_ENV=production
```

### 2. Cloudinary Setup (Free)

1. **Sign up**: https://cloudinary.com/users/register/free
2. **Get credentials**:
   - Go to Dashboard
   - Copy `Cloud Name`, `API Key`, `API Secret`
3. **Add to Vercel**:
   - Project Settings → Environment Variables
   - Add all three Cloudinary variables

### 3. Install Cloudinary Package

```bash
npm install cloudinary next-cloudinary
```

Or use Node.js SDK:
```bash
npm install cloudinary
```

### 4. Update Import Controller

Replace local file upload with Cloudinary:

```javascript
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In PDF import handler
const uploadPdfToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "voter-app/pdfs" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};
```

### 5. Clean Up Local Uploads

Delete `/backend/uploads` folder - NOT needed on Vercel.

### 6. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Scalability for Large User Base

Your app with **Cloudinary + Vercel** can handle:
- ✅ Unlimited users
- ✅ Unlimited centers
- ✅ Unlimited voters
- ✅ Fast global CDN
- ✅ Auto-scaling

**Cost at scale**:
- Free tier: 25GB storage/month
- Premium: ~$0.35/GB overage (very affordable)
- With 10,000 users × 100 voters avg = minimal cost

---

## Frontend (Expo/React Native) Deployment

No changes needed - it connects to your Vercel backend URL.

Just update `API_BASE_URL` in `mobile/src/api/index.js`:
```javascript
const API_BASE_URL = "https://your-vercel-domain.vercel.app/api";
```

---

## Troubleshooting

**Issue**: PDF import timeout
**Solution**: Increase function timeout in `vercel.json` (max 60s on free tier)

**Issue**: Large file uploads fail
**Solution**: Implement chunked upload or increase serverless function timeout

**Issue**: OCR taking too long
**Solution**: Consider queueing system or async processing via Cloudinary webhooks
