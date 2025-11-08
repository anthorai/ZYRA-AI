# Shopify App Configuration Guide

## Why You're Seeing "Shopify Connection Failed"

Your Zyra AI application code is working perfectly! The issue is that your **Shopify Partner app settings** don't match your production domain.

When you try to connect, Shopify rejects the authorization because the redirect URL isn't whitelisted in your app configuration.

---

## Required Shopify App Settings

### 1. App URLs Configuration

Go to your Shopify Partner Dashboard → Your App → Configuration:

**App URL (Required):**
```
https://zzyraai.com
```

**Allowed redirection URL(s) (CRITICAL):**
```
https://zzyraai.com/api/shopify/callback
```

⚠️ **This MUST match EXACTLY** - including:
- Protocol (`https://`)
- Domain (`zzyraai.com`)
- Path (`/api/shopify/callback`)
- No trailing slash

### 2. API Credentials

Make sure these environment variables match your Shopify app:

- **SHOPIFY_API_KEY** = Your app's Client ID (found in Partner Dashboard)
- **SHOPIFY_API_SECRET** = Your app's Client Secret (found in Partner Dashboard)
- **PRODUCTION_DOMAIN** = `https://zzyraai.com` (exactly as shown)

### 3. OAuth Scopes

Your app requests these permissions (already configured in code):
```
read_products, write_products, read_inventory, read_customers, 
read_orders, read_checkouts, read_marketing_events, write_marketing_events,
read_analytics, read_reports, read_locales
```

Make sure these scopes are enabled in your Shopify app settings.

---

## How to Fix

### Step 1: Update Shopify App Configuration

1. Go to https://partners.shopify.com
2. Navigate to **Apps** → Your App Name
3. Click **Configuration** in the sidebar
4. Under **URLs**, set:
   - **App URL**: `https://zzyraai.com`
   - **Allowed redirection URL(s)**: `https://zzyraai.com/api/shopify/callback`
5. Click **Save**

### Step 2: Verify Environment Variables

Check that your Replit Secrets match your Shopify app:

```bash
SHOPIFY_API_KEY=<your-app-client-id>
SHOPIFY_API_SECRET=<your-app-client-secret>
PRODUCTION_DOMAIN=https://zzyraai.com
```

### Step 3: Test Connection

1. Go to Settings → Integrations in Zyra AI
2. Click "Connect" on Shopify
3. Enter your Shopify store domain (e.g., `anthor-ai.myshopify.com`)
4. You should be redirected to Shopify authorization page
5. Click "Install" to approve
6. You'll be redirected back to Zyra AI with success message

---

## Common Issues

### Issue: "redirect_uri parameter is not valid"

**Cause:** Shopify app doesn't have the callback URL whitelisted

**Fix:** Add `https://zzyraai.com/api/shopify/callback` to "Allowed redirection URL(s)" in Partner Dashboard

### Issue: "API key or access token is invalid"

**Cause:** Wrong SHOPIFY_API_KEY or SHOPIFY_API_SECRET

**Fix:** Copy credentials from Partner Dashboard → Your App → API credentials

### Issue: "Shop domain not found"

**Cause:** Typo in store domain or store doesn't exist

**Fix:** Use format `yourstore.myshopify.com` (not custom domain)

---

## What Happens After Successful Connection

1. ✅ Shopify authorizes Zyra AI
2. ✅ Access token is securely stored in database
3. ✅ Your products are automatically synced
4. ✅ You can use AI-powered optimization features
5. ✅ Marketing automation becomes available

---

## Need Help?

If you've followed all steps and still see errors:

1. Check server logs for specific error messages
2. Verify your Shopify store is on a paid plan (required for custom apps)
3. Make sure you're the store owner or have appropriate permissions
4. Try connecting from a different browser (clear cache)

---

## Technical Details (For Reference)

**OAuth Flow:**
1. User clicks "Connect" → App generates state token
2. User redirected to Shopify authorization page
3. User approves → Shopify redirects to callback with code
4. App exchanges code for access token
5. App stores connection and syncs products

**Redirect URI Used:**
```
https://zzyraai.com/api/shopify/callback
```

**Authorization URL Format:**
```
https://{store}.myshopify.com/admin/oauth/authorize
  ?client_id={SHOPIFY_API_KEY}
  &scope={scopes}
  &redirect_uri={callback_url}
  &state={security_token}
```
