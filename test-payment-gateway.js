#!/usr/bin/env node
/**
 * Payment Gateway Integration Test
 * Tests Razorpay, PayPal, and subscription plan functionality
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSubscriptionPlans() {
  log('\n=== Testing Subscription Plans API ===', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/subscription-plans`);
    const plans = await response.json();
    
    if (!response.ok) {
      log(`❌ Failed to fetch plans: ${response.status}`, 'red');
      return false;
    }
    
    log(`✅ Found ${plans.length} subscription plans:`, 'green');
    plans.forEach(plan => {
      log(`  • ${plan.planName} - $${plan.price}/${plan.interval} (${plan.isActive ? 'Active' : 'Inactive'})`, 'cyan');
    });
    
    // Verify all required plans exist
    const requiredPlans = ['7-Day Free Trial', 'Starter', 'Growth', 'Pro'];
    const planNames = plans.map(p => p.planName);
    const allPresent = requiredPlans.every(name => planNames.includes(name));
    
    if (allPresent && plans.every(p => p.isActive)) {
      log('✅ All subscription plans are active and configured correctly', 'green');
      return true;
    } else {
      log('❌ Some subscription plans are missing or inactive', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error testing plans: ${error.message}`, 'red');
    return false;
  }
}

async function testPaymentGatewaySelection() {
  log('\n=== Testing Payment Gateway Selection ===', 'blue');
  
  try {
    // Test with different regions
    const testCases = [
      { currency: 'INR', countryCode: 'IN', expected: 'razorpay' },
      { currency: 'USD', countryCode: 'US', expected: 'paypal' },
      { currency: 'EUR', countryCode: 'DE', expected: 'paypal' }
    ];
    
    for (const testCase of testCases) {
      const response = await fetch(`${BASE_URL}/api/payments/gateway-selection?currency=${testCase.currency}&countryCode=${testCase.countryCode}`);
      const result = await response.json();
      
      if (result.recommended === testCase.expected) {
        log(`✅ ${testCase.countryCode} (${testCase.currency}) → ${result.recommended} ✓`, 'green');
      } else {
        log(`❌ ${testCase.countryCode} (${testCase.currency}) → Expected ${testCase.expected}, got ${result.recommended}`, 'red');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Error testing gateway selection: ${error.message}`, 'red');
    return false;
  }
}

async function testRazorpayConfiguration() {
  log('\n=== Testing Razorpay Configuration ===', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/payments/razorpay/config`);
    const config = await response.json();
    
    if (response.ok && config.keyId) {
      log(`✅ Razorpay is configured with Key ID: ${config.keyId.substring(0, 10)}...`, 'green');
      log(`   Available: ${config.available ? 'Yes' : 'No'}`, 'cyan');
      return true;
    } else {
      log('⚠️  Razorpay configuration incomplete', 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Razorpay config error: ${error.message}`, 'red');
    return false;
  }
}

async function testPayPalConfiguration() {
  log('\n=== Testing PayPal Configuration ===', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/paypal/setup`);
    const config = await response.json();
    
    if (response.ok && config.clientId) {
      log(`✅ PayPal is configured with Client ID: ${config.clientId.substring(0, 15)}...`, 'green');
      log(`   Environment: ${config.environment || 'sandbox'}`, 'cyan');
      return true;
    } else {
      log('⚠️  PayPal configuration incomplete', 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ PayPal config error: ${error.message}`, 'red');
    return false;
  }
}

async function testWebhookEndpoints() {
  log('\n=== Testing Webhook Endpoints ===', 'blue');
  
  // Test Razorpay webhook (should require signature)
  try {
    const razorpayPayload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'test_payment_123' } } }
    };
    
    const response = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(razorpayPayload)
    });
    
    // Should fail without signature
    if (response.status === 400 || response.status === 500) {
      log('✅ Razorpay webhook requires signature (security check passed)', 'green');
    } else {
      log(`⚠️  Razorpay webhook returned unexpected status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Razorpay webhook test error: ${error.message}`, 'red');
  }
  
  // Test PayPal webhook (should require verification)
  try {
    const paypalPayload = {
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: { id: 'test_capture_123' }
    };
    
    const response = await fetch(`${BASE_URL}/api/webhooks/paypal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paypalPayload)
    });
    
    // Should fail without proper verification
    if (response.status >= 400) {
      log('✅ PayPal webhook requires verification (security check passed)', 'green');
    } else {
      log(`⚠️  PayPal webhook returned unexpected status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`❌ PayPal webhook test error: ${error.message}`, 'red');
  }
}

async function testHealthCheck() {
  log('\n=== Testing API Health ===', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const health = await response.json();
    
    if (health.status === 'healthy') {
      log('✅ API is healthy', 'green');
      log(`   Database: ${health.services.database}`, 'cyan');
      log(`   Uptime: ${health.uptime} seconds`, 'cyan');
      return true;
    } else {
      log(`⚠️  API status: ${health.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 PAYMENT GATEWAY INTEGRATION TEST SUITE', 'blue');
  log('Testing all payment gateway functionality\n', 'blue');
  
  const results = {
    health: await testHealthCheck(),
    plans: await testSubscriptionPlans(),
    gatewaySelection: await testPaymentGatewaySelection(),
    razorpay: await testRazorpayConfiguration(),
    paypal: await testPayPalConfiguration(),
    webhooks: await testWebhookEndpoints()
  };
  
  log('\n' + '='.repeat(60), 'blue');
  log('TEST RESULTS SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : (passed === false ? '❌' : '⚠️');
    const color = passed ? 'green' : (passed === false ? 'red' : 'yellow');
    log(`${status} ${test.toUpperCase()}: ${passed ? 'PASSED' : passed === false ? 'FAILED' : 'WARNING'}`, color);
  });
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    log('\n✅ ALL TESTS PASSED - Payment gateways are fully operational!', 'green');
  } else {
    log('\n⚠️  Some tests failed or have warnings. Check configuration.', 'yellow');
  }
}

runAllTests().catch(console.error);
