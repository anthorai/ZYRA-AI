# Zyra AI - Wave 1 + Wave 2 API Guide

Complete guide to the Autonomous SEO Engine API endpoints.

---

## 🎯 Overview

Zyra AI's autonomous SEO engine learns your brand voice, auto-selects optimal marketing frameworks, and generates high-quality SEO content with consistent output guarantees.

**Key Features:**
- ✅ **Zod-validated output** - No more empty fields or broken responses
- ✅ **7+ marketing frameworks** - From luxury to Gen Z viral
- ✅ **Brand DNA learning** - AI learns your unique writing style
- ✅ **A/B testing** - Generate variants and track winners
- ✅ **Auto-framework selection** - AI picks the best template per product

---

## 📚 Table of Contents

1. [Wave 1: Unified SEO Engine](#wave-1-unified-seo-engine)
2. [Brand DNA Management](#brand-dna-management)
3. [Template Recommendations](#template-recommendations)
4. [Wave 2: A/B Testing](#wave-2-ab-testing)
5. [Response Schemas](#response-schemas)
6. [Error Handling](#error-handling)

---

## Wave 1: Unified SEO Engine

### POST `/api/seo/generate`

Generate SEO content with full Wave 1 features: auto-framework selection, brand DNA, SERP patterns, and Zod validation.

**Authentication:** Required  
**Rate Limit:** AI tier limits apply

#### Request Body

```json
{
  "productName": "Luxury Leather Wallet",
  "productDescription": "Premium full-grain leather with RFID protection",
  "category": "Accessories",
  "price": 150,
  "tags": ["leather", "luxury", "gift"],
  "currentKeywords": ["wallet", "leather wallet", "men's wallet"],
  "targetAudience": "Fashion-conscious professionals aged 25-45",
  "uniqueSellingPoints": ["RFID protection", "lifetime warranty", "handcrafted"],
  
  // Wave 1 Features
  "autoDetectFramework": true,
  "frameworkId": null,
  "enableBrandDNA": true,
  "enableSerpPatterns": false,
  "shopifyHtmlFormatting": true,
  "preferredModel": "gpt-4o-mini",
  "creativityLevel": 70
}
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `productName` | string | ✅ | - | Product name (max 255 chars) |
| `productDescription` | string | ❌ | - | Detailed product description |
| `category` | string | ❌ | - | Product category |
| `price` | number | ❌ | - | Price in USD |
| `tags` | string[] | ❌ | [] | Product tags |
| `currentKeywords` | string[] | ❌ | [] | Existing keywords to optimize |
| `targetAudience` | string | ❌ | - | Target customer description |
| `uniqueSellingPoints` | string[] | ❌ | [] | Key differentiators |
| `autoDetectFramework` | boolean | ❌ | true | Let AI select best framework |
| `frameworkId` | string | ❌ | null | Force specific framework |
| `enableBrandDNA` | boolean | ❌ | true | Apply learned brand voice |
| `enableSerpPatterns` | boolean | ❌ | false | Use SERP analysis |
| `shopifyHtmlFormatting` | boolean | ❌ | true | Format for Shopify |
| `preferredModel` | string | ❌ | "gpt-4o-mini" | AI model to use |
| `creativityLevel` | number | ❌ | 70 | Temperature (0-100) |

#### Response

```json
{
  "success": true,
  "seoOutput": {
    "seoTitle": "Luxury Leather Wallet - RFID Protection & Lifetime Warranty | Premium Handcrafted",
    "seoDescription": "<p>Discover our premium full-grain leather wallet...</p>",
    "metaTitle": "Luxury Leather Wallet - RFID Protection & Lifetime Warranty",
    "metaDescription": "Premium handcrafted leather wallet with RFID blocking technology...",
    "keywords": ["luxury leather wallet", "RFID wallet", "men's wallet", "premium wallet", "handcrafted leather"],
    "shopifyTags": ["Accessories", "Luxury", "Leather Goods", "RFID Protection"],
    "searchIntent": "commercial",
    "suggestedKeywords": ["gift wallet", "executive wallet", "slim wallet"],
    "competitorGaps": ["lifetime warranty", "RFID protection", "full-grain leather"],
    "seoScore": 92,
    "readabilityScore": 88,
    "conversionScore": 85,
    "brandVoiceMatchScore": 94,
    "confidence": 91,
    "shopifyTitle": "Luxury Leather Wallet - RFID Protection & Lifetime Warranty",
    "shopifyDescription": "<p>Discover our premium full-grain leather wallet...</p>",
    "frameworkUsed": "Luxury/Premium",
    "aiModel": "gpt-4o-mini",
    "generatedAt": "2025-11-23T09:00:00.000Z"
  },
  "frameworkUsed": "Luxury/Premium",
  "frameworkConfidence": 95,
  "serpPatternsUsed": false,
  "brandDnaApplied": true
}
```

---

## Brand DNA Management

### POST `/api/brand-dna/train`

Train Zyra to learn your unique brand voice from sample content.

**Authentication:** Required  
**Rate Limit:** AI tier limits apply

#### Request Body

```json
{
  "sampleTexts": [
    "Elevate your style with our handcrafted leather accessories. Each piece tells a story of timeless elegance and meticulous craftsmanship.",
    "Discover the perfect blend of form and function. Our RFID-protected wallets combine cutting-edge technology with classic design.",
    "Experience luxury that lasts a lifetime. Every stitch, every detail, crafted to perfection."
  ]
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sampleTexts` | string[] | ✅ | 1-10 sample texts (each 50+ chars) |

#### Response

```json
{
  "success": true,
  "brandDNA": {
    "writingStyle": "sophisticated",
    "toneDensity": "rich",
    "avgSentenceLength": 18,
    "formalityScore": 78,
    "emojiFrequency": "never",
    "ctaStyle": "elevated and aspirational",
    "brandPersonality": "Sophisticated, quality-focused luxury brand",
    "confidenceScore": 87,
    "keyPhrases": ["timeless elegance", "meticulous craftsmanship", "experience luxury", "lifetime quality", "cutting-edge"],
    "powerWords": ["elevate", "discover", "experience", "perfect", "handcrafted"]
  },
  "message": "Brand DNA trained successfully"
}
```

### GET `/api/brand-dna/profile`

Retrieve your current brand DNA profile.

**Authentication:** Required

#### Response

```json
{
  "success": true,
  "hasBrandDNA": true,
  "brandDNA": {
    "writingStyle": "sophisticated",
    "toneDensity": "rich",
    "avgSentenceLength": 18,
    "formalityScore": 78,
    "emojiFrequency": "never",
    "ctaStyle": "elevated and aspirational",
    "brandPersonality": "Sophisticated, quality-focused luxury brand",
    "confidenceScore": 87
  }
}
```

---

## Template Recommendations

### POST `/api/templates/recommend`

Get AI-powered marketing framework recommendations for a product.

**Authentication:** Required

#### Request Body

```json
{
  "productName": "Eco-Friendly Water Bottle",
  "productDescription": "Sustainable stainless steel bottle made from recycled materials",
  "category": "Home & Garden",
  "price": 35,
  "tags": ["eco-friendly", "sustainable", "BPA-free"],
  "targetAudience": "Environmentally conscious consumers"
}
```

#### Response

```json
{
  "success": true,
  "recommendation": {
    "primary": {
      "id": "eco-friendly",
      "name": "Eco-Friendly & Sustainable",
      "description": "Emphasizes environmental responsibility and planet-friendly values",
      "bestFor": "Products with sustainability claims, eco-conscious brands, and green initiatives",
      "confidence": 94,
      "reason": "Strong match for eco-friendly product with sustainability focus"
    },
    "alternatives": [
      {
        "id": "minimalist-premium",
        "name": "Minimalist Premium",
        "description": "Clean, elegant, and understated sophistication",
        "confidence": 72,
        "reason": "Could work well for premium positioning"
      },
      {
        "id": "gen-z-viral",
        "name": "Gen Z Viral",
        "description": "Trendy, authentic, and highly shareable content",
        "confidence": 65,
        "reason": "Alternative for younger audience appeal"
      }
    ]
  }
}
```

### GET `/api/templates/stats`

View framework usage statistics to see which templates perform best for your products.

**Authentication:** Required

#### Response

```json
{
  "success": true,
  "stats": {
    "topFrameworks": [
      {
        "frameworkId": "luxury-premium",
        "frameworkName": "Luxury/Premium",
        "count": 45
      },
      {
        "frameworkId": "eco-friendly",
        "frameworkName": "Eco-Friendly & Sustainable",
        "count": 32
      }
    ],
    "avgSeoScore": 87,
    "avgConversionScore": 82,
    "totalUsage": 127
  }
}
```

---

## Wave 2: A/B Testing

### POST `/api/ab-test/create`

Generate multiple SEO variants to A/B test different marketing frameworks.

**Authentication:** Required  
**Rate Limit:** AI tier limits apply

#### Request Body

```json
{
  "productName": "Smart Home Security Camera",
  "productDescription": "AI-powered security with 1080p resolution and night vision",
  "category": "Electronics",
  "price": 199,
  "tags": ["smart home", "security", "AI", "HD camera"],
  "targetAudience": "Tech-savvy homeowners concerned about security",
  "numVariants": 3,
  "focusMetric": "conversions",
  "frameworkIds": null
}
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `productName` | string | ✅ | - | Product name |
| `productDescription` | string | ❌ | - | Product description |
| `category` | string | ❌ | - | Product category |
| `price` | number | ❌ | - | Price |
| `tags` | string[] | ❌ | [] | Product tags |
| `targetAudience` | string | ❌ | - | Target audience |
| `numVariants` | number | ❌ | 3 | Number of variants (2-4) |
| `focusMetric` | string | ❌ | "balanced" | Focus: "clicks", "conversions", "engagement", "balanced" |
| `frameworkIds` | string[] | ❌ | null | Specific frameworks to test |

#### Response

```json
{
  "success": true,
  "testId": "test-1234567890-abc123",
  "variants": [
    {
      "id": "variant-1",
      "name": "Variant A: Technical/Professional",
      "frameworkId": "technical-professional",
      "frameworkName": "Technical/Professional",
      "seoOutput": {
        "seoTitle": "Smart Home Security Camera - 1080p HD, AI Detection & Night Vision",
        "seoDescription": "Advanced AI-powered security camera with crystal-clear 1080p resolution...",
        "keywords": ["smart security camera", "1080p camera", "AI detection", "night vision", "home security"],
        "seoScore": 89,
        "conversionScore": 85,
        "brandVoiceMatchScore": 88
      },
      "hypothesis": "This Technical/Professional variant may achieve higher conversion rate by emphasizing technical specifications and professional-grade features"
    },
    // ... 2 more variants
  ],
  "recommendation": {
    "variantId": "variant-1",
    "reason": "Scores highest on conversion elements and brand alignment with Technical/Professional framework (89% confidence)",
    "confidenceScore": 89
  },
  "metadata": {
    "createdAt": "2025-11-23T09:00:00.000Z",
    "productName": "Smart Home Security Camera",
    "category": "Electronics"
  }
}
```

### POST `/api/ab-test/results`

Calculate A/B test winner from real performance data.

**Authentication:** Required

#### Request Body

```json
{
  "performances": [
    {
      "variantId": "variant-1",
      "impressions": 1500,
      "clicks": 180,
      "conversions": 45,
      "clickThroughRate": 12.0,
      "conversionRate": 3.0,
      "revenue": 8955
    },
    {
      "variantId": "variant-2",
      "impressions": 1520,
      "clicks": 165,
      "conversions": 38,
      "clickThroughRate": 10.9,
      "conversionRate": 2.5,
      "revenue": 7562
    }
  ],
  "minimumSampleSize": 100
}
```

#### Response

```json
{
  "success": true,
  "hasWinner": true,
  "winner": {
    "winnerId": "variant-1",
    "confidence": 88,
    "reason": "20.0% higher conversion rate (45 vs 38 conversions)"
  }
}
```

---

## Response Schemas

### SEO Output Schema

All SEO generation endpoints return this validated structure:

```typescript
interface SEOOutput {
  seoTitle: string;              // 1-65 chars, validated
  seoDescription: string;        // 50-500 chars, validated
  metaTitle: string;             // 1-65 chars
  metaDescription: string;       // 50-165 chars
  keywords: string[];            // 5-20 keywords
  shopifyTags: string[];         // Up to 20 tags
  searchIntent: 'commercial' | 'informational' | 'navigational' | 'transactional';
  suggestedKeywords: string[];   // Additional keyword suggestions
  competitorGaps: string[];      // Unique angles to emphasize
  seoScore: number;              // 0-100
  readabilityScore: number;      // 0-100
  conversionScore: number;       // 0-100
  brandVoiceMatchScore: number;  // 0-100
  confidence: number;            // 0-100
  shopifyTitle?: string;         // Shopify-formatted title
  shopifyDescription?: string;   // Shopify HTML description
  frameworkUsed: string;         // Framework name
  aiModel: string;               // AI model used
  generatedAt: string;           // ISO timestamp
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing required fields, invalid parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side processing error |

---

## Best Practices

### 1. **Always Enable Brand DNA**
Train your brand voice once, then set `enableBrandDNA: true` on all SEO generation calls for consistent brand voice.

### 2. **Use Auto-Framework Selection**
Unless you have a specific reason, let the AI choose the optimal framework with `autoDetectFramework: true`.

### 3. **A/B Test Before Bulk Operations**
Generate 2-3 variants with different frameworks, test them, then use the winner for bulk optimization.

### 4. **Monitor Framework Stats**
Check `/api/templates/stats` regularly to see which frameworks perform best for your products.

### 5. **Provide Rich Context**
The more details you provide (description, tags, target audience, USPs), the better the AI can optimize.

---

## Rate Limits

| Plan | SEO Generations/Month | A/B Tests/Month | Brand DNA Training |
|------|----------------------|-----------------|-------------------|
| Free Trial | 50 | 5 | 1 |
| Starter | 200 | 20 | Unlimited |
| Growth | 1,000 | 100 | Unlimited |
| Pro | Unlimited | Unlimited | Unlimited |

---

## Support

**Questions?** Contact support@zyraai.com  
**Documentation:** https://docs.zyraai.com  
**API Status:** https://status.zyraai.com
