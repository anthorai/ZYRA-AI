# Zyra AI - Pre-Deployment Testing Checklist

**Last Updated:** October 24, 2025  
**Status:** Ready for Testing

---

## 🎯 Critical Features to Test Before Production

### 1. ✅ Authentication & User Management

#### User Signup
- [ ] Create new account with email/password
- [ ] Verify email validation works
- [ ] Check password strength requirements
- [ ] Confirm user is redirected to dashboard after signup
- [ ] Verify test user gets 7-Day Free Trial plan

#### User Login
- [ ] Log in with valid credentials
- [ ] Test invalid password shows error
- [ ] Test invalid email shows error
- [ ] Verify session persists after page refresh
- [ ] Check "Remember Me" functionality

#### Password Reset
- [ ] Click "Forgot Password" link
- [ ] Enter email and request reset
- [ ] Check email received (SendGrid)
- [ ] Click reset link and set new password
- [ ] Log in with new password

#### User Profile
- [ ] View profile page
- [ ] Update display name
- [ ] Upload profile picture
- [ ] Change language preference
- [ ] Log out successfully

---

### 2. 💳 Payment & Subscription System

#### PayPal Integration
- [ ] Click "Upgrade" on Starter plan ($49/month)
- [ ] Verify checkout page loads correctly
- [ ] Check PayPal button displays "Zyra AI" branding
- [ ] See plan details: "Starter Plan - Monthly Subscription"
- [ ] Complete test payment (use PayPal sandbox)
- [ ] Verify payment confirmation page
- [ ] Check subscription activated in database
- [ ] Verify credits added to account (1,000 for Starter)

#### Subscription Management
- [ ] View current plan on Billing page
- [ ] See subscription status (Active/Trial/Expired)
- [ ] Check next billing date displayed
- [ ] View payment history
- [ ] Test upgrade from Starter to Growth plan
- [ ] Verify pro-rated billing calculation

---

### 3. 🤖 AI Product Optimization

#### Product Description Generator
- [ ] Go to Product Optimization page
- [ ] Enter product details (title, category, keywords)
- [ ] Click "Generate Description"
- [ ] Verify AI generates professional copy
- [ ] Check description follows brand voice
- [ ] See SEO keywords incorporated
- [ ] Save optimized product
- [ ] Verify credits deducted (100 credits)

#### SEO Optimization
- [ ] Select existing product
- [ ] Click "Optimize SEO"
- [ ] Verify title optimized for keywords
- [ ] Check meta description generated
- [ ] See keyword density analysis
- [ ] Test bulk SEO optimization (5+ products)
- [ ] Verify cache hit on second request (faster response)

#### Image Alt-Text Generator
- [ ] Upload product image
- [ ] Click "Generate Alt Text"
- [ ] Verify AI describes image accurately
- [ ] Check accessibility compliance
- [ ] See SEO keywords included
- [ ] Test with multiple images

---

### 4. 📧 Email Marketing & Automation

#### Campaign Creation
- [ ] Navigate to Campaigns page
- [ ] Click "Create New Campaign"
- [ ] Select email template
- [ ] Customize subject line and content
- [ ] Preview email in different devices
- [ ] Add recipient segments
- [ ] Schedule campaign for specific time
- [ ] Save draft

#### Email Delivery (SendGrid)
- [ ] Send test email to your address
- [ ] Verify email received in inbox
- [ ] Check "From" name shows "Zyra AI"
- [ ] Test email rendering in Gmail/Outlook
- [ ] Click links in email work correctly
- [ ] Verify unsubscribe link present

#### Campaign Analytics
- [ ] View sent campaign statistics
- [ ] Check open rate tracking
- [ ] See click-through rate (CTR)
- [ ] Verify revenue attribution
- [ ] Export campaign report (CSV/PDF)

---

### 5. 📱 SMS Marketing & Abandoned Cart Recovery

#### SMS Campaign Setup (Twilio)
- [ ] Create SMS campaign
- [ ] Enter message content (160 char limit)
- [ ] Add phone number segments
- [ ] Preview SMS format
- [ ] Send test SMS to your phone
- [ ] Verify SMS received from Twilio number
- [ ] Check character count and pricing

#### Abandoned Cart Recovery
- [ ] Add item to cart (simulate Shopify)
- [ ] Leave cart without purchasing
- [ ] Wait for trigger delay (5 minutes)
- [ ] Check SMS sent automatically
- [ ] Verify personalized cart link in SMS
- [ ] Click recovery link
- [ ] Complete purchase and verify tracking

---

### 6. 📊 Analytics & Dashboard

#### Growth Dashboard
- [ ] View main dashboard
- [ ] Check revenue metrics display
- [ ] See campaign performance stats
- [ ] Verify conversion rate calculations
- [ ] Test date range filter (7d, 30d, 90d)
- [ ] Export dashboard data (PDF)

#### AI Cache Performance
- [ ] Make API request to `/api/analytics/ai-cache-stats`
- [ ] Verify cache hit rate displayed
- [ ] Check estimated cost savings
- [ ] See total requests and cache efficiency
- [ ] Test cache invalidation on content update

#### Campaign ROI Tracking
- [ ] View campaign comparison chart
- [ ] Check ROI percentage accurate
- [ ] See revenue per campaign
- [ ] Verify cost tracking
- [ ] Filter by campaign type (Email/SMS)

---

### 7. 🔐 Security & Performance

#### CORS & Security Headers
- [ ] Open browser DevTools → Network
- [ ] Check CORS headers on API requests
- [ ] Verify `Access-Control-Allow-Origin` matches production domain
- [ ] See security headers (CSP, HSTS, X-Frame-Options)
- [ ] Test CSRF protection on form submissions

#### Rate Limiting
- [ ] Make rapid API requests (10+ per second)
- [ ] Verify rate limit error (429 status)
- [ ] Check error message clear
- [ ] Wait for reset and retry
- [ ] Test auth endpoint limits (5 per 15min)

#### Performance Optimization
- [ ] Check page load time (<2 seconds)
- [ ] Verify images lazy-loaded
- [ ] See static assets cached (1 year)
- [ ] Test Gzip compression enabled
- [ ] Check bundle size optimized (<500KB JS)

---

### 8. 🔗 Shopify Integration (Optional)

#### OAuth Connection
- [ ] Click "Connect Shopify Store"
- [ ] Authorize app in Shopify
- [ ] Verify redirect back to Zyra
- [ ] Check store connected status
- [ ] See store name displayed

#### Product Sync
- [ ] Trigger manual product sync
- [ ] Verify products imported from Shopify
- [ ] Check product details accurate
- [ ] Test bidirectional sync (update in Zyra → Shopify)
- [ ] Verify scheduled sync runs every 10 minutes

---

## 🚨 Critical Issues to Fix Before Launch

### High Priority
- [ ] All payment flows complete successfully
- [ ] User authentication never fails
- [ ] AI features generate quality content
- [ ] Email/SMS delivery 100% reliable
- [ ] CORS allows production domain requests

### Medium Priority
- [ ] Dashboard loads in <2 seconds
- [ ] All forms validate correctly
- [ ] Error messages user-friendly
- [ ] Mobile responsive on all pages
- [ ] Cache hit rate >60% for AI requests

### Low Priority
- [ ] Dark mode consistent across pages
- [ ] Tooltips explain all features
- [ ] Loading states show on all async actions
- [ ] Success toasts appear on all mutations
- [ ] Analytics export formats correctly

---

## 📝 Test Scenarios

### Happy Path (Everything Works)
1. Sign up → Upgrade to Starter → Optimize 10 products → Send email campaign → View ROI
2. Expected result: All features work seamlessly, credits deducted correctly

### Error Handling
1. Try payment with invalid card → See user-friendly error
2. Submit empty form → See validation errors
3. Make 20 requests in 1 second → See rate limit message
4. Upload 10MB image → See file size error

### Edge Cases
1. Sign up with existing email → See "Email already exists"
2. Try to use feature without credits → See upgrade prompt
3. Schedule campaign in past → See validation error
4. Connect already-connected Shopify store → See "Already connected"

---

## ✅ Deployment Readiness Checklist

### Environment Configuration
- [ ] All required Replit Secrets added (see PRODUCTION_CONFIG.md):
  - [ ] `PRODUCTION_DOMAIN=https://zzyraai.com`
  - [ ] `REPLIT_DOMAIN=https://e27e6f72-6959-4e40-b028-11b38051e867-00-3ofd3wmcf6mca.spock.replit.dev`
  - [ ] `VITE_SUPABASE_URL=https://uqahonxcssfxrlmynrjo.supabase.co`
  - [ ] `VITE_SUPABASE_ANON_KEY=<copy exact value from SUPABASE_ANON_KEY secret>`
  - [ ] `PAYPAL_WEBHOOK_ID=WH-XXXXX...` (follow setup steps in PRODUCTION_CONFIG.md)
- [ ] Production build completed (`npm run build:all`)

### API Keys & Services
- [ ] SendGrid API key working
- [ ] Twilio credentials verified
- [ ] PayPal Client ID/Secret correct
- [ ] OpenAI API key has credits
- [ ] Supabase database accessible
- [ ] Redis cache connected (optional)

### DNS & Domain
- [ ] Domain `zzyraai.com` purchased
- [ ] DNS A record points to Replit deployment
- [ ] SSL certificate auto-generated by Replit
- [ ] Custom domain verified in Replit

### Final Checks
- [ ] No console errors on any page
- [ ] All images load correctly
- [ ] No TypeScript/build errors
- [ ] Database migrations run successfully
- [ ] Logs show no critical errors

---

## 🎯 Success Criteria

Your production deployment is ready when:
- ✅ User can sign up, pay, and use all features
- ✅ AI generates high-quality content consistently
- ✅ Email/SMS delivery 100% reliable
- ✅ Dashboard shows accurate analytics
- ✅ No critical bugs in 1-hour testing session
- ✅ Performance <2 second page loads
- ✅ Security headers and CORS configured correctly

---

**Document Version:** 1.0  
**Next Review:** After first production deployment
