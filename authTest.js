// Browser-compatible Supabase Authentication Test
// This file should be loaded in the browser console or included in a webpage

/**
 * Simple Browser-based Authentication Test for Supabase
 * To use: Open browser console and paste this code, or include as script tag
 */

// Create Supabase client using environment variables (remove hardcoded credentials)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'; // Replace with your project URL  
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_KEY || 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key

console.log('🚀 Starting Browser Supabase Authentication Test');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Key:', SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌');

// Test user credentials
const testUser = {
  email: 'test@zyra.dev',
  password: 'TestPassword123!',
  fullName: 'Test User'
};

// Create client using CDN import
async function initializeSupabase() {
  // If running in browser with supabase already loaded
  if (typeof window !== 'undefined' && window.supabase) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  
  // Dynamic import for ES modules
  try {
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.error('Failed to import Supabase:', error);
    throw error;
  }
}

// Test functions
async function testSignUp(supabase) {
  console.log('\n🧪 Testing Sign Up...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.fullName,
        }
      }
    });

    if (error) {
      console.log('❌ Sign up error:', error.message);
      return false;
    }

    if (data.user) {
      console.log('✅ Sign up successful');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      return true;
    } else {
      console.log('⚠️ No user data returned');
      return false;
    }
  } catch (error) {
    console.log('❌ Sign up exception:', error.message);
    return false;
  }
}

async function testSignIn(supabase) {
  console.log('\n🧪 Testing Sign In...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (error) {
      console.log('❌ Sign in error:', error.message);
      return false;
    }

    if (data.user) {
      console.log('✅ Sign in successful');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Session expires:', data.session?.expires_at);
      return true;
    } else {
      console.log('⚠️ No user data returned');
      return false;
    }
  } catch (error) {
    console.log('❌ Sign in exception:', error.message);
    return false;
  }
}

async function testGetUser(supabase) {
  console.log('\n🧪 Testing Get Current User...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.log('❌ Get user error:', error.message);
      return false;
    }

    if (user) {
      console.log('✅ Current user retrieved');
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Created:', user.created_at);
      return true;
    } else {
      console.log('⚠️ No current user');
      return false;
    }
  } catch (error) {
    console.log('❌ Get user exception:', error.message);
    return false;
  }
}

async function testSignOut(supabase) {
  console.log('\n🧪 Testing Sign Out...');
  
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log('❌ Sign out error:', error.message);
      return false;
    }

    console.log('✅ Sign out successful');
    return true;
  } catch (error) {
    console.log('❌ Sign out exception:', error.message);
    return false;
  }
}

// Main test runner
async function runAuthTests() {
  try {
    console.log('\n🔧 Initializing Supabase client...');
    const supabase = await initializeSupabase();
    console.log('✅ Supabase client initialized');

    // Clear any existing session
    await supabase.auth.signOut();
    console.log('🧹 Session cleared');

    // Wait for auth state to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run tests
    const signUpResult = await testSignUp(supabase);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const signInResult = await testSignIn(supabase);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const getUserResult = await testGetUser(supabase);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const signOutResult = await testSignOut(supabase);

    // Summary
    console.log('\n📊 Test Results:');
    console.log('   Sign Up:', signUpResult ? '✅ PASS' : '❌ FAIL');
    console.log('   Sign In:', signInResult ? '✅ PASS' : '❌ FAIL');
    console.log('   Get User:', getUserResult ? '✅ PASS' : '❌ FAIL');
    console.log('   Sign Out:', signOutResult ? '✅ PASS' : '❌ FAIL');

    const passedTests = [signUpResult, signInResult, getUserResult, signOutResult].filter(Boolean).length;
    console.log(`\n🎯 Overall: ${passedTests}/4 tests passed`);

    return { signUpResult, signInResult, getUserResult, signOutResult, passedTests };

  } catch (error) {
    console.error('💥 Test initialization failed:', error);
    return null;
  }
}

// Instructions for manual testing
console.log(`
🔬 Supabase Authentication Test Instructions:

1. BROWSER CONSOLE METHOD:
   - Open your browser's Developer Tools (F12)
   - Go to the Console tab
   - Run: runAuthTests()

2. WEBPAGE METHOD:
   - Include this script in your HTML page
   - The tests will run automatically

3. MANUAL TESTING:
   - Call individual functions: testSignUp(), testSignIn(), etc.
   - Each function requires the supabase client as parameter

4. CHECK SUPABASE DASHBOARD:
   - Go to Authentication > Users in your Supabase dashboard
   - Verify test user was created/removed

Example usage in console:
runAuthTests().then(results => console.log('Final results:', results));
`);

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  // Add to global scope for manual testing
  window.runAuthTests = runAuthTests;
  window.testUser = testUser;
  
  console.log('\n✅ Functions available globally: runAuthTests(), testUser');
  console.log('💡 Run "runAuthTests()" to start the tests');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAuthTests, testSignUp, testSignIn, testGetUser, testSignOut };
}