# Slushi Recipes - Deployment Guide

This guide walks you through deploying your family recipe app to Vercel with Supabase.

## Prerequisites ✅

- [x] Supabase project set up with database schema
- [x] Supabase Storage configured with recipe-images bucket
- [x] GitHub account (create at [github.com](https://github.com))
- [x] Vercel account (create at [vercel.com](https://vercel.com))

## Environment Variables

Your app needs these environment variables set in Vercel:

```
DATABASE_URL=postgresql://postgres.tguhrcmgxmdvqkjebtxa:dby@wjw3vbw_fbh5FRW@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://tguhrcmgxmdvqkjebtxa.supabase.co
SUPABASE_ANON_KEY=sb_publishable_o-GClka_CuFP8K7PgxzVwA_Ui8gUYw2
SESSION_SECRET=your-secure-random-string-here
APP_PASSWORD=family123
API_KEY=recipe-api-key-123
NODE_ENV=production
FILE_STORAGE_PROVIDER=supabase
```

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository
4. Framework Preset: **Other** (we're using Express)
5. Root Directory: `./` (keep default)
6. Build Command: `npm run build`
7. Output Directory: `dist/public`
8. Install Command: `npm install`

### 3. Add Environment Variables
In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add each variable from the list above
3. Make sure to generate a secure SESSION_SECRET (32+ characters)

### 4. Deploy!
Click Deploy and wait for your app to build.

## Your App URLs

After deployment:
- **App**: https://your-project-name.vercel.app
- **Login**: Use password `family123`
- **Database**: Your Supabase PostgreSQL instance
- **Images**: Stored in Supabase Storage

## Troubleshooting

**Build fails?**
- Check the build logs in Vercel
- Make sure all environment variables are set

**Can't connect to database?**
- Verify your DATABASE_URL in Vercel environment variables
- Check Supabase connection pooling is enabled

**Images not uploading?**
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check Supabase Storage policies are set up

## Success! 🎉

Your family recipe app is now running on:
- ⚡ **Vercel** - Fast global hosting
- 🗄️ **Supabase** - Managed PostgreSQL database
- 📁 **Supabase Storage** - Image storage with CDN

Enjoy sharing recipes with your family!