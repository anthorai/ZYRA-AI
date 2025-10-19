# ZYRA Production Security Checklist

## ✅ Security Measures Already Implemented

### Authentication & Authorization
- ✅ Supabase Auth with JWT tokens
- ✅ Bearer token authentication middleware
- ✅ Session-based auth with timeout (30min inactivity)
- ✅ 2FA with TOTP (speakeasy)
- ✅ Bcrypt backup code hashing (10 salt rounds)
- ✅ Internal service token with localhost-only validation

### Data Encryption
- ✅ AES-256-GCM encryption for sensitive data
- ✅ OAuth tokens encrypted at rest
- ✅ API keys encrypted in database
- ✅ 2FA secrets encrypted

### Input Validation & Sanitization
- ✅ HTML sanitization (removes scripts, iframes, event handlers)
- ✅ SQL injection prevention
- ✅ Email validation
- ✅ URL sanitization
- ✅ express-validator middleware
- ✅ Zod schema validation

### Rate Limiting
- ✅ Auth endpoints: 5 requests/15 minutes
- ✅ API endpoints: 100 requests/15 minutes
- ✅ AI endpoints: 30 requests/hour
- ✅ Payment endpoints: 5 requests/15 minutes
- ✅ Campaign endpoints: 10 requests/hour
- ✅ Upload endpoints: 20 requests/hour

### Webhook Security
- ✅ Razorpay HMAC-SHA256 verification
- ✅ PayPal signature verification
- ✅ Shopify HMAC verification with timing-safe comparison
- ✅ Raw body preservation for signature validation

### API Security
- ✅ No sensitive data in error messages
- ✅ Proper error logging to database
- ✅ CORS configuration
- ✅ Socket address validation (no X-Forwarded-For spoofing)

---

## ⚠️  Production Requirements (Must Complete)

### 1. Environment Variables (CRITICAL)
Set these in production environment:

```bash
# Required for encryption (CRITICAL - generate new key!)
ENCRYPTION_KEY=<generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))">

# Database
DATABASE_URL=<production database URL>
SUPABASE_URL=<production Supabase URL>

# Auth
INTERNAL_SERVICE_TOKEN=<secure random token>

# Payment Gateways (PRODUCTION credentials)
RAZORPAY_KEY_ID=<production key>
RAZORPAY_KEY_SECRET=<production secret>
PAYPAL_CLIENT_ID=<production client ID>
PAYPAL_CLIENT_SECRET=<production secret>

# AI & Communications
OPENAI_API_KEY=<production key>
SENDGRID_API_KEY=<production key>
TWILIO_ACCOUNT_SID=<production SID>
TWILIO_AUTH_TOKEN=<production token>
TWILIO_PHONE_NUMBER=<production number>

# Shopify
SHOPIFY_API_KEY=<app API key>
SHOPIFY_API_SECRET=<app secret>

# Other
NODE_ENV=production
PORT=5000
```

### 2. OAuth State Storage (HIGH PRIORITY)
**Issue:** Currently uses in-memory Map (not suitable for multi-instance production)

**Solutions:**
- **Option A (Recommended):** Migrate to Supabase table
- **Option B:** Use Redis for state storage
- **Option C:** Accept single-instance limitation

**Location:** `server/routes.ts` line ~3845

### 3. Security Headers
Add helmet.js for production security headers:

```bash
npm install helmet
```

Add to `server/index.ts`:
```javascript
import helmet from 'helmet';
app.use(helmet());
```

### 4. CORS Production Configuration
Update CORS to only allow production domains:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : true,
  credentials: true
};
app.use(cors(corsOptions));
```

### 5. Rate Limit Adjustments
Review and adjust based on actual usage:
- Monitor API usage patterns
- Adjust limits for paying vs free users
- Consider IP-based vs user-based limiting

---

## 🔒 Additional Hardening Recommendations

### 1. Content Security Policy (CSP)
Add CSP headers to prevent XSS:
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.openai.com"]
  }
}));
```

### 2. HSTS (HTTP Strict Transport Security)
Force HTTPS in production:
```javascript
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));
```

### 3. Session Security
Verify session cookie settings:
```javascript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 60 * 1000 // 30 minutes
}
```

### 4. API Key Rotation
Implement periodic rotation for:
- Encryption keys (quarterly)
- API keys (bi-annually)
- OAuth secrets (annually)

### 5. Audit Logging
Enhanced logging for security events:
- Failed login attempts
- Permission changes
- API key access
- Admin actions
- Payment transactions

---

## 🔍 Security Testing Checklist

### Before Production Launch

- [ ] Run security scan (npm audit)
- [ ] Test all rate limiters
- [ ] Verify HTTPS/TLS certificate
- [ ] Test webhook signature verification
- [ ] Verify no secrets in logs
- [ ] Check error messages don't leak info
- [ ] Test CORS from production domains
- [ ] Verify encryption key is set
- [ ] Test OAuth flows end-to-end
- [ ] Verify 2FA working correctly
- [ ] Test password reset flow
- [ ] Check all environment variables set
- [ ] Verify database connection pooling
- [ ] Test under load
- [ ] Review all admin endpoints

### Penetration Testing Areas
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF attacks
- [ ] Session hijacking
- [ ] Rate limit bypass
- [ ] Authentication bypass
- [ ] Authorization escalation
- [ ] Webhook replay attacks

---

## 📋 Compliance Requirements

### GDPR
- ✅ Data export endpoint
- ✅ Data deletion endpoint  
- ✅ Privacy policy
- ✅ Email opt-out
- [ ] Cookie consent (if using analytics)

### PCI DSS
- ✅ No credit card data stored locally
- ✅ Using certified payment processors (Razorpay, PayPal)
- ✅ TLS/HTTPS for all transactions
- [ ] Regular security audits

---

## 🚨 Incident Response Plan

### If Security Breach Detected:

1. **Immediate Actions:**
   - Rotate all API keys
   - Invalidate all sessions
   - Enable maintenance mode
   - Preserve logs

2. **Investigation:**
   - Review error logs
   - Check access logs
   - Identify scope of breach
   - Document timeline

3. **Remediation:**
   - Patch vulnerability
   - Notify affected users
   - Report to authorities if required
   - Update security measures

4. **Prevention:**
   - Conduct post-mortem
   - Update security policies
   - Enhance monitoring
   - Train team

---

## 📞 Security Contacts

- **Razorpay Security:** security@razorpay.com
- **PayPal Security:** https://www.paypal.com/security
- **Supabase Security:** security@supabase.io
- **OpenAI Security:** security@openai.com

---

**Last Updated:** October 19, 2025  
**Status:** Production-Ready with noted improvements
