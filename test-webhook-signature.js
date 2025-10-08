#!/usr/bin/env node
/**
 * Webhook Signature Verification Test
 * Tests Razorpay webhook signature validation with raw body
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test-webhook-secret';

function generateSignature(body) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
}

async function testWebhookSignature() {
  console.log('🧪 Testing Razorpay Webhook Signature Verification\n');
  
  // Sample webhook payload (Razorpay format)
  const webhookPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test123456789',
          amount: 4900,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test123',
          method: 'card'
        }
      }
    }
  };
  
  // Convert to JSON string (this is what Razorpay sends)
  const bodyString = JSON.stringify(webhookPayload);
  
  // Generate signature using the raw body
  const signature = generateSignature(bodyString);
  
  console.log('📝 Webhook Payload:', JSON.stringify(webhookPayload, null, 2));
  console.log('\n🔐 Generated Signature:', signature);
  console.log('🔑 Using Secret:', WEBHOOK_SECRET.substring(0, 10) + '...');
  
  // Test 1: Valid signature
  console.log('\n--- Test 1: Valid Signature ---');
  try {
    const response = await fetch('http://localhost:5000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature
      },
      body: bodyString
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 200) {
      console.log('✅ Valid signature accepted!');
    } else if (response.status === 400 && result.error === 'Invalid signature') {
      console.log('❌ FAIL: Valid signature was rejected!');
      console.log('   This indicates the signature verification is still broken.');
    } else {
      console.log('⚠️  Unexpected response');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  // Test 2: Invalid signature
  console.log('\n--- Test 2: Invalid Signature ---');
  try {
    const response = await fetch('http://localhost:5000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': 'invalid_signature_12345'
      },
      body: bodyString
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 400 && result.error === 'Invalid signature') {
      console.log('✅ Invalid signature correctly rejected!');
    } else {
      console.log('❌ FAIL: Invalid signature should have been rejected!');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  // Test 3: Missing signature
  console.log('\n--- Test 3: Missing Signature ---');
  try {
    const response = await fetch('http://localhost:5000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: bodyString
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 400) {
      console.log('✅ Missing signature correctly rejected!');
    } else {
      console.log('❌ FAIL: Missing signature should have been rejected!');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Webhook signature verification tests completed!');
  console.log('='.repeat(60));
}

testWebhookSignature().catch(console.error);
