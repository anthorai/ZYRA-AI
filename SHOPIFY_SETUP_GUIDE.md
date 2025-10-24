# Shopify Integration Setup Guide

**Last Updated:** October 24, 2025  
**For:** Zyra AI - Shopify SaaS Application

---

## 📋 Quick Reference

### Required OAuth Scopes
```
read_products
write_products
read_inventory
read_customers
read_orders
read_checkouts
read_marketing_events
write_marketing_events
read_analytics
read_reports
read_locales
```

### Webhook URLs (Production)
Replace `https://zzyraai.com` with your actual domain.

| Webhook Topic | URL | Required |
|--------------|-----|----------|
| **app/uninstalled** | `https://zzyraai.com/api/webhooks/shopify/app_uninstalled` | ✅ Yes |
| **customers/data_request** | `https://zzyraai.com/api/webhooks/shopify/customers/data_request` | ✅ Yes (GDPR) |
| **customers/redact** | `https://zzyraai.com/api/webhooks/shopify/customers/redact` | ✅ Yes (GDPR) |
| **shop/redact** | `https://zzyraai.com/api/webhooks/shopify/shop/redact` | ✅ Yes (GDPR) |
| **products/create** | `https://zzyraai.com/api/webhooks/shopify/products/create` | Optional |
| **products/update** | `https://zzyraai.com/api/webhooks/shopify/products/update` | Optional |

### Development Webhook URLs
Replace with your Replit domain:
```
https://e27e6f72-6959-4e40-b028-11b38051e867-00-3ofd3wmcf6mca.spock.replit.dev/api/webhooks/shopify/[topic]
```

---

## 🚀 Shopify Partner Dashboard Setup

### Step 1: Create Your Shopify App

1. **Go to Shopify Partners Dashboard**
   - Visit: https://partners.shopify.com/
   - Navigate to: **Apps** → **Create app**

2. **Choose App Type**
   - Select: **Custom app** or **Public app** (depending on your needs)
   - App name: `Zyra AI`

### Step 2: Configure App URLs

In your app's **Configuration** section:

**App URL:**
```
https://zzyraai.com
```

**Allowed redirection URL(s):**
```
https://zzyraai.com/api/shopify/callback
```

For development, also add:
```
https://e27e6f72-6959-4e40-b028-11b38051e867-00-3ofd3wmcf6mca.spock.replit.dev/api/shopify/callback
```

### Step 3: Configure OAuth Scopes

1. Navigate to: **Configuration** → **Scopes**
2. Enable the following scopes:

#### Product & Inventory
- ✅ `read_products` - Read product data
- ✅ `write_products` - Modify products (AI optimization)
- ✅ `read_inventory` - View inventory levels

#### Customer Data
- ✅ `read_customers` - Access customer information for analytics
- ✅ `read_orders` - View order history for insights
- ✅ `read_checkouts` - Track abandoned carts

#### Marketing & Analytics
- ✅ `read_marketing_events` - Track campaign performance
- ✅ `write_marketing_events` - Create marketing events
- ✅ `read_analytics` - Access store analytics
- ✅ `read_reports` - Generate reports

#### Localization
- ✅ `read_locales` - Support multi-language stores

3. Click **Save**

### Step 4: Set Up Webhooks

1. Navigate to: **Configuration** → **Webhooks**
2. Click **Add webhook** for each required topic:

#### Mandatory GDPR Webhooks

**1. customers/data_request**
- **Topic:** `customers/data_request`
- **URL:** `https://zzyraai.com/api/webhooks/shopify/customers/data_request`
- **Format:** JSON
- **API version:** Latest (2025-10 or newer)

**2. customers/redact**
- **Topic:** `customers/redact`
- **URL:** `https://zzyraai.com/api/webhooks/shopify/customers/redact`
- **Format:** JSON
- **API version:** Latest (2025-10 or newer)

**3. shop/redact**
- **Topic:** `shop/redact`
- **URL:** `https://zzyraai.com/api/webhooks/shopify/shop/redact`
- **Format:** JSON
- **API version:** Latest (2025-10 or newer)

#### App Lifecycle Webhook

**4. app/uninstalled**
- **Topic:** `app/uninstalled`
- **URL:** `https://zzyraai.com/api/webhooks/shopify/app_uninstalled`
- **Format:** JSON
- **API version:** Latest (2025-10 or newer)

#### Optional Product Sync Webhooks

**5. products/create** (Recommended)
- **Topic:** `products/create`
- **URL:** `https://zzyraai.com/api/webhooks/shopify/products/create`
- **Format:** JSON

**6. products/update** (Recommended)
- **Topic:** `products/update`
- **URL:** `https://zzyraai.com/api/webhooks/shopify/products/update`
- **Format:** JSON

### Step 5: Get API Credentials

1. Navigate to: **API credentials**
2. Copy the following:
   - **API key** (Client ID)
   - **API secret key** (Client Secret)

3. Add to Replit Secrets:
   ```
   SHOPIFY_API_KEY=your_api_key_here
   SHOPIFY_API_SECRET=your_api_secret_here
   ```

---

## 🔧 Testing Your Webhooks

### Test GDPR Webhooks

1. **In Shopify Partner Dashboard:**
   - Go to: **Apps** → Your app → **Webhooks**
   - Click the **Test** button next to each webhook
   - Shopify will send a sample payload to your endpoint

2. **Expected Response:**
   - Your app should respond with `200 OK` within 5 seconds
   - Check your application logs for confirmation

3. **Manual Testing:**
   - Install your app on a development store
   - Navigate to: **Settings** → **Customer privacy**
   - Test data requests and erasure

### Test OAuth Flow

1. **Install on Development Store:**
   - Go to your Shopify Partners Dashboard
   - Navigate to: **Test your app** → Select a development store
   - Click **Install app**

2. **Verify Scopes:**
   - After installation, check that all requested scopes are granted
   - Review in: Store Admin → **Settings** → **Apps and sales channels**

3. **Check Connection:**
   - In Zyra AI dashboard, verify the store appears as connected
   - Test product sync functionality

---

## 🐛 Troubleshooting

### Issue: 503 Errors on Webhooks

**Cause:** Shopify requires webhook responses within 5 seconds. Database operations or external API calls can cause timeouts.

**Solution:** ✅ Already implemented
- All GDPR webhooks respond with `200 OK` immediately
- Data processing happens asynchronously after response
- Check application logs for processing status

### Issue: Webhook Signature Verification Failed

**Cause:** Invalid HMAC signature or incorrect secret key.

**Solution:**
1. Verify `SHOPIFY_API_SECRET` in Replit Secrets matches Partner Dashboard
2. Ensure webhook payload is sent as raw body (not parsed JSON)
3. Check logs for detailed error messages

### Issue: OAuth Redirect Not Working

**Cause:** Redirect URL not whitelisted in Shopify app settings.

**Solution:**
1. Add exact redirect URL to **Allowed redirection URL(s)**
2. Include both production and development URLs
3. Ensure URLs use HTTPS (not HTTP)

### Issue: Missing Permissions

**Cause:** Required scopes not requested during OAuth flow.

**Solution:**
1. Update scopes in Partner Dashboard
2. Uninstall app from test store
3. Reinstall to request new permissions

---

## 📊 Monitoring Webhook Health

### Check Webhook Delivery

1. **In Shopify Partner Dashboard:**
   - Navigate to: **Apps** → Your app → **Webhooks**
   - Click on any webhook to view delivery history
   - Review success/failure rates

2. **In Your Application:**
   - Monitor logs for webhook receipts:
     ```bash
     # Search for GDPR webhook logs
     grep "GDPR" /tmp/logs/Start_application_*.log
     ```

### Expected Log Patterns

**Successful shop/redact:**
```
🗑️ GDPR shop redaction requested: { shop_domain: 'example.myshopify.com', shop_id: 12345 }
Found 1 connection(s) for shop: example.myshopify.com
✅ Deleted store connection: abc123
✅ Shop data redaction completed for: example.myshopify.com
```

**Successful customers/data_request:**
```
📋 GDPR data request received: { shop_domain: 'example.myshopify.com', customer_email: 'test@example.com' }
⚠️ Manual action required: Customer data request needs to be fulfilled
```

---

## 🔒 Security Best Practices

1. **Always verify HMAC signatures** - Already implemented via `verifyShopifyWebhook` middleware
2. **Use HTTPS only** - Never accept HTTP webhook requests
3. **Validate shop domains** - Ensure `.myshopify.com` format
4. **Rotate API secrets** - Update if compromised
5. **Monitor webhook failures** - Set up alerts for repeated failures

---

## 📝 Pre-Submission Checklist

Before submitting your app for Shopify App Store review:

- [ ] All 3 GDPR webhooks configured and responding with 200 OK
- [ ] OAuth scopes match actual functionality
- [ ] App URLs use production domain (HTTPS)
- [ ] Tested on development store successfully
- [ ] Privacy policy URL added (if collecting data)
- [ ] GDPR compliance verified
- [ ] Webhook delivery success rate >95%
- [ ] No 503 or timeout errors in last 7 days

---

## 🆘 Support Resources

- **Shopify Partner Docs:** https://shopify.dev/docs/apps
- **GDPR Webhooks:** https://shopify.dev/docs/apps/build/privacy-law-compliance
- **OAuth Guide:** https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
- **Webhook Reference:** https://shopify.dev/docs/api/admin-rest/latest/resources/webhook

---

**Need Help?** Check application logs in `/tmp/logs/` or contact your development team.
