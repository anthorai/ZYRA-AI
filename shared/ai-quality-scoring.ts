/**
 * AI Copy Quality Scoring System
 * Evaluates generated copy across multiple dimensions for conversion optimization
 */

export interface QualityScore {
  overall: number; // 0-100
  conversionPotential: number; // 0-100
  seoScore: number; // 0-100
  readability: number; // 0-100
  emotionalImpact: number; // 0-100
  clarity: number; // 0-100
  breakdown: {
    strengths: string[];
    improvements: string[];
    keywords: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    toneMatch: number; // 0-100
  };
}

export interface CopyVariant {
  id: string;
  type: 'emotional' | 'logical' | 'hybrid';
  copy: string;
  headline?: string;
  cta?: string;
  qualityScore: QualityScore;
  framework?: string;
  psychologicalTriggers: string[];
}

/**
 * Score copy quality using AI analysis
 */
export async function scoreACopy(
  copy: string,
  targetAudience: string,
  industry: string,
  openaiClient: any
): Promise<QualityScore> {
  const scoringPrompt = `Analyze this product copy and provide a comprehensive quality score.

**Copy to Analyze:**
"${copy}"

**Context:**
- Target Audience: ${targetAudience}
- Industry: ${industry}

**Evaluate across these dimensions (score 0-100 each):**

1. **Conversion Potential**: How likely is this to drive purchases?
   - Clear value proposition
   - Compelling call-to-action
   - Persuasive language
   - Benefit-focused

2. **SEO Score**: How well optimized for search?
   - Keyword presence and density
   - Natural language flow
   - Meta-friendly structure
   - Search intent alignment

3. **Readability**: How easy to read and understand?
   - Sentence length and structure
   - Vocabulary complexity
   - Scannable format
   - Clear messaging

4. **Emotional Impact**: How well does it connect emotionally?
   - Emotional triggers used
   - Storytelling elements
   - Relatability
   - Desire creation

5. **Clarity**: How clear and specific is the message?
   - Unambiguous language
   - Specific benefits
   - No jargon overload
   - Focused message

**Also identify:**
- Top 3 strengths
- Top 3 areas for improvement
- Keywords detected (list 5-10)
- Overall sentiment (positive/neutral/negative)
- Tone match for target audience (0-100)

Respond with JSON:
{
  "conversionPotential": 85,
  "seoScore": 78,
  "readability": 92,
  "emotionalImpact": 88,
  "clarity": 90,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "keywords": ["keyword1", "keyword2", ...],
  "sentiment": "positive",
  "toneMatch": 85
}`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: scoringPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for consistent scoring
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Calculate overall score as weighted average
    const overall = Math.round(
      (result.conversionPotential * 0.35) +
      (result.seoScore * 0.20) +
      (result.readability * 0.15) +
      (result.emotionalImpact * 0.20) +
      (result.clarity * 0.10)
    );

    return {
      overall,
      conversionPotential: result.conversionPotential || 0,
      seoScore: result.seoScore || 0,
      readability: result.readability || 0,
      emotionalImpact: result.emotionalImpact || 0,
      clarity: result.clarity || 0,
      breakdown: {
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        keywords: result.keywords || [],
        sentiment: result.sentiment || 'neutral',
        toneMatch: result.toneMatch || 0
      }
    };
  } catch (error) {
    console.error('Quality scoring error:', error);
    // Return neutral scores on error
    return {
      overall: 50,
      conversionPotential: 50,
      seoScore: 50,
      readability: 50,
      emotionalImpact: 50,
      clarity: 50,
      breakdown: {
        strengths: [],
        improvements: ['Unable to analyze - please try again'],
        keywords: [],
        sentiment: 'neutral',
        toneMatch: 50
      }
    };
  }
}

/**
 * Multi-Agent AI Pipeline for Professional Copy Generation
 */
export interface MultiAgentPipeline {
  analyzer: string; // Analyzes product and audience
  copywriter: string; // Generates initial copy
  critic: string; // Reviews and refines
}

export const MULTI_AGENT_PROMPTS: MultiAgentPipeline = {
  analyzer: `You are an expert market analyst. Analyze this product for copywriting:

**Product:** {product_name}
**Category:** {category}
**Features:** {features}
**Target Audience:** {audience}

**Your Analysis Should Include:**
1. Audience pain points and desires
2. Key differentiators from competitors
3. Emotional triggers that resonate with this audience
4. Best psychological angles to use
5. Recommended tone and style

Respond with detailed JSON analysis:
{
  "painPoints": ["pain point 1", "pain point 2", ...],
  "desires": ["desire 1", "desire 2", ...],
  "differentiators": ["differentiator 1", ...],
  "emotionalTriggers": ["trigger 1", ...],
  "recommendedTone": "description",
  "psychologicalAngles": ["angle 1", ...]
}`,

  copywriter: `You are a world-class copywriter. Using the analysis below, write three variants of compelling copy:

**Product:** {product_name}
**Analysis:** {analysis}
**Framework:** {framework}

**Generate 3 Variants:**

1. **EMOTIONAL Variant**: Focus on feelings, aspirations, transformation
   - Lead with emotion
   - Use vivid, sensory language
   - Paint the dream outcome
   - Create strong desire

2. **LOGICAL Variant**: Focus on facts, features, rational benefits
   - Lead with proof and data
   - Emphasize practical advantages
   - Use logical structure
   - Build trust through specifics

3. **HYBRID Variant**: Balance emotion and logic optimally
   - Hook with emotion
   - Support with logic
   - Perfect balance for maximum conversion
   - Best of both worlds

Each variant should:
- Follow the {framework} framework structure
- Be {max_words} words or less
- Include a powerful headline and CTA
- Target the identified pain points and desires

Respond with JSON:
{
  "emotional": {"headline": "...", "copy": "...", "cta": "..."},
  "logical": {"headline": "...", "copy": "...", "cta": "..."},
  "hybrid": {"headline": "...", "copy": "...", "cta": "..."}
}`,

  critic: `You are a senior copy editor and conversion expert. Review this copy and make it even better:

**Original Copy:** {copy}
**Quality Score:** {score}
**Improvements Needed:** {improvements}

**Your Task:**
1. Fix any weaknesses identified in the quality score
2. Enhance persuasive elements
3. Tighten language and remove fluff
4. Strengthen the call-to-action
5. Add power words where appropriate
6. Ensure perfect flow and readability

**Refinement Guidelines:**
- Keep the core message and structure
- Make every word count
- Increase emotional resonance
- Boost conversion potential by 20%+
- Maintain authenticity (no hype or false claims)

Respond with JSON:
{
  "refinedCopy": "improved version",
  "changesExplanation": "what you improved and why",
  "expectedImpact": "how these changes boost conversion"
}`
};

/**
 * Generate copy using multi-agent pipeline with Zyra Pro Mode and industry templates
 */
export async function generateMultiAgentCopy(
  productName: string,
  category: string,
  features: string,
  audience: string,
  framework: string,
  maxWords: number,
  openaiClient: any,
  industry?: string,
  psychologicalTriggers?: string[]
): Promise<{ emotional: any; logical: any; hybrid: any; analysis: any }> {
  
  // Import industry templates, triggers, and pro mode prompts
  const { getIndustryTemplate, getPsychologicalTrigger } = await import('./copywriting-frameworks');
  const { getMultiAgentPrompts } = await import('./ai-system-prompts');
  
  // Get pro mode multi-agent prompts
  const proModePrompts = getMultiAgentPrompts();
  
  // Get industry-specific guidelines
  const industryTemplate = industry ? getIndustryTemplate(industry) : null;
  const triggerDetails = psychologicalTriggers?.map(t => getPsychologicalTrigger(t)).filter(Boolean) || [];
  
  // Step 1: Analyzer Agent - Understand product and audience (with Pro Mode)
  let analyzerPrompt = `${proModePrompts.analyzer}

---

**PRODUCT ANALYSIS REQUEST:**
- Product Name: ${productName}
- Category: ${category}
- Features: ${features}
- Target Audience: ${audience}

${MULTI_AGENT_PROMPTS.analyzer
  .replace('{product_name}', productName)
  .replace('{category}', category)
  .replace('{features}', features)
  .replace('{audience}', audience)}`;
  
  // Enhance with industry context
  if (industryTemplate) {
    analyzerPrompt += `\n\n**Industry Context (${industryTemplate.industry}):**
    - Tone: ${industryTemplate.toneGuidelines}
    - Key Keywords: ${industryTemplate.keywordFocus.join(', ')}
    - Emotional Triggers: ${industryTemplate.emotionalTriggers.join(', ')}
    - Avoid: ${industryTemplate.avoidWords.join(', ')}`;
  }

  const analysisResponse = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: proModePrompts.analyzer },
      { role: "user", content: analyzerPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  let analysis;
  try {
    const content = analysisResponse.choices[0].message.content;
    if (!content) throw new Error('Empty response from analyzer');
    analysis = JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse analyzer response:', error);
    throw new Error('AI analyzer returned invalid data. Please try again.');
  }

  // Step 2: Copywriter Agent - Generate 3 variants (with Pro Mode)
  let copywriterPrompt = `${proModePrompts.copywriter}

---

**COPYWRITING REQUEST:**
${MULTI_AGENT_PROMPTS.copywriter
  .replace('{product_name}', productName)
  .replace('{analysis}', JSON.stringify(analysis))
  .replace('{framework}', framework)
  .replace('{max_words}', maxWords.toString())}`;
  
  // Add psychological triggers to the prompt
  if (triggerDetails.length > 0) {
    copywriterPrompt += `\n\n**Psychological Triggers to Use:**\n`;
    triggerDetails.forEach(trigger => {
      copywriterPrompt += `- **${trigger?.name}**: ${trigger?.description}\n  Example: ${trigger?.examples[0] || ''}\n`;
    });
  }
  
  // Add industry tone if available
  if (industryTemplate) {
    copywriterPrompt += `\n\n**Industry Style Guide:**
    - Maintain ${industryTemplate.toneGuidelines} tone
    - Incorporate these power words: ${industryTemplate.keywordFocus.slice(0, 5).join(', ')}
    - Avoid these words: ${industryTemplate.avoidWords.join(', ')}`;
  }

  const copyResponse = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: proModePrompts.copywriter },
      { role: "user", content: copywriterPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8, // Higher creativity for copywriting
  });

  let variants;
  try {
    const content = copyResponse.choices[0].message.content;
    if (!content) throw new Error('Empty response from copywriter');
    variants = JSON.parse(content);
    
    // Validate variants have required fields
    if (!variants.emotional?.copy || !variants.logical?.copy || !variants.hybrid?.copy) {
      throw new Error('Copywriter did not generate all required variants');
    }
  } catch (error) {
    console.error('Failed to parse copywriter response:', error);
    throw new Error('AI copywriter returned invalid data. Please try again.');
  }

  return {
    emotional: variants.emotional || {},
    logical: variants.logical || {},
    hybrid: variants.hybrid || {},
    analysis
  };
}

/**
 * Refine copy using critic agent with Zyra Pro Mode
 */
export async function refineCopyWithCritic(
  copy: string,
  score: QualityScore,
  openaiClient: any
): Promise<{ refinedCopy: string; explanation: string; impact: string }> {
  
  // Import pro mode prompts
  const { getMultiAgentPrompts } = await import('./ai-system-prompts');
  const proModePrompts = getMultiAgentPrompts();
  
  const criticPrompt = `${proModePrompts.critic}

---

**COPY REFINEMENT REQUEST:**
${MULTI_AGENT_PROMPTS.critic
  .replace('{copy}', copy)
  .replace('{score}', score.overall.toString())
  .replace('{improvements}', score.breakdown.improvements.join(', '))}`;

  const criticResponse = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: proModePrompts.critic },
      { role: "user", content: criticPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const result = JSON.parse(criticResponse.choices[0].message.content || "{}");

  return {
    refinedCopy: result.refinedCopy || copy,
    explanation: result.changesExplanation || '',
    impact: result.expectedImpact || ''
  };
}
