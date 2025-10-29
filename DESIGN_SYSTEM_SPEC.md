# Zyra AI Design System Specifications

## Dashboard Reference Design

This document captures the authoritative design specifications from the Dashboard component to ensure UI consistency across the entire application.

### Color Palette

#### Primary Colors
- **Primary (Cyan):** `hsl(184, 100%, 50%)` (#00F0FF)
- **Accent:** `hsl(171, 100%, 50%)` (#00FFE5)
- **Background:** `hsl(240, 31%, 9%)` (#0D0D1F)
- **Card Background:** `hsl(240, 33%, 13%)` (#14142B)

#### Neutral Colors
- **White:** #FFFFFF
- **Text Primary:** #EAEAEA
- **Text Muted:** text-slate-300 / #94a3b8
- **Border:** `hsl(240, 15%, 25%)`

### Typography

#### Font Family
- **Primary:** 'Inter', sans-serif
- **Monospace:** 'JetBrains Mono', monospace

#### Page Headers
- **Title:** `font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl`
- **Subtitle:** `text-slate-300 text-xs sm:text-sm lg:text-base`

#### Card Typography
- **Card Title:** `text-white` (from CardTitle component)
- **Card Description:** `text-slate-300` (from CardDescription component)

### Layout Specifications

#### Page Header Container
```css
className="gradient-surface border-b border-border px-4 sm:px-6 py-3 sm:py-4"
```

#### Page Content Container
```css
className="flex-1 p-4 sm:p-6"
```

#### Responsive Container Padding
- **Mobile (default):** px-4
- **Small (sm:):** px-6
- **Large (lg:):** px-8

### Card Specifications

#### Standard Card (gradient-card)
```css
background: #14142B
border: 1px solid rgba(0, 240, 255, 0.2)
border-radius: 16px
backdrop-filter: blur(10px)
```

#### Card Implementation Classes
- **Base:** `gradient-card`
- **Rounded:** `rounded-xl sm:rounded-2xl` (small cards) or `rounded-2xl` (large cards)
- **Padding:** `p-3 sm:p-4 md:p-6`
- **Shadow:** `shadow-lg border border-slate-700/50`
- **Hover:** `hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300`
- **Hover Transform:** `hover:transform hover:translateY(-3px)`

#### Card Grid Layout
```tsx
<CardGrid>  // Standardized grid wrapper
  <Card className="gradient-card rounded-2xl">...</Card>
</CardGrid>
```

### Component Structure

#### Standard Page Header (Reference from Dashboard)
```tsx
<header className="gradient-surface border-b border-border px-4 sm:px-6 py-3 sm:py-4">
  <div className="flex items-center">
    {/* Left: Back Button + Title */}
    <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
      <Button variant="ghost" size="icon" /* Back button */></Button>
      <div className="min-w-0 flex-1">
        <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl">
          {title}
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm lg:text-base">
          {subtitle}
        </p>
      </div>
    </div>
    
    {/* Right: Actions */}
    <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
      {/* Additional actions */}
    </div>
  </div>
</header>
```

### Responsive Breakpoints

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (sm to lg)
- **Desktop:** >= 1024px (lg)
- **Large Desktop:** >= 1280px (xl)

### Spacing Scale

- **Header padding:** py-3 sm:py-4
- **Content padding:** p-4 sm:p-6
- **Card padding:** p-3 sm:p-4 md:p-6
- **Gap between items:** space-x-2 sm:space-x-4 (horizontal), space-y-3 sm:space-y-4 (vertical)

### Transitions & Animations

- **Standard transition:** `transition-all duration-300 ease-in-out`
- **Hover scale:** `scale: 1.02`
- **Hover translate:** `translateY(-2px)` or `translateY(-3px)`

### Button Specifications

#### Primary Button (gradient-button)
```css
background: #00F0FF
color: #0D0D1F
border-radius: 16px
font-weight: 600
```

#### Button States
- **Hover:** `background: #00FFE5, translateY(-2px), scale: 1.02`
- **Focus:** `outline: 2px solid var(--ring), outline-offset: 2px`

### Icon Sizes

- **Small:** w-4 h-4 sm:w-5 sm:h-5
- **Medium:** w-5 h-5
- **Large:** w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8

### Shadow Specifications

- **Card shadow:** `shadow-lg`
- **Card hover shadow:** `shadow-xl shadow-primary/10`
- **Border shadow:** `border-slate-700/50`

## Pages Requiring Updates

### Analytics Pages (9)
1. OptimizedProducts
2. EmailPerformance
3. SmsConversion
4. CartRecovery
5. SeoKeywordDensity
6. ContentROI
7. RevenueImpact
8. SeoRankingTracker
9. ABTestResults

### AI Tools Pages (11)
1. ProfessionalCopywriting
2. SmartProductDescriptions
3. BulkOptimization
4. SeoTitlesMeta
5. AIImageAltText
6. DynamicTemplates
7. BrandVoiceMemory
8. MultimodalAI
9. ABTestingCopy
10. ScheduledRefresh
11. StrategyInsights

### Automation Pages (4)
1. CSVImportExport
2. ShopifyPublish
3. SmartBulkSuggestions
4. RollbackChanges

### Campaign Pages (3)
1. CampaignList
2. CreateCampaign
3. Templates

### Settings Pages (8)
1. Profile
2. Billing
3. Settings
4. AIPreferences
5. Notifications
6. AdvancedNotificationSettings
7. Integrations
8. Security
9. Support

### Feature Pages (7)
1. AIUpsellSuggestions
2. DynamicSegmentation
3. MultiChannelRepurposing
4. UpsellEmailReceipts
5. AbandonedCartSMS
6. CustomTemplates
7. BehavioralTriggers

### Other Pages (6)
1. ManageProducts
2. CheckoutPage
3. SubscriptionManagement
4. ShopifyOnboarding
5. Auth pages (Login, Register, ForgotPassword, ResetPassword)
6. Landing page

**Total: 48 pages requiring UI consistency updates**
