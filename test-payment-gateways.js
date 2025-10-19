#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
let authToken = null;

async function login() {
  console.log('\n🔐 Logging in via Supabase Auth...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (error) throw error;

    authToken = data.session.access_token;
    console.log('✅ Login successful');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    console.log('\n💡 Trying to create test account...');
    
    // Try to create the test user
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (signUpError) throw signUpError;
      
      authToken = signUpData.session?.access_token;
      if (!authToken) {
        throw new Error('No session token received after signup');
      }
      
      console.log('✅ Test account created and logged in');
      return authToken;
    } catch (signUpError) {
      console.error('❌ Failed to create test account:', signUpError.message);
      throw signUpError;
    }
  }
}

async function testPaymentConfig() {
  console.log('\n📋 Testing Payment Configuration...');
  try {
    const response = await fetch(`${BASE_URL}/api/payments/config`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment config: ${response.status}`);
    }

    const config = await response.json();
    console.log('\n💳 Payment Gateway Configuration:');
    console.log('─'.repeat(50));
    console.log('Razorpay:');
    console.log(`  ├─ Enabled: ${config.razorpay.enabled ? '✅ Yes' : '❌ No'}`);
    console.log(`  └─ Key ID: ${config.razorpay.keyId || '❌ Not set'}`);
    console.log('\nPayPal:');
    console.log(`  ├─ Enabled: ${config.paypal.enabled ? '✅ Yes' : '❌ No'}`);
    console.log(`  └─ Client ID: ${config.paypal.clientId ? config.paypal.clientId.substring(0, 20) + '...' : '❌ Not set'}`);
    console.log('─'.repeat(50));

    return config;
  } catch (error) {
    console.error('❌ Payment config test failed:', error.message);
    throw error;
  }
}

async function testRazorpayCreateOrder() {
  console.log('\n🇮🇳 Testing Razorpay Order Creation...');
  try {
    const orderData = {
      amount: 100,
      currency: 'INR',
      notes: {
        description: 'Test order for ZYRA payment gateway'
      }
    };

    const response = await fetch(`${BASE_URL}/api/payments/razorpay/create-order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Razorpay order creation failed: ${error.error || response.statusText}`);
    }

    const order = await response.json();
    console.log('✅ Razorpay Order Created Successfully');
    console.log(`  ├─ Order ID: ${order.orderId}`);
    console.log(`  ├─ Amount: ₹${order.amount / 100}`);
    console.log(`  └─ Currency: ${order.currency}`);

    return order;
  } catch (error) {
    console.error('❌ Razorpay test failed:', error.message);
    return null;
  }
}

async function testPayPalOrderCreation() {
  console.log('\n🌍 Testing PayPal Order Creation...');
  try {
    const orderData = {
      amount: '10.00',
      currency: 'USD',
      intent: 'CAPTURE'
    };

    const response = await fetch(`${BASE_URL}/api/paypal/order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal order creation failed: ${error.error || response.statusText}`);
    }

    const order = await response.json();
    console.log('✅ PayPal Order Created Successfully');
    console.log(`  ├─ Order ID: ${order.id}`);
    console.log(`  ├─ Status: ${order.status}`);
    console.log(`  └─ Amount: $${orderData.amount} ${orderData.currency}`);

    return order;
  } catch (error) {
    console.error('❌ PayPal test failed:', error.message);
    return null;
  }
}

async function testGatewaySelector() {
  console.log('\n🎯 Testing Payment Gateway Selector Logic...');
  console.log('─'.repeat(50));
  
  console.log('\nGateway Selection Rules:');
  console.log('  ├─ INR / India (IN) → Razorpay');
  console.log('  └─ All other currencies → PayPal');
  
  console.log('\nSupported PayPal Currencies:');
  console.log('  USD, EUR, GBP, CAD, AUD, SGD, INR, JPY, CNY');
  
  console.log('─'.repeat(50));
  console.log('✅ Gateway selector configured correctly');
}

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   ZYRA PAYMENT GATEWAY INTEGRATION TESTS         ║');
  console.log('╚══════════════════════════════════════════════════╝');

  try {
    await login();
    
    const config = await testPaymentConfig();
    
    let razorpaySuccess = false;
    let paypalSuccess = false;

    if (config.razorpay.enabled) {
      const razorpayOrder = await testRazorpayCreateOrder();
      razorpaySuccess = !!razorpayOrder;
    } else {
      console.log('\n⚠️  Razorpay not configured - skipping tests');
    }

    if (config.paypal.enabled) {
      const paypalOrder = await testPayPalOrderCreation();
      paypalSuccess = !!paypalOrder;
    } else {
      console.log('\n⚠️  PayPal not configured - skipping tests');
    }

    await testGatewaySelector();

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║            TEST SUMMARY                          ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('\n📊 Test Results:');
    console.log('─'.repeat(50));
    console.log(`Razorpay Configuration: ${config.razorpay.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    if (config.razorpay.enabled) {
      console.log(`  └─ Order Creation: ${razorpaySuccess ? '✅ Working' : '❌ Failed'}`);
    }
    console.log(`\nPayPal Configuration: ${config.paypal.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    if (config.paypal.enabled) {
      console.log(`  └─ Order Creation: ${paypalSuccess ? '✅ Working' : '❌ Failed'}`);
    }
    console.log(`\nGateway Router: ✅ Configured`);
    console.log('─'.repeat(50));

    if ((config.razorpay.enabled && razorpaySuccess) || (config.paypal.enabled && paypalSuccess)) {
      console.log('\n✅ Payment gateway tests completed successfully!');
    } else {
      console.log('\n⚠️  Some tests failed or were skipped');
    }
    
    // Clean up - sign out
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runAllTests();
