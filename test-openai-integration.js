import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

async function testGPT4oMini() {
  console.log('🧪 Testing GPT-4o mini integration...\n');
  
  try {
    console.log('1️⃣ Testing API Key...');
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found');
    }
    console.log('✅ API Key is configured\n');
    
    console.log('2️⃣ Testing Product Description Generation...');
    const descResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ 
        role: "user", 
        content: 'Generate a product description for "Premium Wireless Headphones" in JSON format: { "description": "your description" }'
      }],
      response_format: { type: "json_object" },
    });
    
    const result = JSON.parse(descResponse.choices[0].message.content);
    console.log('✅ Product Description:', result.description?.substring(0, 100) + '...');
    console.log('✅ Tokens used:', descResponse.usage?.total_tokens);
    console.log('✅ Model:', descResponse.model, '\n');
    
    console.log('3️⃣ Testing SEO Optimization...');
    const seoResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ 
        role: "user", 
        content: 'Create SEO title and meta description for "Wireless Headphones". Respond in JSON: { "seoTitle": "...", "metaDescription": "..." }'
      }],
      response_format: { type: "json_object" },
    });
    
    const seoResult = JSON.parse(seoResponse.choices[0].message.content);
    console.log('✅ SEO Title:', seoResult.seoTitle);
    console.log('✅ Meta Description:', seoResult.metaDescription?.substring(0, 80) + '...');
    console.log('✅ Tokens used:', seoResponse.usage?.total_tokens, '\n');
    
    console.log('🎉 All tests passed! GPT-4o mini is working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGPT4oMini();
