# ZYRA - Vercel Deployment Quick Start

**⚡ 5-Minute Deploy Guide**

---

## Prerequisites

- ✅ GitHub account with ZYRA repository pushed
- ✅ Vercel Pro account ($20/month - **required** for cron jobs)
- ✅ All API keys ready (OpenAI, Supabase, SendGrid, Twilio, Razorpay/PayPal)

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

### C. Check Cron Jobs
1. Go to Vercel dashboard → **"Cron Jobs"** tab
2. Verify 3 cron jobs are scheduled:
   - Billing (every 6 hours)
   - Campaigns (every 5 minutes)
   - Product Sync (every 10 minutes)

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
| **Cron jobs not running** | Upgrade to Vercel Pro ($20/mo) |
| **Function timeout** | Upgrade to Pro (60s timeout) or optimize AI requests |
| **CORS errors** | Add `PRODUCTION_DOMAIN` env variable |
| **File uploads 404** | Migrate to Vercel Blob (see step 4D) |
| **Database errors** | Check `DATABASE_URL` is correct |

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

| Service | Cost |
|---------|------|
| Vercel Pro | $20 |
| Vercel Blob (50GB) | $5 |
| Supabase Pro | $25 |
| Upstash Redis | $10 |
| **Total** | **~$60/month** |

Plus variable costs for bandwidth/AI usage.

---

**Need Help?** Check `VERCEL_DEPLOYMENT_GUIDE.md` or contact support.
