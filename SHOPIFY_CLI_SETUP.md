# Shopify CLI Setup for Compliance Webhooks

## 🎯 Overview

This guide will help you register your app's mandatory GDPR compliance webhooks using the Shopify CLI. The hybrid approach keeps your Express/React app intact while adding CLI-based webhook configuration.

## ✅ What's Already Done

- ✅ Created `shopify.app.toml` configuration file
- ✅ Added unified webhook endpoint at `/api/webhooks/compliance`
- ✅ HMAC verification implemented and working
- ✅ All 3 compliance webhook handlers ready

## 📋 Prerequisites

Before you begin, make sure you have:
- Node.js installed (v18 or higher)
- Your Shopify API Secret key ready
- Admin access to your Shopify Partner account

## 🚀 Step-by-Step Setup

### Step 1: Install Shopify CLI

Run this command in your Replit Shell:

```bash
npm install -g @shopify/cli @shopify/app
```

### Step 2: Configure Your API Secret

The `shopify.app.toml` file is already created with your Client ID. Now you need to add your API Secret to environment variables:

1. Go to Replit Secrets (Tools → Secrets or click the lock icon)
2. Update or add:
   - **SHOPIFY_API_SECRET** = `[Your Shopify API Secret from Partner Dashboard]`

### Step 3: Authenticate with Shopify

Run this command to authenticate the CLI with your Partner account:

```bash
shopify auth login
```

This will open a browser window. Login with your Shopify Partner credentials.

### Step 4: Deploy Webhook Configuration

Now deploy the webhook configuration to Shopify:

```bash
shopify app deploy
```

**What this does:**
- Reads your `shopify.app.toml` file
- Registers all 3 compliance webhooks with Shopify
- Sets API version to 2025-10
- Configures the unified endpoint: `/api/webhooks/compliance`

### Step 5: Verify Deployment

After deployment completes, verify the configuration:

```bash
shopify webhook list
```

You should see:
```
✅ customers/data_request → /api/webhooks/compliance
✅ customers/redact → /api/webhooks/compliance  
✅ shop/redact → /api/webhooks/compliance
```

## 🧪 Testing (Optional)

Test each webhook locally:

```bash
# Test customer data request
shopify webhook trigger --topic customers/data_request

# Test customer redact
shopify webhook trigger --topic customers/redact

# Test shop redact
shopify webhook trigger --topic shop/redact
```

Check your Replit console logs to confirm webhooks are received and processed.

## ✅ Run Automated Compliance Checks

1. Go to **Partner Dashboard → Apps → ZYRA AI**
2. Navigate to **Distribution** tab
3. Click **"Run automated checks"**

Both checks should now pass:
- ✅ Provides mandatory compliance webhooks
- ✅ Verifies webhooks with HMAC signatures

## 🔧 Webhook Configuration Details

The `shopify.app.toml` file contains:

```toml
name = "ZYRA AI"
client_id = "9cb3481e978a06a1cd25e59d96ed6914"
scopes = "read_products,write_products,read_inventory"

[webhooks]
api_version = "2025-10"

[[webhooks.subscriptions]]
compliance_topics = [
  "customers/data_request",
  "customers/redact",
  "shop/redact"
]
uri = "/api/webhooks/compliance"
```

## 📡 How It Works

### Unified Endpoint Architecture

All 3 compliance webhooks → `/api/webhooks/compliance`

The endpoint automatically routes based on `x-shopify-topic` header:
- `customers/data_request` → Logs request for manual processing
- `customers/redact` → Logs redaction request
- `shop/redact` → Deletes all shop data from database

### Security Features

- ✅ HMAC signature verification (timing-safe comparison)
- ✅ Returns 200 OK for valid requests
- ✅ Returns 401 Unauthorized for invalid HMAC
- ✅ Handles all edge cases gracefully

## 🆘 Troubleshooting

### Issue: "Client ID mismatch"
**Solution:** Verify `client_id` in `shopify.app.toml` matches your Partner Dashboard app

### Issue: "API Secret not found"
**Solution:** Add `SHOPIFY_API_SECRET` to Replit Secrets

### Issue: "Webhooks not showing in Partner Dashboard"
**Solution:** 
- Run `shopify app deploy` again
- Check Versions tab in Partner Dashboard
- Wait 5-10 minutes for propagation

### Issue: "Automated checks still failing"
**Solution:**
- Ensure your app is running (workflow should be active)
- Verify HTTPS endpoint is accessible
- Check console logs for webhook test attempts
- Try running checks again after 30 minutes

## 📚 Resources

- **Shopify CLI Docs**: https://shopify.dev/docs/apps/build/cli-for-apps
- **Webhook Configuration**: https://shopify.dev/docs/apps/build/webhooks
- **Privacy Compliance**: https://shopify.dev/docs/apps/build/privacy-law-compliance

## ✨ Next Steps

After automated checks pass:
1. Submit your app for review in Partner Dashboard
2. Complete the app listing information
3. Wait for Shopify's manual review (~3-5 business days)

---

**Need Help?** Check the console logs or contact Shopify Partner Support.
