import { apiRequest } from "./queryClient";

export interface ProductDescriptionRequest {
  productName: string;
  category: string;
  features: string;
  audience: string;
  brandVoice: "sales" | "seo" | "casual";
}

export interface SEOOptimizationRequest {
  currentTitle: string;
  keywords: string;
  currentMeta: string;
  category: string;
}

export interface ProductDescriptionResponse {
  description: string;
}

export interface SEOOptimizationResponse {
  optimizedTitle: string;
  optimizedMeta: string;
  keywords: string[];
  seoScore: number;
}

/**
 * Generate AI-powered product descriptions using OpenAI GPT-4o mini
 */
export async function generateProductDescription(
  request: ProductDescriptionRequest
): Promise<ProductDescriptionResponse> {
  try {
    const response = await apiRequest("POST", "/api/generate-description", request);
    const result = await response.json();
    
    if (!result.description) {
      throw new Error("No description returned from AI service");
    }
    
    return result;
  } catch (error) {
    console.error("Failed to generate product description:", error);
    throw new Error("Failed to generate product description. Please try again.");
  }
}

/**
 * Optimize SEO using AI-powered analysis
 */
export async function optimizeSEO(
  request: SEOOptimizationRequest
): Promise<SEOOptimizationResponse> {
  try {
    const response = await apiRequest("POST", "/api/optimize-seo", request);
    const result = await response.json();
    
    if (!result.optimizedTitle || !result.optimizedMeta) {
      throw new Error("Incomplete optimization result from AI service");
    }
    
    return result;
  } catch (error) {
    console.error("Failed to optimize SEO:", error);
    throw new Error("Failed to optimize SEO. Please try again.");
  }
}

/**
 * Generate AI-powered alt text for images
 */
export async function generateAltText(imageBase64: string): Promise<string> {
  try {
    // This would integrate with OpenAI's vision capabilities
    // For now, return a placeholder implementation
    throw new Error("Alt text generation not yet implemented");
  } catch (error) {
    console.error("Failed to generate alt text:", error);
    throw new Error("Failed to generate alt text. Please try again.");
  }
}

/**
 * Analyze sentiment of product descriptions
 */
export async function analyzeSentiment(text: string): Promise<{
  rating: number;
  confidence: number;
}> {
  try {
    // This would use OpenAI for sentiment analysis
    // For now, return a placeholder implementation  
    throw new Error("Sentiment analysis not yet implemented");
  } catch (error) {
    console.error("Failed to analyze sentiment:", error);
    throw new Error("Failed to analyze sentiment. Please try again.");
  }
}

/**
 * Get AI-powered product optimization suggestions
 */
export async function getOptimizationSuggestions(productId: string): Promise<{
  suggestions: string[];
  priority: "low" | "medium" | "high";
}> {
  try {
    // This would analyze the product and provide optimization suggestions
    // For now, return a placeholder implementation
    throw new Error("Optimization suggestions not yet implemented");
  } catch (error) {
    console.error("Failed to get optimization suggestions:", error);
    throw new Error("Failed to get optimization suggestions. Please try again.");
  }
}
