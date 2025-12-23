import OpenAI from "openai";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { brandVoiceTransformations, products } from "@shared/schema";
import type { BrandVoiceTransformation } from "@shared/schema";

function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type BrandVoice = 'luxury' | 'friendly' | 'bold' | 'minimal' | 'energetic' | 'professional';

const BRAND_VOICE_PROMPTS: Record<BrandVoice, string> = {
  luxury: `You write with elegance and sophistication. Use refined vocabulary, evoke exclusivity and premium quality. 
    Tone: Polished, aspirational, timeless. 
    Style: Eloquent sentences, subtle emotional appeal, understated confidence.
    Example phrases: "Crafted for the discerning", "Unparalleled excellence", "Timeless sophistication"`,
  
  friendly: `You write with warmth and approachability. Use conversational language that feels like talking to a trusted friend.
    Tone: Warm, helpful, genuine, relatable.
    Style: Simple words, second-person ("you"), questions, light humor.
    Example phrases: "You're going to love this", "Here's the thing", "We've got you covered"`,
  
  bold: `You write with confidence and impact. Use powerful, action-oriented language that demands attention.
    Tone: Confident, assertive, dynamic, unapologetic.
    Style: Short punchy sentences, strong verbs, imperative mood.
    Example phrases: "Dominate your day", "No compromises", "Built different"`,
  
  minimal: `You write with clarity and precision. Every word serves a purpose. No fluff, no filler.
    Tone: Clean, direct, modern, efficient.
    Style: Short sentences, essential information only, white space.
    Example phrases: "Simple. Effective.", "Less is more", "Pure function"`,
  
  energetic: `You write with excitement and enthusiasm. Your words energize and motivate action.
    Tone: Excited, dynamic, upbeat, inspiring.
    Style: Exclamation points (sparingly), active voice, momentum.
    Example phrases: "Get ready to", "Level up your", "The game-changer you need"`,
  
  professional: `You write with authority and expertise. Build trust through competence and reliability.
    Tone: Authoritative, trustworthy, knowledgeable, measured.
    Style: Clear structure, data-driven claims when possible, industry-appropriate.
    Example phrases: "Engineered for performance", "Industry-leading", "Trusted by professionals"`
};

interface ProductData {
  name: string;
  description: string | null;
  features: string | null;
  category: string;
  price: string;
}

interface TransformResult {
  description: string;
  features: string[];
  ctaText: string;
  microcopy: string;
  tokensUsed: number;
  processingTimeMs: number;
}

export class BrandVoiceService {
  async transformProductCopy(
    productData: ProductData,
    brandVoice: BrandVoice
  ): Promise<TransformResult> {
    const startTime = Date.now();
    
    const voiceGuidelines = BRAND_VOICE_PROMPTS[brandVoice];
    
    const systemPrompt = `You are Zyra AI's Brand Voice Engine. Your role is to transform existing product copy into a consistent brand voice.

${voiceGuidelines}

IMPORTANT RULES:
- Do NOT change product meaning, facts, or structure
- Do NOT add hype, false claims, or change pricing/offers
- Maintain original SEO intent and keywords
- Transform ONLY the tone and style of writing
- Keep the same product information, just reword it

OUTPUT FORMAT (JSON):
{
  "description": "Transformed product description in ${brandVoice} voice",
  "features": ["Feature 1 in brand voice", "Feature 2 in brand voice", "..."],
  "ctaText": "Call-to-action text in brand voice (e.g., 'Shop Now', 'Add to Cart', etc.)",
  "microcopy": "Short supporting line (shipping, trust, or value proposition)"
}`;

    const userPrompt = `Transform this product copy into a ${brandVoice.toUpperCase()} brand voice:

PRODUCT: ${productData.name}
CATEGORY: ${productData.category}
PRICE: $${productData.price}

CURRENT DESCRIPTION:
${productData.description || 'No description available'}

CURRENT FEATURES:
${productData.features || 'No features listed'}

Transform the above into ${brandVoice} brand voice. Keep all product facts accurate.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const result = JSON.parse(content);
      const processingTimeMs = Date.now() - startTime;

      return {
        description: result.description || productData.description || '',
        features: Array.isArray(result.features) ? result.features : [],
        ctaText: result.ctaText || 'Shop Now',
        microcopy: result.microcopy || 'Free shipping on orders over $50',
        tokensUsed: response.usage?.total_tokens || 0,
        processingTimeMs
      };
    } catch (error) {
      console.error('Brand voice transformation error:', error);
      throw error;
    }
  }

  async createTransformation(
    userId: string,
    productId: string,
    brandVoice: BrandVoice
  ): Promise<BrandVoiceTransformation> {
    const database = getDb();
    const product = await database.select().from(products).where(
      and(eq(products.id, productId), eq(products.userId, userId))
    ).limit(1);

    if (!product.length) {
      throw new Error('Product not found');
    }

    const productData: ProductData = {
      name: product[0].name,
      description: product[0].description,
      features: product[0].features,
      category: product[0].category,
      price: String(product[0].price)
    };

    const parseFeatures = (features: string | null): string[] => {
      if (!features) return [];
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : features.split(',').map(f => f.trim());
      } catch {
        return features.split(',').map(f => f.trim());
      }
    };

    const result = await this.transformProductCopy(productData, brandVoice);

    const [transformation] = await database.insert(brandVoiceTransformations).values({
      userId,
      productId,
      brandVoice,
      originalDescription: productData.description,
      originalFeatures: parseFeatures(productData.features),
      originalCta: 'Shop Now',
      originalMicrocopy: '',
      transformedDescription: result.description,
      transformedFeatures: result.features,
      transformedCta: result.ctaText,
      transformedMicrocopy: result.microcopy,
      status: 'preview',
      tokensUsed: result.tokensUsed,
      processingTimeMs: result.processingTimeMs
    }).returning();

    return transformation;
  }

  async bulkTransform(
    userId: string,
    productIds: string[],
    brandVoice: BrandVoice
  ): Promise<BrandVoiceTransformation[]> {
    const results: BrandVoiceTransformation[] = [];
    
    for (const productId of productIds) {
      try {
        const transformation = await this.createTransformation(userId, productId, brandVoice);
        results.push(transformation);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to transform product ${productId}:`, error);
      }
    }
    
    return results;
  }

  async approveTransformation(userId: string, transformationId: string): Promise<BrandVoiceTransformation> {
    const [updated] = await getDb().update(brandVoiceTransformations)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(and(
        eq(brandVoiceTransformations.id, transformationId),
        eq(brandVoiceTransformations.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new Error('Transformation not found');
    }

    return updated;
  }

  async rejectTransformation(userId: string, transformationId: string): Promise<BrandVoiceTransformation> {
    const [updated] = await getDb().update(brandVoiceTransformations)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(and(
        eq(brandVoiceTransformations.id, transformationId),
        eq(brandVoiceTransformations.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new Error('Transformation not found');
    }

    return updated;
  }

  async getTransformations(userId: string, status?: string): Promise<BrandVoiceTransformation[]> {
    const conditions = [eq(brandVoiceTransformations.userId, userId)];
    
    if (status) {
      conditions.push(eq(brandVoiceTransformations.status, status as any));
    }

    return getDb().select().from(brandVoiceTransformations)
      .where(and(...conditions))
      .orderBy(desc(brandVoiceTransformations.createdAt));
  }

  async getTransformationById(userId: string, id: string): Promise<BrandVoiceTransformation | null> {
    const [transformation] = await getDb().select().from(brandVoiceTransformations)
      .where(and(
        eq(brandVoiceTransformations.id, id),
        eq(brandVoiceTransformations.userId, userId)
      ))
      .limit(1);

    return transformation || null;
  }

  async markAsApplied(userId: string, transformationId: string): Promise<BrandVoiceTransformation> {
    const [updated] = await getDb().update(brandVoiceTransformations)
      .set({ 
        status: 'applied', 
        appliedToShopify: true, 
        appliedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(and(
        eq(brandVoiceTransformations.id, transformationId),
        eq(brandVoiceTransformations.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new Error('Transformation not found');
    }

    return updated;
  }
}
