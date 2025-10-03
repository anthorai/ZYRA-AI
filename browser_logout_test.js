/**
 * Browser Console Logout Functionality Test
 * 
 * This script can be copied and pasted into the browser console
 * to test the logout functionality step by step.
 * 
 * Usage:
 * 1. Open http://localhost:5000 in browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 * 5. The test will run automatically and report results
 */

(async function runLogoutTest() {
  console.log('🔬 Starting Comprehensive Logout Functionality Test');
  console.log('==================================================');
  
  const results = {
    passed: 0,
    failed: 0,
    details: []
  };
  
  function logResult(test, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const message = `${status}: ${test} ${details ? '- ' + details : ''}`;
    console.log(message);
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.details.push({ test, passed, details });
  }
  
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function waitForElement(selector, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await delay(100);
    }
    return null;
  }
  
  try {
    // Test 1: Check current URL
    console.log('\n📍 STEP 1: Initial State Check');
    const currentUrl = window.location.href;
    console.log(`Current URL: ${currentUrl}`);
    
    // Test 2: Check if already authenticated
    console.log('\n📍 STEP 2: Authentication State Check');
    
    const existingLogoutBtn = document.querySelector('[data-testid="button-logout"]') ||
                             document.querySelector('button[onclick*="logout"]') ||
                             Array.from(document.querySelectorAll('button, a')).find(el => 
                                 el.textContent && el.textContent.toLowerCase().includes('logout'));
    
    const existingDashboardBtn = document.querySelector('[data-testid="link-dashboard"]') ||
                                document.querySelector('a[href="/dashboard"]') ||
                                Array.from(document.querySelectorAll('a, button')).find(el => 
                                    el.textContent && el.textContent.toLowerCase().includes('dashboard'));
    
    const existingLoginBtn = document.querySelector('[data-testid="link-login"]') ||
                            document.querySelector('a[href="/auth"]') ||
                            Array.from(document.querySelectorAll('a, button')).find(el => 
                                el.textContent && el.textContent.toLowerCase().includes('login'));
    
    if (existingLogoutBtn) {
      console.log('✅ User appears to be logged in - logout button found');
      logResult('Initial authentication state detection', true, 'Logout button visible');
      
      // Test 3: Verify authenticated navbar state
      console.log('\n📍 STEP 3: Verify Authenticated Navbar State');
      
      logResult('Dashboard button visible when authenticated', !!existingDashboardBtn, 
                existingDashboardBtn ? 'Dashboard button found' : 'Dashboard button missing');
      logResult('Logout button visible when authenticated', true, 'Logout button confirmed');
      
      // Test 4: Verify logout button is enabled
      console.log('\n📍 STEP 4: Logout Button State Verification');
      
      const isEnabled = !existingLogoutBtn.disabled && !existingLogoutBtn.hasAttribute('disabled');
      logResult('Logout button is enabled', isEnabled, 
                isEnabled ? 'Button is clickable' : 'Button is disabled');
      
      if (isEnabled) {
        // Test 5: Execute logout
        console.log('\n📍 STEP 5: Execute Logout Process');
        
        const initialText = existingLogoutBtn.textContent.trim();
        console.log(`Initial logout button text: "${initialText}"`);
        
        // Click logout button
        console.log('🖱️ Clicking logout button...');
        existingLogoutBtn.click();
        
        // Test 6: Verify logout loading state
        console.log('\n📍 STEP 6: Verify Logout Loading State');
        await delay(500); // Wait for loading state
        
        const afterClickText = existingLogoutBtn.textContent.trim();
        const showsLoading = afterClickText.toLowerCase().includes('logging out') || 
                           afterClickText.toLowerCase().includes('signing out') ||
                           existingLogoutBtn.disabled;
        
        logResult('Logout button shows loading state', showsLoading, 
                  `Button text: "${afterClickText}", Disabled: ${existingLogoutBtn.disabled}`);
        
        // Test 7: Wait for logout completion and verify redirect
        console.log('\n📍 STEP 7: Wait for Logout Completion');
        console.log('⏱️ Waiting for logout to complete...');
        
        await delay(3000); // Wait for logout to complete
        
        const postLogoutUrl = window.location.href;
        console.log(`Post-logout URL: ${postLogoutUrl}`);
        
        const isOnLanding = postLogoutUrl.includes('localhost:5000') && 
                           !postLogoutUrl.includes('/auth') && 
                           !postLogoutUrl.includes('/dashboard');
        
        logResult('Redirected to landing page after logout', isOnLanding,
                  `URL: ${postLogoutUrl}`);
        
        // Test 8: Verify post-logout navbar state
        console.log('\n📍 STEP 8: Verify Post-Logout Navbar State');
        await delay(1000); // Wait for navbar to update
        
        const postLogoutLoginBtn = document.querySelector('[data-testid="link-login"]') ||
                                  document.querySelector('a[href="/auth"]') ||
                                  Array.from(document.querySelectorAll('a, button')).find(el => 
                                      el.textContent && el.textContent.toLowerCase().includes('login'));
        
        const postLogoutDashboardBtn = document.querySelector('[data-testid="link-dashboard"]') ||
                                      document.querySelector('a[href="/dashboard"]') ||
                                      Array.from(document.querySelectorAll('a, button')).find(el => 
                                          el.textContent && el.textContent.toLowerCase().includes('dashboard'));
        
        const postLogoutLogoutBtn = document.querySelector('[data-testid="button-logout"]') ||
                                   Array.from(document.querySelectorAll('button, a')).find(el => 
                                       el.textContent && el.textContent.toLowerCase().includes('logout'));
        
        logResult('Login button visible after logout', !!postLogoutLoginBtn,
                  postLogoutLoginBtn ? 'Login button restored' : 'Login button missing');
        logResult('Dashboard button hidden after logout', !postLogoutDashboardBtn,
                  postLogoutDashboardBtn ? 'Dashboard button still visible' : 'Dashboard button properly hidden');
        logResult('Logout button hidden after logout', !postLogoutLogoutBtn,
                  postLogoutLogoutBtn ? 'Logout button still visible' : 'Logout button properly hidden');
        
        // Test 9: Verify session clearing by attempting dashboard access
        console.log('\n📍 STEP 9: Verify Session Clearing');
        
        const originalUrl = window.location.href;
        console.log('🔍 Attempting to access dashboard to verify session clearing...');
        
        // Try to navigate to dashboard
        window.location.href = window.location.origin + '/dashboard';
        await delay(2000);
        
        const dashboardAccessUrl = window.location.href;
        const canAccessDashboard = dashboardAccessUrl.includes('/dashboard');
        
        logResult('Session properly cleared (cannot access dashboard)', !canAccessDashboard,
                  `Dashboard access result: ${dashboardAccessUrl}`);
        
        // Return to original page if we were redirected
        if (originalUrl !== dashboardAccessUrl && !canAccessDashboard) {
          console.log('🔄 Returning to landing page...');
          window.location.href = originalUrl;
          await delay(1000);
        }
        
      } else {
        logResult('Logout button interaction test', false, 'Button was disabled');
      }
      
    } else {
      console.log('⚠️ User appears to be logged out already');
      console.log('🔄 Need to authenticate first to test logout functionality');
      
      if (existingLoginBtn) {
        console.log('📝 Found login button - redirecting to authentication...');
        existingLoginBtn.click();
        await delay(2000);
        
        console.log('ℹ️ Please authenticate in the auth page, then run this test again');
        logResult('Initial authentication state', false, 'User not logged in - please authenticate first');
      } else {
        console.log('❌ No login button found - navigating to auth page...');
        window.location.href = window.location.origin + '/auth';
        logResult('Navigation to auth page', true, 'Redirected to auth page');
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    logResult('Test execution', false, error.message);
  }
  
  // Final results summary
  console.log('\n📊 LOGOUT FUNCTIONALITY TEST RESULTS');
  console.log('====================================');
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  
  const total = results.passed + results.failed;
  const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  console.log(`📈 Success Rate: ${successRate}%`);
  
  console.log('\n📋 Detailed Test Results:');
  results.details.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}`);
    if (result.details) {
      console.log(`   └─ ${result.details}`);
    }
  });
  
  // Overall assessment
  console.log('\n🎯 OVERALL ASSESSMENT:');
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT: Logout functionality working perfectly!');
  } else if (successRate >= 75) {
    console.log('✅ GOOD: Logout functionality working well with minor issues');
  } else if (successRate >= 50) {
    console.log('⚠️ NEEDS ATTENTION: Logout functionality partially working');
  } else {
    console.log('❌ CRITICAL: Logout functionality requires immediate attention');
  }
  
  // Return results for further analysis
  return results;
})();