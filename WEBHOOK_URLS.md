# Webhook URLs Reference

## Production Domain
```
https://zzyraai.com
```

## Shopify Webhooks (Mandatory Compliance)
All Shopify webhooks are automatically registered during app installation.

| Topic | Webhook URL | Purpose |
|-------|-------------|---------|
| app/uninstalled | `https://zzyraai.com/api/webhooks/shopify/app_uninstalled` | Handle app uninstallation |
| customers/data_request | `https://zzyraai.com/api/webhooks/shopify/customers/data_request` | GDPR data request |
| customers/redact | `https://zzyraai.com/api/webhooks/shopify/customers/redact` | GDPR customer redaction |
| shop/redact | `https://zzyraai.com/api/webhooks/shopify/shop/redact` | GDPR shop redaction |
| orders/paid | `https://zzyraai.com/api/webhooks/shopify/orders/paid` | Order payment completed |

## Shopify Compliance Webhook (Manual)
| Webhook URL | Purpose |
|-------------|---------|
| `https://zzyraai.com/api/webhooks/compliance` | Shopify compliance verification |

## Shopify Custom Webhooks
| Topic | Webhook URL | Purpose |
|-------|-------------|---------|
| behavior | `https://zzyraai.com/api/webhooks/shopify/behavior` | Custom behavioral tracking |

## Payment Gateway Webhooks

### PayPal Webhook
```
POST https://zzyraai.com/api/webhooks/paypal
```

**Configuration:**
- Event Types: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.DECLINED, PAYMENT.CAPTURE.REFUNDED
- Signature Verification: Enabled (HMAC-SHA256)
- Environment: `PAYPAL_WEBHOOK_ID` (required)

### Razorpay Webhook
```
POST https://zzyraai.com/api/webhooks/razorpay
```

**Configuration:**
- Event Types: payment.authorized, payment.failed
- Signature Verification: Enabled

## Admin Endpoints

### Manual Webhook Registration
```
POST https://zzyraai.com/api/shopify/webhooks/register
```
**Authentication:** Required (JWT token)
**Purpose:** Manually re-register Shopify webhooks if needed

### Webhook Verification Status
```
GET https://zzyraai.com/api/shopify/webhooks/verify
```
**Authentication:** Required (JWT token)
**Purpose:** Verify all webhooks are properly registered

## Files

- **Main Webhook Handler**: `server/paypal.ts`
- **Shopify Webhooks Config**: `server/lib/shopify-webhooks.ts`
- **Route Definitions**: `server/routes.ts`
- **Shopify Auth Middleware**: `server/middleware/shopifyWebhookAuth.ts`
- **Razorpay Handler**: `server/razorpay.ts`

## Setup Instructions

1. **Shopify**: Webhooks auto-register during OAuth flow
2. **PayPal**: 
   - Add `PAYPAL_WEBHOOK_ID` to environment variables
   - Register webhook in PayPal Dashboard
3. **Razorpay**: Configure webhook in Razorpay Dashboard pointing to the Razorpay webhook URL

## Testing Webhooks Locally

For development, use `ngrok` or similar tunnel service:
```bash
ngrok http 5000
# Update webhook URLs with ngrok domain
```
