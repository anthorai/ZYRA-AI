# GitHub Actions Cron Setup Guide

**Purpose:** Run scheduled tasks every 6 hours without paying for Vercel Pro plan.

---

## How It Works

GitHub Actions (free) calls your Vercel API every 6 hours, triggering:
1. ✅ **Billing tasks** - Subscription renewals, trial expirations
2. ✅ **Campaign processing** - Send scheduled email/SMS campaigns
3. ✅ **Product sync** - Sync products from Shopify stores

---

## Setup Instructions

### Step 1: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following:
   - **Name:** `INTERNAL_SERVICE_TOKEN`
   - **Value:** Copy the exact value from your Replit `INTERNAL_SERVICE_TOKEN` secret

### Step 2: Push Workflow to GitHub

The workflow file is already created at `.github/workflows/cron.yml`. Simply:

```bash
git add .github/workflows/cron.yml
git commit -m "Add GitHub Actions cron workflow"
git push
```

### Step 3: Verify It's Running

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You should see **Scheduled Cron Trigger** workflow
4. Click **Run workflow** to test it manually
5. Check the logs to confirm all tasks completed successfully

---

## Workflow Schedule

- **Runs:** Every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
- **Cron expression:** `0 */6 * * *`
- **Manual trigger:** Available via Actions tab

---

## Expected Response

When successful, you'll see a JSON response like:

```json
{
  "timestamp": "2025-10-24T12:00:00.000Z",
  "tasks": {
    "billing": {
      "success": true,
      "message": "Billing tasks completed"
    },
    "campaigns": {
      "success": true,
      "message": "Campaigns processed"
    },
    "productSync": {
      "success": true,
      "message": "Synced 2 store(s)",
      "storesSynced": 2
    }
  },
  "duration": "1234ms",
  "success": true
}
```

---

## Troubleshooting

### Error: 401 Unauthorized

**Cause:** GitHub secret doesn't match `INTERNAL_SERVICE_TOKEN`

**Fix:**
1. Check your Replit Secrets for exact `INTERNAL_SERVICE_TOKEN` value
2. Update GitHub secret to match exactly
3. Re-run workflow

### Error: 500 Server Error

**Cause:** `INTERNAL_SERVICE_TOKEN` not set in production environment

**Fix:**
1. Add `INTERNAL_SERVICE_TOKEN` to Vercel environment variables
2. Redeploy your Vercel app
3. Re-run workflow

### Tasks Failing

Check the response body in GitHub Actions logs. Each task shows:
- `success: true` - Task completed
- `success: false, error: "..."` - Task failed with error message

---

## Endpoint Details

**URL:** `https://zyra.vercel.app/api/cron`  
**Method:** `POST`  
**Authentication:** `Authorization: Bearer <INTERNAL_SERVICE_TOKEN>`  
**Response:** JSON with task results and timing

---

## Cost

**GitHub Actions:** FREE (2,000 minutes/month on free plan)  
**Vercel:** FREE (API requests count toward your Vercel plan limits)  
**Total cost:** $0/month 🎉

---

## Alternative: Change Schedule

To run more/less frequently, edit `.github/workflows/cron.yml`:

```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours (current)
    # - cron: '0 */12 * * *'  # Every 12 hours
    # - cron: '0 0 * * *'     # Daily at midnight
```

GitHub Actions free tier runs daily jobs without issues.

---

**Status:** ✅ Ready to use - Just add the GitHub secret and push!
