#!/usr/bin/env node

console.log('🧪 Testing ZYRA Integrations...\n');

// Test SendGrid
console.log('📧 Testing SendGrid Connection...');
import('./server/lib/sendgrid-client.js').then(async ({ getUncachableSendGridClient }) => {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    console.log('✅ SendGrid connected successfully');
    console.log(`   From email: ${fromEmail}`);
  } catch (error) {
    console.error('❌ SendGrid connection failed:', error.message);
  }
}).catch(err => {
  console.error('❌ SendGrid import failed:', err.message);
});

// Test Twilio
console.log('\n📱 Testing Twilio Connection...');
import('./server/lib/twilio-client.js').then(async ({ getTwilioClient, getTwilioFromPhoneNumber }) => {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    console.log('✅ Twilio connected successfully');
    console.log(`   From number: ${fromNumber}`);
  } catch (error) {
    console.error('❌ Twilio connection failed:', error.message);
  }
}).catch(err => {
  console.error('❌ Twilio import failed:', err.message);
});

// Test OpenAI
console.log('\n🤖 Testing OpenAI Connection...');
setTimeout(() => {
  const hasKey = !!process.env.OPENAI_API_KEY;
  if (hasKey) {
    console.log('✅ OpenAI API key is configured');
  } else {
    console.log('❌ OpenAI API key not found');
  }
}, 500);
