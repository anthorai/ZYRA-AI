/**
 * Extract product features from Shopify product data
 * Looks for features in metafields and product descriptions
 */

interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

/**
 * Extract features from Shopify product metafields and description
 * @param metafields - Shopify product metafields
 * @param bodyHtml - Product description HTML
 * @returns Extracted features as a single string, or null if none found
 */
export function extractProductFeatures(
  metafields: ShopifyMetafield[] = [],
  bodyHtml: string = ''
): string | null {
  // 1. First, try to find features in common metafield locations
  const featureMetafieldKeys = [
    'features',
    'key_features',
    'benefits',
    'key_benefits',
    'highlights',
    'product_features',
    'feature_list'
  ];

  for (const metafield of metafields) {
    const keyLower = metafield.key.toLowerCase();
    const namespaceLower = metafield.namespace.toLowerCase();
    
    // Check common namespaces and keys
    if (featureMetafieldKeys.some(key => keyLower.includes(key))) {
      if (metafield.value && metafield.value.trim()) {
        // Metafield value might be JSON array or plain text
        try {
          const parsed = JSON.parse(metafield.value);
          if (Array.isArray(parsed)) {
            return parsed.join('\n');
          } else if (typeof parsed === 'string') {
            return parsed;
          }
        } catch {
          // Not JSON, use as-is
          return metafield.value.trim();
        }
      }
    }
  }

  // 2. If no metafield features found, try to extract from description HTML
  if (bodyHtml) {
    const features = extractFeaturesFromHtml(bodyHtml);
    if (features) {
      return features;
    }
  }

  return null;
}

/**
 * Extract features from HTML description by looking for common patterns
 * - Bullet point lists with "features", "benefits", "highlights" headers
 * - Ordered lists with similar headers
 */
function extractFeaturesFromHtml(html: string): string | null {
  if (!html || !html.trim()) {
    return null;
  }

  // Remove HTML tags for text analysis
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Patterns to look for features sections
  const featureHeaderPatterns = [
    /(?:key\s+)?features?:/i,
    /(?:key\s+)?benefits?:/i,
    /highlights?:/i,
    /what'?s?\s+included:/i,
    /why\s+(?:choose|buy)\s+this/i,
    /product\s+features?:/i
  ];

  // Try to find features section
  for (const pattern of featureHeaderPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      const afterHeader = textContent.substring(match.index! + match[0].length);
      
      // Extract bullet points or list items after the header
      const features = extractListItems(afterHeader);
      if (features.length > 0) {
        return features.join('\n');
      }
    }
  }

  // Try to extract from HTML lists directly
  const listFeatures = extractFromHtmlLists(html);
  if (listFeatures.length > 0) {
    return listFeatures.join('\n');
  }

  return null;
}

/**
 * Extract list items from text (looking for bullet points, dashes, numbers)
 */
function extractListItems(text: string, maxItems: number = 10): string[] {
  const items: string[] = [];
  
  // Split by common list separators
  const lines = text.split(/[\n\r•\-\*]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines or very short items
    if (!trimmed || trimmed.length < 5) continue;
    
    // Stop if we hit another section header
    if (/^[A-Z][a-z]+\s*:/.test(trimmed)) break;
    
    // Take the first sentence/fragment
    const firstSentence = trimmed.split(/[.!?]/)[0].trim();
    if (firstSentence.length >= 5 && firstSentence.length <= 200) {
      items.push(firstSentence);
      
      if (items.length >= maxItems) break;
    }
  }
  
  return items;
}

/**
 * Extract features from HTML <ul> or <ol> lists
 */
function extractFromHtmlLists(html: string): string[] {
  const features: string[] = [];
  
  // Match <ul> or <ol> tags
  const listRegex = /<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi;
  const listMatches = html.match(listRegex);
  
  if (!listMatches) return features;
  
  for (const list of listMatches) {
    // Extract <li> items
    const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(list)) !== null) {
      const itemHtml = itemMatch[1];
      // Remove HTML tags and clean up
      const itemText = itemHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (itemText.length >= 5 && itemText.length <= 200) {
        features.push(itemText);
        
        if (features.length >= 10) break;
      }
    }
    
    // If we found features in this list, return them
    if (features.length > 0) break;
  }
  
  return features;
}
