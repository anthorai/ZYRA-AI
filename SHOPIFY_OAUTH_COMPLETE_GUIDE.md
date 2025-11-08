# Shopify OAuth Integration - Complete Implementation Guide

## ✅ Implementation Status: COMPLETE & PRODUCTION-READY

The Shopify OAuth flow is **fully implemented** and working. All required components are in place:

---

## 🏗️ Architecture Overview

### Technology Stack
- **Backend**: Express.js (NOT Next.js App Router)
- **Database**: PostgreSQL via Neon with `store_connections` table
- **Storage Layer**: Supabase Storage Service
- **OAuth Flow**: Standard OAuth 2.0 authorization code flow

---

## 📁 Complete File Structure

### 1. Frontend - Connect Button
**File**: `client/src/pages/settings/integrations.tsx` (lines 373-486)

**Features**:
- ✅ User input prompt for shop domain
- ✅ Input sanitization (removes `https://`, `http://`, trailing slashes)
- ✅ Auto-appends `.myshopify.com` if needed
- ✅ POST request to `/api/shopify/auth`
- ✅ Automatic redirect to Shopify authorization page
- ✅ Success/error handling with query parameters

**Code Flow**:
```typescript
handleConnect('shopify')
  → Prompt user for shop domain
  → Clean/sanitize input
  → POST /api/shopify/auth with { shop: cleanedDomain }
  → Redirect to returned authUrl
```

---

### 2. Backend - OAuth Initiation
**File**: `server/routes.ts` (lines 4300-4420)

**Endpoint**: `POST /api/shopify/auth`

**Features**:
- ✅ Shop domain validation (*.myshopify.com format)
- ✅ Generates cryptographically secure state token
- ✅ Stores state in `oauth_states` table with 10min expiration
- ✅ Builds Shopify authorization URL with correct scopes
- ✅ Uses PRODUCTION_DOMAIN for redirect URI
- ✅ Returns authUrl to frontend

**OAuth Scopes Requested**:
```
read_products, write_products, read_inventory, write_inventory,
read_customers, write_customers, read_orders, read_checkouts,
read_marketing_events, write_marketing_events, read_analytics
```

**Code Flow**:
```typescript
POST /api/shopify/auth
  → Validate shop domain format
  → Generate state token (32 random bytes)
  → Save to oauth_states table (userId, shopDomain, state, expiresAt)
  → Build authorization URL:
    https://{shop}/admin/oauth/authorize?
      client_id={SHOPIFY_API_KEY}&
      scope={scopes}&
      redirect_uri={PRODUCTION_DOMAIN}/api/shopify/callback&
      state={state}
  → Return { authUrl, redirectUri }
```

---

### 3. Backend - OAuth Callback
**File**: `server/routes.ts` (lines 4427-4815)

**Endpoint**: `GET /api/shopify/callback`

**Features**:
- ✅ HMAC signature verification (Shopify security)
- ✅ State token validation against database
- ✅ Authorization code → Access token exchange
- ✅ Shop information retrieval
- ✅ Token storage in `store_connections` table
- ✅ GDPR webhook registration
- ✅ Success/error redirects

**Security Validations**:
1. **HMAC Verification**: Validates request came from Shopify
2. **State Token**: Prevents CSRF attacks
3. **Shop Domain**: Ensures *.myshopify.com format
4. **Timestamp**: Checks request freshness

**Code Flow**:
```typescript
GET /api/shopify/callback?code=xxx&state=xxx&shop=xxx&hmac=xxx
  → Step 1: Validate required parameters (code, state, shop)
  → Step 2: Sanitize shop domain
  → Step 3: Verify HMAC signature
  → Step 4: Validate state token (check database, not expired)
  → Step 5: Exchange code for access_token
    POST https://{shop}/admin/oauth/access_token
      { client_id, client_secret, code }
    → Receive { access_token, scope }
  → Step 6: Fetch shop info
    GET https://{shop}/admin/api/2025-10/shop.json
      Headers: { X-Shopify-Access-Token: access_token }
    → Receive { shop: { name, ... } }
  → Step 7: Save to database
    IF existing connection:
      UPDATE store_connections
        SET storeName, storeUrl, accessToken, status='active', lastSyncAt
    ELSE:
      INSERT INTO store_connections
        (userId, platform='shopify', storeName, storeUrl, accessToken, status='active')
  → Step 8: Register GDPR webhooks
    - customers/data_request
    - customers/redact
    - shop/redact
  → Step 9: Redirect to success page
    → /settings/integrations?shopify=connected
```

---

### 4. Shopify Client
**File**: `server/lib/shopify-client.ts`

**Features**:
- ✅ Rate-limited API client (2 req/sec, burst of 40)
- ✅ Automatic retry on 429 (rate limit) errors
- ✅ Product CRUD operations
- ✅ SEO metadata management
- ✅ Image alt-text updates
- ✅ Connection testing

**Available Methods**:
- `getProduct(productId)` - Fetch single product
- `getAllProducts(limit)` - Fetch all products
- `updateProduct(productId, updates)` - Update product details
- `updateProductSEO(productId, seoTitle, metaDescription)` - Update SEO
- `updateProductImage(productId, imageId, altText)` - Update image alt-text
- `publishAIContent(productId, content)` - Publish AI-generated content
- `testConnection()` - Verify access token is valid

---

## 🗄️ Database Schema

### Table: `store_connections`
**Location**: Neon PostgreSQL database

```sql
CREATE TABLE store_connections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  platform TEXT NOT NULL,          -- 'shopify'
  store_name TEXT NOT NULL,         -- Shop display name
  store_url TEXT,                   -- https://mystore.myshopify.com
  access_token TEXT NOT NULL,       -- Shopify access token (encrypted at rest)
  refresh_token TEXT,               -- Future use
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive' | 'error'
  last_sync_at TIMESTAMP,           -- Last product sync timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX store_connections_user_id_idx ON store_connections(user_id);
CREATE INDEX store_connections_status_idx ON store_connections(status);
```

### Table: `oauth_states`
**Purpose**: Temporary state storage for OAuth security (10min TTL)

```sql
CREATE TABLE oauth_states (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,      -- Random 64-char hex string
  user_id VARCHAR REFERENCES users(id),
  shop_domain TEXT NOT NULL,        -- mystore.myshopify.com
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL     -- created_at + 10 minutes
);

CREATE INDEX oauth_states_state_idx ON oauth_states(state);
CREATE INDEX oauth_states_expires_at_idx ON oauth_states(expires_at);
```

**Cleanup**: Expired states are automatically deleted every 10 minutes.

---

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Shopify App Credentials (from Shopify Partner Dashboard)
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here

# Production Domain (must match Shopify redirect URI exactly)
PRODUCTION_DOMAIN=https://zzyraai.com
```

### Shopify Partner Dashboard Configuration

1. **App Setup → URLs**
   - **Allowed redirection URL(s)**: `https://zzyraai.com/api/shopify/callback`
   - ⚠️ **CRITICAL**: This MUST match `PRODUCTION_DOMAIN` exactly

2. **App Setup → OAuth**
   - **Scopes**: All 11 scopes listed in code (read_products, write_products, etc.)

3. **Distribution**
   - **Public distribution**: Enabled
   - **App mode**: Standalone (NOT embedded)

---

## 🚀 End-to-End Flow

### User Journey

```
1. User clicks "Connect" on Shopify integration card
   ↓
2. Prompt appears: "Enter your Shopify store domain"
   → User enters: "anthor-ai" or "anthor-ai.myshopify.com" or "https://anthor-ai.myshopify.com/"
   ↓
3. Frontend sanitizes input → "anthor-ai.myshopify.com"
   ↓
4. POST /api/shopify/auth { shop: "anthor-ai.myshopify.com" }
   ↓
5. Backend generates state token, saves to DB, returns authUrl
   ↓
6. User redirected to Shopify:
   https://anthor-ai.myshopify.com/admin/oauth/authorize?...
   ↓
7. User sees Shopify authorization screen:
   "Zyra AI is requesting permission to:"
   - Read and write products
   - Read inventory
   - Read customers
   ... (all scopes)
   ↓
8. User clicks "Install app" or "Grant access"
   ↓
9. Shopify redirects back:
   https://zzyraai.com/api/shopify/callback?code=xxx&state=xxx&shop=xxx&hmac=xxx
   ↓
10. Backend validates HMAC, verifies state, exchanges code for token
    ↓
11. Backend saves connection to store_connections table:
    {
      userId: "user-uuid",
      platform: "shopify",
      storeName: "Anthor AI Store",
      storeUrl: "https://anthor-ai.myshopify.com",
      accessToken: "shpat_xxx",
      status: "active"
    }
    ↓
12. Backend registers GDPR webhooks
    ↓
13. User redirected to success page:
    https://zzyraai.com/settings/integrations?shopify=connected
    ↓
14. Frontend shows success toast:
    "Shopify Connected - Your Shopify store has been successfully connected to Zyra AI!"
    ↓
15. Integration card status changes to "Connected" with neon glow effect
```

---

## 🔍 Testing Instructions

### 1. Verify Environment Variables
```bash
# Check all required env vars are set
curl https://zzyraai.com/api/shopify/validate-setup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
{
  "ready": true,
  "redirectUri": "https://zzyraai.com/api/shopify/callback",
  "checks": {
    "hasApiKey": true,
    "hasApiSecret": true,
    "hasProductionDomain": true
  }
}
```

### 2. Test Connect Flow
1. Navigate to `https://zzyraai.com/settings/integrations`
2. Click "Connect" on Shopify card
3. Enter your test store domain (e.g., `anthor-ai.myshopify.com`)
4. Should redirect to Shopify authorization page
5. Click "Install app"
6. Should redirect back to integrations page with success message

### 3. Verify Database Storage
```sql
-- Check if connection was saved
SELECT * FROM store_connections WHERE platform = 'shopify' ORDER BY created_at DESC LIMIT 1;

-- Should return:
-- platform: 'shopify'
-- store_name: Your shop name
-- store_url: https://yourstore.myshopify.com
-- access_token: shpat_xxx (encrypted)
-- status: 'active'
```

### 4. Test API Connection
```bash
# Make a test API call to verify token works
curl https://zzyraai.com/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return products from connected Shopify store
```

---

## 🐛 Troubleshooting

### Issue: "Redirect URI mismatch"
**Cause**: Shopify app redirect URI doesn't match PRODUCTION_DOMAIN
**Solution**: 
1. Go to Shopify Partner Dashboard → Your App → App setup → URLs
2. Add EXACTLY: `https://zzyraai.com/api/shopify/callback`
3. Save and retry

### Issue: "Invalid HMAC signature"
**Cause**: SHOPIFY_API_SECRET is incorrect
**Solution**: Verify env variable matches Shopify Partner Dashboard

### Issue: "State token expired"
**Cause**: User took > 10 minutes to authorize
**Solution**: Try connecting again (state tokens expire after 10min)

### Issue: "Access token not saved"
**Cause**: Supabase storage error or network issue
**Solution**: Check logs for database errors

### Issue: User redirected back immediately
**Cause**: User input included protocol or invalid characters
**Solution**: Input sanitization should handle this automatically now

---

## 📝 Logging

### Backend Logs
All OAuth steps are logged with emoji indicators:
- 🔵 Info/debug messages
- ✅ Success messages  
- ❌ Error messages
- 📋 Step-by-step progress

**Example successful flow**:
```
🔵 SHOPIFY OAUTH CALLBACK RECEIVED
📋 Step 1: Validating required parameters...
✅ All required parameters present
📋 Step 2: Sanitizing shop domain...
✅ Shop domain validated
📋 Step 3: Verifying HMAC signature...
✅ HMAC verification passed
📋 Step 4: Validating OAuth state...
✅ State validated successfully
📋 Step 5: Exchanging authorization code for access token...
✅ Access token received: shpat_xxxxx...
📋 Step 6: Fetching shop information...
✅ Shop info received: Anthor AI Store
📋 Step 7: Saving connection to database...
✅ Connection created successfully
📋 Step 8: Registering GDPR webhooks...
✅ All mandatory webhooks registered successfully
📋 Step 9: Redirecting to success page...
```

---

## 🔒 Security Features

1. **HMAC Verification**: Every callback validates Shopify signature
2. **CSRF Protection**: State tokens prevent cross-site request forgery
3. **Credential Masking**: All logs mask sensitive API keys/tokens
4. **State Expiration**: OAuth states expire after 10 minutes
5. **Automatic Cleanup**: Expired states deleted every 10 minutes
6. **Secure Storage**: Access tokens encrypted at rest in database
7. **HTTPS Only**: All OAuth redirects use HTTPS

---

## ✅ Verification Checklist

- [x] Environment variables configured (SHOPIFY_API_KEY, SHOPIFY_API_SECRET, PRODUCTION_DOMAIN)
- [x] Shopify app redirect URI matches: `https://zzyraai.com/api/shopify/callback`
- [x] Database tables exist: `store_connections`, `oauth_states`
- [x] Frontend connect button working
- [x] Backend OAuth initiation endpoint working
- [x] Backend OAuth callback endpoint working
- [x] Token exchange implemented
- [x] Database storage implemented
- [x] GDPR webhooks registered
- [x] Success/error redirects working
- [x] Security validations in place (HMAC, state)
- [x] Error handling and logging complete

---

## 🎉 Summary

**The Shopify OAuth integration is 100% complete and production-ready.** All components are implemented:

1. ✅ Connect button with input sanitization
2. ✅ OAuth initiation with state generation
3. ✅ OAuth callback with HMAC verification
4. ✅ Authorization code → access token exchange
5. ✅ Token storage in `store_connections` table
6. ✅ GDPR webhook registration
7. ✅ Success/error handling

**No code changes needed** - just verify your configuration matches this guide and test the flow!

---

## 📞 Support

If you encounter issues:
1. Check logs in workflow console
2. Verify environment variables
3. Confirm Shopify app settings match this guide
4. Test with validation endpoint: `/api/shopify/validate-setup`
