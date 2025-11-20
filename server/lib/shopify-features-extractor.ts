/**
 * Extract product features from Shopify product data
 * Looks for features in metafields and product descriptions
 * Prioritizes HTML lists over plain text parsing for reliability
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
    
    // Check common keys
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
 * Extract features from HTML description
 * Priority: HTML lists (most reliable) then text-based extraction
 */
function extractFeaturesFromHtml(html: string): string | null {
  if (!html || !html.trim()) {
    return null;
  }

  // Priority 1: Extract from HTML <ul> or <ol> lists (most reliable, unambiguous)
  const listFeatures = extractFromHtmlLists(html);
  if (listFeatures.length > 0) {
    return listFeatures.join('\n');
  }

  // Priority 2: Look for text sections with feature headers
  // Convert HTML to text, preserving newlines for bullet detection
  const textContent = html
    .replace(/<\/?(p|div|li|br)[^>]*>/gi, '\n') // Replace block tags with newlines
    .replace(/<[^>]*>/g, ' ') // Remove remaining HTML tags
    .replace(/[ \t\f\v]+/g, ' ') // Collapse horizontal whitespace only (preserve newlines)
    .trim();

  // Patterns to look for features sections
  const featureHeaderPatterns = [
    /(?:key\s+)?features?:/i,
    /(?:key\s+)?benefits?:/i,
    /highlights?:/i,
    /what'?s?\s+included:/i,
    /why\s+(?:choose|buy)\s+this/i,
    /product\s+features?:/i
  ];

  // Try to find features section in text
  for (const pattern of featureHeaderPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      const afterHeader = textContent.substring(match.index! + match[0].length);
      
      // Extract newline-separated bullets only (conservative, reliable)
      const features = extractNewlineSeparatedBullets(afterHeader);
      if (features.length > 0) {
        return features.join('\n');
      }
    }
  }

  return null;
}

/**
 * Extract newline-separated bullets from text
 * Conservative approach: only extracts bullets that are clearly on separate lines
 * Does NOT try to parse inline bullets to avoid splitting hyphenated phrases
 */
function extractNewlineSeparatedBullets(text: string, maxItems: number = 10): string[] {
  const items: string[] = [];
  
  // Split by newlines to get individual lines
  const lines = text.split(/[\r\n]+/);
  
  for (const line of lines) {
    if (items.length >= maxItems) break;
    
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;
    
    // Check if this line starts with a bullet marker: -, •, *, or numbers like 1. or 2)
    const bulletMatch = trimmed.match(/^([-•*]|\d+[.)])\s+(.+)/);
    
    if (bulletMatch) {
      const bulletText = bulletMatch[2].trim();
      
      if (bulletText.length >= 5) {
        const cleanedText = cleanBulletText(bulletText);
        if (cleanedText) {
          items.push(cleanedText);
        }
      }
    }
  }
  
  return items;
}

/**
 * Extract features from HTML <ul> or <ol> lists
 * Most reliable method as HTML structure is unambiguous
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

/**
 * Clean and validate bullet text
 */
function cleanBulletText(text: string): string | null {
  let cleaned = text.trim();
  
  // If text is too long, take first sentence
  if (cleaned.length > 200) {
    const firstSentence = cleaned.split(/[.!?]/)[0].trim();
    if (firstSentence.length >= 5) {
      cleaned = firstSentence;
    } else {
      // Truncate at 200 chars
      cleaned = cleaned.substring(0, 200).trim();
    }
  }
  
  // Validate length
  if (cleaned.length >= 5 && cleaned.length <= 200) {
    return cleaned;
  }
  
  return null;
}
