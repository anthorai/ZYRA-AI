# 🧪 Zyra AI - Complete Feature Testing Plan

## Overview
This guide walks you through testing every feature of your Zyra AI application in the optimal order, ensuring each component works correctly before testing dependent features.

**Estimated Total Time:** 2-3 hours for complete testing

---

## Phase 1: Foundation Testing (15 minutes)

### 1.1 Authentication System ✅
**Goal:** Verify user authentication works correctly

**Steps:**
1. **Sign Up New User**
   - Navigate to `/auth`
   - Click "Sign up"
   - Enter new email and password
   - ✅ Expected: Account created, redirected to dashboard
   - ✅ Check: Welcome email sent (if configured)

2. **Sign Out & Sign In**
   - Click profile menu → Sign Out
   - Sign in with same credentials
   - ✅ Expected: Successfully logged in, session persists

3. **Password Reset Flow**
   - Sign out
   - Click "Forgot password?"
   - Enter email address
   - ✅ Expected: Password reset email sent
   - ✅ Check: Can reset password via link

4. **Two-Factor Authentication (Optional)**
   - Go to Settings → Security
   - Enable 2FA/TOTP
   - Scan QR code with authenticator app
   - Sign out and sign in again
   - Enter 2FA code
   - ✅ Expected: 2FA verification works

---

## Phase 2: Shopify Integration (20 minutes)

### 2.1 Connect Shopify Store ✅
**Goal:** Establish connection and verify currency detection

**Prerequisites:** You need a Shopify store (can use Shopify Partners test store)

**Steps:**
1. **OAuth Connection**
   - Navigate to Settings → Integrations
   - Click "Connect Shopify Store"
   - Authorize the app in Shopify admin
   - ✅ Expected: Redirected back with success message
   - ✅ Check: Store name appears in UI
   - ✅ **CRITICAL**: Verify your store's currency is detected correctly
     - Go to Settings → Store Connections
     - Check that currency shows as INR/USD/EUR/etc (your store's currency)

2. **Product Sync**
   - After connection, products should sync automatically
   - ✅ Expected: Products appear in Products page within 1-2 minutes
   - ✅ Check: Product titles, prices, images synced correctly
   - ✅ Check: Product count matches Shopify store

3. **Manual Sync Trigger**
   - Go to Products page
   - Click "Sync Products" button
   - ✅ Expected: Sync status updates, new products appear
   - ✅ Check: Last sync timestamp updates

**Troubleshooting:**
- If products don't sync: Check browser console for errors
- If currency is null/undefined: Verify Shopify store has currency set
- If OAuth fails: Check SHOPIFY_API_KEY and SHOPIFY_API_SECRET environment variables

---

## Phase 3: AI-Powered Features (30 minutes)

### 3.1 Product Description Generation ✅
**Goal:** Test AI copywriting capabilities

**Steps:**
1. **Fast Mode (GPT-4o-mini with streaming)**
   - Go to Products page
   - Select a product
   - Click "Generate Description"
   - Choose "Fast Mode"
   - ✅ Expected: Description streams in real-time (5-10 seconds)
   - ✅ Check: Description is professional and relevant
   - ✅ Check: Maintains brand voice if set

2. **Quality Mode (GPT-4o multi-agent)**
   - Select same product
   - Click "Generate Description"
   - Choose "Quality Mode"
   - ✅ Expected: Takes 20-30 seconds (more detailed)
   - ✅ Check: Higher quality, more engaging copy
   - ✅ Check: Includes features, benefits, and emotional hooks

3. **SEO Optimization**
   - Select a product
   - Click "Optimize SEO"
   - ✅ Expected: Meta title, description, and keywords generated
   - ✅ Check: Meta title is 50-60 characters
   - ✅ Check: Meta description is 150-160 characters
   - ✅ Check: Keywords are relevant

4. **Image Alt-Text Generation**
   - Select product with images
   - Click "Generate Alt Text"
   - ✅ Expected: Alt text created for all product images
   - ✅ Check: Alt text is descriptive and includes product name

5. **Bulk Product Optimization**
   - Select multiple products (checkbox)
   - Click "Bulk Optimize"
   - ✅ Expected: Progress bar shows optimization status
   - ✅ Check: All selected products optimized
   - ✅ Check: Products marked as "isOptimized: true"

**Expected Costs:**
- Fast Mode: ~$0.01-0.02 per product
- Quality Mode: ~$0.05-0.10 per product

---

## Phase 4: ROI Tracking Dashboard ⭐ (15 minutes)

### 4.1 Multi-Currency Revenue Display ✅
**Goal:** Verify ROI dashboard shows revenue in store's native currency

**Steps:**
1. **Access ROI Dashboard**
   - Navigate to Dashboard (home page)
   - Locate "Revenue Generated This Month" card
   - ✅ **CRITICAL**: Verify currency symbol matches your store
     - Indian store: Should show ₹ (Rupee symbol)
     - US store: Should show $ (Dollar symbol)
     - EU store: Should show € (Euro symbol)
     - UK store: Should show £ (Pound symbol)

2. **Revenue Breakdown**
   - Check revenue breakdown shows:
     - Cart Recovery: ₹/$/€ X.XX
     - Marketing Campaigns: ₹/$/€ X.XX
     - AI Optimization: ₹/$/€ X.XX
   - ✅ Expected: All amounts formatted with correct currency
   - ✅ Check: Percentages add up to 100%

3. **Month-over-Month Comparison**
   - Check comparison section
   - ✅ Expected: Shows change vs last month
   - ✅ Check: Trend indicator (up/down arrow) correct

**Testing Tip:** Since you're new, revenue will be $0.00 initially. You'll need to generate revenue through cart recovery or campaigns to see real data.

---

## Phase 5: Cart Recovery Automation (25 minutes)

### 5.1 Abandoned Cart Setup ✅
**Goal:** Test automated cart recovery system

**Prerequisites:** 
- Shopify store connected
- Email/SMS credentials configured (SendGrid, Twilio)

**Steps:**
1. **Create Test Abandoned Cart**
   - In Shopify admin, create a test customer
   - Add items to cart but don't complete purchase
   - ✅ Expected: Abandoned cart appears in Zyra AI within 1 hour
   - ✅ Check: Cart value calculated correctly
   - ✅ Check: Cart items listed

2. **Automated Recovery Email**
   - Wait for hourly cart recovery scan (runs at :00 of each hour)
   - ✅ Expected: Recovery email sent automatically
   - ✅ Check: Email template renders correctly
   - ✅ Check: Cart recovery link works

3. **SMS Recovery (if configured)**
   - Enable SMS for cart recovery
   - ✅ Expected: SMS sent after email (escalation)
   - ✅ Check: SMS includes cart link
   - ✅ Check: SMS sent to correct phone number

4. **Recovery Attribution**
   - Use recovery link to complete purchase
   - ✅ Expected: Cart marked as "recovered"
   - ✅ Check: Revenue attributed to cart recovery
   - ✅ **Check: Revenue appears in ROI dashboard in store's currency**

**Configuration Required:**
- Settings → Notifications → Enable cart recovery
- Settings → API Keys → Configure SendGrid (email)
- Settings → API Keys → Configure Twilio (SMS)

---

## Phase 6: Marketing Campaigns (30 minutes)

### 6.1 Email Campaigns ✅
**Goal:** Test email marketing automation

**Steps:**
1. **Create Email Campaign**
   - Navigate to Marketing → Campaigns
   - Click "Create Campaign"
   - Select "Email" type
   - Choose template (Welcome, Promo, etc.)
   - Customize subject, content
   - ✅ Expected: Campaign saved as draft

2. **Send Test Email**
   - Click "Send Test"
   - Enter your email
   - ✅ Expected: Test email delivered
   - ✅ Check: Email renders correctly
   - ✅ Check: Links work
   - ✅ Check: Unsubscribe link works

3. **Schedule Campaign**
   - Set future send date/time
   - ✅ Expected: Campaign status = "scheduled"
   - ✅ Check: Shows in scheduled campaigns list
   - ✅ Check: Sends at scheduled time

4. **Campaign Analytics**
   - After campaign sends, check analytics
   - ✅ Expected: Shows open rate, click rate
   - ✅ Check: Revenue attribution tracked
   - ✅ **Check: Revenue from campaign appears in ROI dashboard in store's currency**

### 6.2 SMS Campaigns ✅
**Steps:**
1. **Create SMS Campaign**
   - Click "Create Campaign" → SMS
   - Write message (160 char limit)
   - ✅ Expected: Character counter updates
   - ✅ Check: Preview shows correctly

2. **Send Test SMS**
   - Click "Send Test"
   - Enter phone number
   - ✅ Expected: SMS delivered
   - ✅ Check: Links shortened correctly

3. **Track Performance**
   - Check campaign stats after sending
   - ✅ Expected: Shows delivery rate
   - ✅ Check: Click-through tracking works

---

## Phase 7: Autonomous AI Store Manager (20 minutes)

### 7.1 Autonomous Mode ✅
**Goal:** Test AI automation and manual approval modes

**Steps:**
1. **Configure Automation Settings**
   - Navigate to Settings → Automation
   - Toggle "Master Automation Control"
   - Choose mode:
     - **Autonomous Mode**: AI acts automatically
     - **Manual Approval Mode**: AI proposes, you approve
   - ✅ Expected: Mode saved successfully

2. **Autonomous SEO Audit (Runs daily at 2 AM)**
   - Enable autonomous SEO
   - Create/edit autonomous SEO rules
   - ✅ Expected: Rules saved
   - ✅ Check: Next run time shows correctly
   - **Testing Tip:** You can manually trigger audit instead of waiting

3. **Pending Approvals Queue** (Manual Mode only)
   - Set to Manual Approval Mode
   - AI generates recommendations
   - Navigate to Approvals → Pending
   - ✅ Expected: Shows AI recommendations
   - ✅ Check: Can approve or reject each item
   - ✅ Check: Approved items execute correctly

4. **Safety Guardrails**
   - Try to create rule that would affect too many products
   - ✅ Expected: System shows warning
   - ✅ Check: Frequency caps enforced
   - ✅ Check: Quiet hours respected

5. **Audit Trail**
   - Check activity log
   - ✅ Expected: All autonomous actions logged
   - ✅ Check: Shows who/what/when for each action
   - ✅ Check: Can rollback if needed

---

## Phase 8: Analytics & Reporting (20 minutes)

### 8.1 Growth Dashboard ✅
**Goal:** Verify analytics and reporting features

**Steps:**
1. **Revenue Trends Chart**
   - Navigate to Dashboard → Analytics
   - View revenue trends (daily/weekly/monthly)
   - ✅ Expected: Charts render correctly
   - ✅ **Check: Y-axis shows currency in store's format (₹/$/€)**
   - ✅ Check: Can toggle between time periods

2. **Campaign Performance Stats**
   - View campaign analytics dashboard
   - ✅ Expected: Shows all campaigns
   - ✅ Check: Open rates, click rates accurate
   - ✅ Check: Revenue attribution tracked
   - ✅ **Check: Revenue values in store's currency**

3. **Export Reports**
   - Click "Export PDF" or "Export CSV"
   - ✅ Expected: Report downloads
   - ✅ Check: PDF formatted correctly
   - ✅ Check: CSV includes all data
   - ✅ **Check: Exported data shows correct currency**

4. **Real-time Updates**
   - Keep dashboard open
   - Make a change (e.g., mark cart as recovered)
   - ✅ Expected: Dashboard updates without refresh
   - ✅ Check: Changes reflect within 30 seconds

---

## Phase 9: Payment System (15 minutes)

### 9.1 Subscription Flow ✅
**Goal:** Test PayPal payment integration

**Prerequisites:** PayPal sandbox or live credentials configured

**Steps:**
1. **Free Trial Activation**
   - New user signs up
   - ✅ Expected: 7-day free trial activated automatically
   - ✅ Check: Trial end date shows correctly
   - ✅ Check: All features accessible during trial

2. **Plan Selection**
   - Navigate to Settings → Billing
   - View available plans (Starter, Growth, Pro)
   - ✅ Expected: Plans show features and pricing in USD
   - ✅ Check: Current plan highlighted

3. **Checkout Flow** (Use PayPal Sandbox for testing)
   - Click "Upgrade to Growth"
   - ✅ Expected: Redirected to PayPal checkout
   - ✅ Check: Amount correct ($49/month)
   - Complete PayPal payment
   - ✅ Expected: Redirected back to app
   - ✅ Check: Plan upgraded successfully

4. **Webhook Processing**
   - After payment, check logs
   - ✅ Expected: PayPal webhook received
   - ✅ Check: Subscription status updated
   - ✅ Check: Trial end date cleared

5. **Trial Expiration Notifications**
   - Navigate to Settings → Notifications
   - ✅ Check: Trial expiration emails configured
   - ✅ Expected: Receives notifications at 7, 3, 1 days before expiry

**Testing Tip:** Use PayPal sandbox account to avoid real charges

---

## Phase 10: Notification System (15 minutes)

### 10.1 Notification Preferences ✅
**Goal:** Test multi-channel notifications

**Steps:**
1. **Configure Preferences**
   - Navigate to Settings → Notifications
   - Review notification types:
     - In-App notifications
     - Email notifications
     - SMS notifications
     - Push notifications
   - Toggle each type on/off
   - ✅ Expected: Preferences saved
   - ✅ Check: Can enable/disable per notification type

2. **In-App Notifications**
   - Trigger an event (e.g., product optimized)
   - ✅ Expected: Bell icon shows unread count
   - ✅ Check: Notification appears in dropdown
   - ✅ Check: Click notification navigates correctly

3. **Email Notifications**
   - Trigger event that sends email
   - ✅ Expected: Email delivered
   - ✅ Check: Email template renders correctly
   - ✅ Check: Unsubscribe link works

4. **SMS Notifications** (if configured)
   - Trigger SMS-enabled event
   - ✅ Expected: SMS delivered
   - ✅ Check: Message formatted correctly

---

## Phase 11: End-to-End Revenue Flow (30 minutes)

### 11.1 Complete Revenue Attribution Test ✅
**Goal:** Verify revenue flows from all sources to ROI dashboard in correct currency

**Steps:**
1. **Generate Revenue from Cart Recovery**
   - Create abandoned cart
   - Wait for recovery email
   - Complete purchase via recovery link
   - ✅ **Expected: Revenue appears in ROI dashboard under "Cart Recovery" in store's currency**

2. **Generate Revenue from Campaign**
   - Send email campaign to customers
   - Track clicks and purchases
   - ✅ **Expected: Revenue appears in ROI dashboard under "Marketing Campaigns" in store's currency**

3. **Generate Revenue from AI Optimization**
   - Optimize product descriptions
   - Track sales of optimized products
   - ✅ **Expected: Revenue lift appears in ROI dashboard under "AI Optimization" in store's currency**

4. **Verify Total Revenue**
   - Check ROI Summary Card
   - ✅ **Expected: Total = Cart Recovery + Campaigns + AI Optimization**
   - ✅ **Check: All amounts in store's native currency (₹, €, $, £)**
   - ✅ Check: Month-over-month comparison accurate

---

## 🎯 Success Criteria Checklist

After completing all phases, verify these critical success criteria:

### Authentication ✅
- [ ] Can sign up, sign in, sign out
- [ ] Password reset works
- [ ] Session persists across refreshes
- [ ] 2FA works (if enabled)

### Shopify Integration ✅
- [ ] Store connects successfully
- [ ] **Store currency detected correctly (INR/USD/EUR/GBP/etc.)**
- [ ] Products sync automatically
- [ ] Manual sync works
- [ ] Product data accurate

### AI Features ✅
- [ ] Product descriptions generate correctly
- [ ] SEO optimization works
- [ ] Alt-text generation works
- [ ] Bulk operations complete successfully
- [ ] Brand voice maintained

### **ROI Tracking** ⭐ **Most Critical** ✅
- [ ] **Revenue displays in store's native currency**
- [ ] **Currency symbol correct (₹, €, $, £)**
- [ ] **All amounts formatted properly (₹1,234.56)**
- [ ] Revenue breakdown accurate
- [ ] Month-over-month comparison works
- [ ] Real-time updates working

### Cart Recovery ✅
- [ ] Abandoned carts detected
- [ ] Recovery emails sent automatically
- [ ] SMS escalation works (if configured)
- [ ] **Revenue attributed correctly in store's currency**

### Marketing Campaigns ✅
- [ ] Email campaigns send successfully
- [ ] SMS campaigns deliver
- [ ] Analytics track correctly
- [ ] **Campaign revenue shown in store's currency**

### Autonomous AI ✅
- [ ] Automation modes switch correctly
- [ ] SEO audits run successfully
- [ ] Pending approvals queue works
- [ ] Safety guardrails active
- [ ] Audit trail complete

### Analytics & Reports ✅
- [ ] **Charts show currency in store's format**
- [ ] Export functions work (PDF, CSV)
- [ ] **Exported data has correct currency**
- [ ] Real-time updates functioning

### Payment System ✅
- [ ] Free trial activates automatically
- [ ] PayPal checkout works
- [ ] Webhooks process correctly
- [ ] Trial notifications sent

### Notifications ✅
- [ ] In-app notifications appear
- [ ] Email notifications send
- [ ] SMS notifications deliver (if configured)
- [ ] Preferences save correctly

---

## 🚨 Common Issues & Troubleshooting

### Issue: Store Currency Not Detected
**Solution:**
1. Check Shopify store has currency set in Settings → General
2. Disconnect and reconnect Shopify store
3. Check browser console for errors during OAuth
4. Verify `/api/shopify/callback` receives currency from Shopify API

### Issue: Products Not Syncing
**Solution:**
1. Check Shopify access token is valid
2. Verify Shopify API scopes include `read_products`
3. Check server logs for sync errors
4. Run manual sync from Products page

### Issue: AI Features Slow or Failing
**Solution:**
1. Verify OpenAI API key is configured
2. Check API quota/limits not exceeded
3. Switch to Fast Mode if Quality Mode times out
4. Check server logs for OpenAI errors

### Issue: Revenue Attribution Not Working
**Solution:**
1. Verify `revenue_attribution` table exists in database
2. Check Shopify webhooks are configured correctly
3. Verify webhook endpoints responding with 200 OK
4. Check conversion tracking code is active

### Issue: Wrong Currency Displayed
**Solution:**
1. Check `store_connections.currency` field in database
2. Verify Shopify store currency matches expected
3. Clear browser cache and refresh
4. Check API response includes correct currency

### Issue: Emails Not Sending
**Solution:**
1. Verify SendGrid API key configured
2. Check sender email verified in SendGrid
3. Review email logs in SendGrid dashboard
4. Check spam folder

---

## 📊 Test Data Recommendations

For realistic testing, use these data sets:

### Test Products
- Create 10-20 products in Shopify
- Mix of different categories
- Include products with/without images
- Vary price ranges ($10-$500)

### Test Customers
- Create 5-10 test customers
- Include different email domains
- Add phone numbers for SMS testing
- Vary customer locations

### Test Orders
- Create 3-5 completed orders
- Create 2-3 abandoned carts
- Mix of single and multi-item orders
- Different payment methods

---

## ✅ Testing Complete!

Once you've verified all success criteria, your Zyra AI application is fully functional and ready for production use.

**Key Achievement:** Your ROI dashboard now displays all revenue in your merchants' native currencies (INR, USD, EUR, GBP, etc.), making it the ultimate retention tool by showing concrete value in language merchants understand!

---

## 📝 Next Steps

1. **Monitor Production:** Keep an eye on error logs and user feedback
2. **Optimize Performance:** Review slow queries and API calls
3. **Gather Metrics:** Track actual conversion rates and ROI
4. **Iterate Features:** Based on merchant feedback
5. **Scale Infrastructure:** As user base grows

Happy Testing! 🚀
