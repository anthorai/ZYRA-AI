/**
 * Comprehensive Logout Functionality Test
 * Tests the complete logout workflow including:
 * - Authentication state verification
 * - Navbar state changes
 * - Logout button functionality
 * - Session clearing
 * - Redirect behavior
 */

// Wait for DOM and page load
async function waitForLoad() {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// Wait for element with timeout
async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

// Wait for element to disappear
async function waitForElementToDisappear(selector, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (!element) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

// Screenshot helper
async function takeScreenshot(description) {
  console.log(`📸 Taking screenshot: ${description}`);
  // This would trigger screenshot in browser context
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function logResult(test, passed, details = '') {
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${test}: PASSED ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${test}: FAILED ${details}`);
  }
  testResults.details.push({ test, passed, details });
}

async function runLogoutTests() {
  console.log('🔬 Starting Logout Functionality Tests...');
  
  try {
    await waitForLoad();
    
    // Step 1: Check initial state
    console.log('\n📍 Step 1: Checking initial application state...');
    await takeScreenshot('Initial page state');
    
    const currentUrl = window.location.href;
    console.log(`Current URL: ${currentUrl}`);
    
    // Check if we're on landing page or need to navigate
    if (!currentUrl.includes('localhost:5000')) {
      window.location.href = 'http://localhost:5000';
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Step 2: Navigate to auth page
    console.log('\n📍 Step 2: Navigating to authentication page...');
    
    // Look for login button in navbar
    let loginButton = document.querySelector('[data-testid="link-login"]') || 
                     document.querySelector('a[href="/auth"]') ||
                     document.querySelector('button:contains("Login")') ||
                     document.querySelector('nav a:contains("Login")');
    
    if (!loginButton) {
      // Try alternative selectors
      const navButtons = document.querySelectorAll('nav button, nav a');
      for (const btn of navButtons) {
        if (btn.textContent.toLowerCase().includes('login')) {
          loginButton = btn;
          break;
        }
      }
    }
    
    if (loginButton) {
      console.log('🔍 Found login button, clicking...');
      loginButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('🔍 No login button found, navigating directly to /auth');
      window.location.href = window.location.origin + '/auth';
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await takeScreenshot('Auth page loaded');
    
    // Step 3: Fill out and submit login form
    console.log('\n📍 Step 3: Authenticating with test credentials...');
    
    try {
      // Wait for login form elements
      const emailInput = await waitForElement('[data-testid="input-email"]', 5000);
      const passwordInput = await waitForElement('[data-testid="input-password"]', 5000);
      const loginSubmitButton = await waitForElement('[data-testid="button-login"]', 5000);
      
      console.log('📝 Filling login form...');
      
      // Fill form with test credentials
      emailInput.value = 'test@zyra.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'testpassword123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🚀 Submitting login form...');
      loginSubmitButton.click();
      
      // Wait for authentication to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logResult('Login form submission', true, 'Form filled and submitted successfully');
      
    } catch (error) {
      console.log('⚠️ Login form test failed, may already be logged in or different form structure');
      logResult('Login form submission', false, error.message);
    }
    
    await takeScreenshot('After login attempt');
    
    // Step 4: Verify authenticated state and navbar
    console.log('\n📍 Step 4: Verifying authenticated state and navbar...');
    
    // Wait for potential redirect to dashboard
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check current URL
    const postAuthUrl = window.location.href;
    console.log(`Post-auth URL: ${postAuthUrl}`);
    
    // Look for Dashboard and Logout buttons in navbar
    const dashboardButton = document.querySelector('[data-testid="link-dashboard"]') ||
                           document.querySelector('a[href="/dashboard"]') ||
                           document.querySelector('nav a:contains("Dashboard")');
    
    const logoutButton = document.querySelector('[data-testid="button-logout"]') ||
                        document.querySelector('button:contains("Logout")') ||
                        document.querySelector('nav button:contains("Logout")');
    
    if (!logoutButton) {
      // Look more broadly for logout functionality
      const navButtons = document.querySelectorAll('nav button, nav a');
      for (const btn of navButtons) {
        if (btn.textContent.toLowerCase().includes('logout')) {
          logoutButton = btn;
          break;
        }
      }
    }
    
    console.log(`Dashboard button found: ${!!dashboardButton}`);
    console.log(`Logout button found: ${!!logoutButton}`);
    
    logResult('Dashboard button visible when authenticated', !!dashboardButton, 
              dashboardButton ? 'Dashboard button found in navbar' : 'Dashboard button not found');
    logResult('Logout button visible when authenticated', !!logoutButton,
              logoutButton ? 'Logout button found in navbar' : 'Logout button not found');
    
    if (!logoutButton) {
      console.log('❌ Cannot proceed with logout test - logout button not found');
      console.log('Available nav elements:');
      document.querySelectorAll('nav *').forEach((el, i) => {
        console.log(`  ${i}: ${el.tagName} - "${el.textContent?.trim()}" (${el.className})`);
      });
      return;
    }
    
    await takeScreenshot('Authenticated state with navbar');
    
    // Step 5: Test logout button functionality
    console.log('\n📍 Step 5: Testing logout button functionality...');
    
    const initialLogoutText = logoutButton.textContent;
    console.log(`Initial logout button text: "${initialLogoutText}"`);
    
    // Check if button is enabled
    const isEnabled = !logoutButton.disabled && !logoutButton.hasAttribute('disabled');
    logResult('Logout button is enabled', isEnabled, 
              isEnabled ? 'Button is clickable' : 'Button is disabled');
    
    if (isEnabled) {
      console.log('🖱️ Clicking logout button...');
      logoutButton.click();
      
      // Step 6: Verify logout process states
      console.log('\n📍 Step 6: Verifying logout process states...');
      
      // Check for "Logging out..." state
      await new Promise(resolve => setTimeout(resolve, 500));
      const currentLogoutText = logoutButton.textContent;
      const showsLoggingOut = currentLogoutText.toLowerCase().includes('logging out') ||
                             currentLogoutText.toLowerCase().includes('signing out');
      
      logResult('Logout button shows "Logging out..." state', showsLoggingOut,
                `Button text changed to: "${currentLogoutText}"`);
      
      // Wait for logout to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await takeScreenshot('After logout button click');
      
      // Step 7: Verify post-logout state
      console.log('\n📍 Step 7: Verifying post-logout state...');
      
      const finalUrl = window.location.href;
      console.log(`Final URL: ${finalUrl}`);
      
      // Check if redirected to landing page
      const isOnLanding = finalUrl.includes('localhost:5000') && 
                         !finalUrl.includes('/auth') && 
                         !finalUrl.includes('/dashboard');
      
      logResult('Redirected to landing page after logout', isOnLanding,
                `Current URL: ${finalUrl}`);
      
      // Check navbar state after logout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const postLogoutLoginButton = document.querySelector('[data-testid="link-login"]') ||
                                   document.querySelector('a[href="/auth"]') ||
                                   document.querySelector('nav a:contains("Login")');
      
      const postLogoutDashboardButton = document.querySelector('[data-testid="link-dashboard"]') ||
                                       document.querySelector('a[href="/dashboard"]');
      
      const postLogoutLogoutButton = document.querySelector('[data-testid="button-logout"]') ||
                                    document.querySelector('button:contains("Logout")');
      
      logResult('Login button visible after logout', !!postLogoutLoginButton,
                postLogoutLoginButton ? 'Login button restored in navbar' : 'Login button not found');
      logResult('Dashboard button hidden after logout', !postLogoutDashboardButton,
                postLogoutDashboardButton ? 'Dashboard button still visible' : 'Dashboard button properly hidden');
      logResult('Logout button hidden after logout', !postLogoutLogoutButton,
                postLogoutLogoutButton ? 'Logout button still visible' : 'Logout button properly hidden');
      
      await takeScreenshot('Final state after logout');
      
      // Step 8: Test session clearing by trying to access dashboard
      console.log('\n📍 Step 8: Testing session clearing...');
      
      const originalUrl = window.location.href;
      window.location.href = window.location.origin + '/dashboard';
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const dashboardAccessUrl = window.location.href;
      const canAccessDashboard = dashboardAccessUrl.includes('/dashboard');
      
      logResult('Session properly cleared (cannot access dashboard)', !canAccessDashboard,
                `Attempted dashboard access resulted in: ${dashboardAccessUrl}`);
      
      // Return to original page
      if (originalUrl !== dashboardAccessUrl) {
        window.location.href = originalUrl;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } else {
      logResult('Logout button click test', false, 'Button was disabled');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    logResult('Test execution', false, error.message);
  }
  
  // Final results
  console.log('\n📊 LOGOUT FUNCTIONALITY TEST RESULTS');
  console.log('=====================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  console.log('\n📋 Detailed Results:');
  testResults.details.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.details}`);
  });
  
  return testResults;
}

// Auto-run tests when script loads
runLogoutTests().catch(console.error);