# ZYRA - Vercel Deployment Quick Start

**⚡ 5-Minute Deploy Guide**

---

## Prerequisites

- ✅ GitHub account with ZYRA repository pushed
- ✅ Vercel account (FREE Hobby plan works! 🎉 No Pro needed)
- ✅ All API keys ready (OpenAI, Supabase, SendGrid, Twilio, PayPal)

> **💡 Note:** Scheduled tasks run via GitHub Actions for FREE - no Vercel Pro required!

---

## 1. Connect to Vercel (2 minutes)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your ZYRA GitHub repository
4. Click **"Import"**

---

## 2. Configure Project (2 minutes)

### Build Settings
Leave defaults (already configured in `vercel.json`):
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

### Add Environment Variables

Click **"Environment Variables"** and add ALL of these:

#### Core (Required)
```bash
NODE_ENV=production
DATABASE_URL=<supabase_postgres_url>
SUPABASE_URL=<supabase_url>
SUPABASE_ANON_KEY=<supabase_key>
OPENAI_API_KEY=<openai_key>
```

#### Security (Generate 32-char random strings)
```bash
CRON_SECRET=<random_32_chars>
INTERNAL_SERVICE_TOKEN=<random_32_chars>
SESSION_SECRET=<random_32_chars>
```

Generate with:
```bash
openssl rand -base64 32
```

#### Email/SMS
```bash
SENDGRID_API_KEY=<sendgrid_key>
TWILIO_ACCOUNT_SID=<twilio_sid>
TWILIO_AUTH_TOKEN=<twilio_token>
TWILIO_PHONE_NUMBER=<twilio_number>
```

#### Payments
```bash
RAZORPAY_KEY_ID=<razorpay_key>
RAZORPAY_KEY_SECRET=<razorpay_secret>
PAYPAL_CLIENT_ID=<paypal_id>
PAYPAL_CLIENT_SECRET=<paypal_secret>
```

#### Optional (Recommended)
```bash
UPSTASH_REDIS_REST_URL=<redis_url>
UPSTASH_REDIS_REST_TOKEN=<redis_token>
PRODUCTION_DOMAIN=https://your-domain.com
```

---

## 3. Deploy (1 minute)

Click **"Deploy"** and wait 3-5 minutes.

> **✅ Fixed:** The 404 NOT_FOUND error is now resolved! Vercel.json uses modern `rewrites` syntax for proper serverless routing.

---

## 4. Post-Deployment (5 minutes)

### A. Verify Deployment
Visit your app URL (shown in Vercel dashboard):
```
https://your-app.vercel.app
```

### B. Test Authentication
1. Click "Sign Up"
2. Create test account
3. Verify login works

### C. Set Up GitHub Actions Cron (FREE Alternative)
GitHub Actions handles all scheduled tasks for FREE - no Vercel Pro needed!

1. Add GitHub secret: `INTERNAL_SERVICE_TOKEN` (see `GITHUB_ACTIONS_CRON_SETUP.md`)
2. The workflow at `.github/workflows/cron.yml` will automatically:
   - Run billing renewals every 6 hours
   - Process email/SMS campaigns every 6 hours
   - Sync Shopify products every 6 hours
3. Monitor execution in your GitHub repository's **Actions** tab

> **📖 Full Setup:** See `GITHUB_ACTIONS_CRON_SETUP.md` for detailed instructions

### D. Migrate File Storage (CRITICAL!)

**Current Status:** Profile images use ephemeral filesystem (will disappear)  
**Action Required:** Choose one option:

#### Option 1: Vercel Blob (Easiest)
```bash
npm install @vercel/blob
```

Update upload handler in `server/routes.ts`:
```typescript
import { put } from '@vercel/blob';

const blob = await put(filename, req.file.buffer, { access: 'public' });
const imageUrl = blob.url; // Use this instead of /uploads/...
```

#### Option 2: Use Replit Object Storage
Already configured! Just set env variables:
```bash
PUBLIC_OBJECT_SEARCH_PATHS=<your_paths>
PRIVATE_OBJECT_DIR=<your_dir>
```

---

## 5. Custom Domain (Optional)

1. Go to **Project Settings** → **"Domains"**
2. Add your domain: `yourdomain.com`
3. Update DNS records (shown by Vercel)
4. Add to environment variables:
   ```bash
   PRODUCTION_DOMAIN=https://yourdomain.com
   ```

---

## ✅ You're Live!

Your ZYRA app is now deployed on Vercel with:
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Auto-scaling
- ✅ Background cron jobs
- ✅ Preview deployments for PRs

---

## 🆘 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| **Cron jobs not running** | Check GitHub Actions tab - add `INTERNAL_SERVICE_TOKEN` secret (see `GITHUB_ACTIONS_CRON_SETUP.md`) |
| **404 NOT_FOUND error** | ✅ Fixed! Vercel.json uses `rewrites` (not `routes`) for serverless routing |
| **Function timeout** | Optimize AI requests or use async processing |
| **CORS errors** | Add `PRODUCTION_DOMAIN` env variable |
| **File uploads 404** | Migrate to Vercel Blob (see step 4D) |
| **Database errors** | Check `DATABASE_URL` is correct |
| **"Cron expression would run more than once per day" error** | This is fixed! `vercel.json` no longer has cron config - GitHub Actions handles it |

---

## 📚 Full Documentation

See `VERCEL_DEPLOYMENT_GUIDE.md` for:
- Detailed architecture explanation
- Cost breakdown
- Performance optimization
- Advanced troubleshooting
- Comparison with Replit VM

---

## 💰 Monthly Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Hobby | **$0** | FREE plan works! |
| GitHub Actions Cron | **$0** | Handles all scheduled tasks |
| Vercel Blob (50GB) | $5 | For file uploads |
| Supabase Pro | $25 | Database + auth |
| Upstash Redis (Optional) | $10 | For caching |
| **Total** | **~$40/month** | 💰 $20 saved vs Vercel Pro! |

Plus variable costs for bandwidth/AI usage.

---

**Need Help?** Check `VERCEL_DEPLOYMENT_GUIDE.md` or contact support.
