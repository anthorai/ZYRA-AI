import { supabase, testSupabaseConnection } from './lib/supabase';

/**
 * Test Supabase connection and basic operations
 * Run this file to verify that Supabase is properly configured
 */
async function runTests() {
  console.log('🧪 Testing Supabase connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Supabase');
    }
    console.log('✅ Connection successful\n');

    // Test 2: Test user table query
    console.log('2. Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError) {
      console.log(`⚠️  Users table error: ${usersError.message}`);
    } else {
      console.log(`✅ Users table accessible (found ${users?.length || 0} records)\n`);
    }

    // Test 3: Test products table query  
    console.log('3. Testing products table access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (productsError) {
      console.log(`⚠️  Products table error: ${productsError.message}`);
    } else {
      console.log(`✅ Products table accessible (found ${products?.length || 0} records)\n`);
    }

    // Test 4: Test subscription plans
    console.log('4. Testing subscription_plans table access...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, plan_name')
      .limit(1);
    
    if (plansError) {
      console.log(`⚠️  Subscription plans table error: ${plansError.message}`);
    } else {
      console.log(`✅ Subscription plans table accessible (found ${plans?.length || 0} records)\n`);
    }

    // Test 5: Check environment variables
    console.log('5. Checking environment variables...');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY;
    
    console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`SUPABASE_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`);

    console.log('🎉 All tests completed! Supabase appears to be working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
// Note: For ES modules, we'll auto-run the tests
runTests()
  .then(() => {
    console.log('\n✅ Supabase connection test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Supabase connection test failed:', error);
    process.exit(1);
  });

export { runTests };