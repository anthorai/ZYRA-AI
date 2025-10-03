#!/usr/bin/env node

/**
 * Automated Logout Functionality Test using Puppeteer
 * 
 * This script tests the complete logout workflow:
 * 1. Navigate to the application
 * 2. Authenticate (if needed)
 * 3. Verify authenticated navbar state
 * 4. Test logout functionality
 * 5. Verify post-logout state
 */

const puppeteer = require('puppeteer');

class LogoutFunctionalityTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  logResult(test, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const message = `${status}: ${test}`;
    console.log(message + (details ? ` - ${details}` : ''));
    
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    
    this.results.details.push({ test, passed, details });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForSelector(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  async takeScreenshot(name) {
    const filename = `screenshot_${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  async initialize() {
    console.log('🚀 Initializing browser for logout functionality testing...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`🔴 Browser Error: ${msg.text()}`);
      }
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async navigateToApp() {
    console.log('\n📍 STEP 1: Navigate to Application');
    
    try {
      await this.page.goto('http://localhost:5000', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const title = await this.page.title();
      console.log(`Page title: ${title}`);
      
      await this.takeScreenshot('initial_page');
      
      this.logResult('Application loaded successfully', true, `Title: ${title}`);
      return true;
    } catch (error) {
      this.logResult('Application loading', false, error.message);
      return false;
    }
  }

  async checkAuthenticationState() {
    console.log('\n📍 STEP 2: Check Authentication State');
    
    await this.delay(2000); // Wait for app to load
    
    // Check for logout button (indicates logged in)
    const logoutBtn = await this.page.$('[data-testid="button-logout"]') ||
                     await this.page.$('button:has-text("Logout")') ||
                     await this.page.$('button:has-text("logout")');
    
    // Check for dashboard button
    const dashboardBtn = await this.page.$('[data-testid="link-dashboard"]') ||
                        await this.page.$('a[href="/dashboard"]');
    
    // Check for login button
    const loginBtn = await this.page.$('[data-testid="link-login"]') ||
                    await this.page.$('a[href="/auth"]') ||
                    await this.page.$('a:has-text("Login")');
    
    if (logoutBtn) {
      console.log('✅ User appears to be logged in');
      this.logResult('User authentication state', true, 'User is logged in');
      return 'authenticated';
    } else if (loginBtn) {
      console.log('⚠️ User appears to be logged out');
      this.logResult('User authentication state', true, 'User is logged out');
      return 'unauthenticated';
    } else {
      console.log('❓ Unable to determine authentication state');
      this.logResult('Authentication state detection', false, 'Unable to determine state');
      return 'unknown';
    }
  }

  async authenticateUser() {
    console.log('\n📍 STEP 3: Authenticate User');
    
    try {
      // Look for login button
      const loginBtn = await this.page.$('[data-testid="link-login"]') ||
                      await this.page.$('a[href="/auth"]');
      
      if (loginBtn) {
        console.log('🔍 Found login button, clicking...');
        await loginBtn.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      } else {
        console.log('🔍 Navigating directly to auth page...');
        await this.page.goto('http://localhost:5000/auth', { waitUntil: 'networkidle2' });
      }
      
      await this.takeScreenshot('auth_page');
      
      // Wait for form elements
      const emailInputFound = await this.waitForSelector('[data-testid="input-email"]', 5000);
      const passwordInputFound = await this.waitForSelector('[data-testid="input-password"]', 5000);
      const submitBtnFound = await this.waitForSelector('[data-testid="button-login"]', 5000);
      
      if (emailInputFound && passwordInputFound && submitBtnFound) {
        console.log('📝 Filling authentication form...');
        
        // Fill email
        await this.page.type('[data-testid="input-email"]', 'test@zyra.com');
        await this.delay(500);
        
        // Fill password
        await this.page.type('[data-testid="input-password"]', 'testpassword123');
        await this.delay(500);
        
        console.log('🚀 Submitting authentication form...');
        await this.page.click('[data-testid="button-login"]');
        
        // Wait for potential redirect or auth completion
        await this.delay(4000);
        
        await this.takeScreenshot('after_auth_attempt');
        
        this.logResult('Authentication form submission', true, 'Form filled and submitted');
        return true;
      } else {
        throw new Error('Authentication form elements not found');
      }
    } catch (error) {
      this.logResult('User authentication', false, error.message);
      return false;
    }
  }

  async verifyAuthenticatedState() {
    console.log('\n📍 STEP 4: Verify Authenticated State');
    
    await this.delay(2000);
    
    // Check current URL
    const currentUrl = this.page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check for authenticated navbar elements
    const logoutBtn = await this.page.$('[data-testid="button-logout"]');
    const dashboardBtn = await this.page.$('[data-testid="link-dashboard"]');
    const loginBtn = await this.page.$('[data-testid="link-login"]');
    
    // Use broader selectors if specific ones don't work
    const logoutBtnBroad = logoutBtn || await this.page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button, a')).find(el => 
        el.textContent && el.textContent.toLowerCase().includes('logout')
      );
    });
    
    const dashboardBtnBroad = dashboardBtn || await this.page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('a, button')).find(el => 
        el.textContent && el.textContent.toLowerCase().includes('dashboard')
      );
    });
    
    const hasLogoutBtn = await this.page.evaluate(btn => !!btn, logoutBtnBroad);
    const hasDashboardBtn = await this.page.evaluate(btn => !!btn, dashboardBtnBroad);
    const hasLoginBtn = !!loginBtn;
    
    this.logResult('Dashboard button visible when authenticated', hasDashboardBtn,
                   hasDashboardBtn ? 'Dashboard button found' : 'Dashboard button missing');
    this.logResult('Logout button visible when authenticated', hasLogoutBtn,
                   hasLogoutBtn ? 'Logout button found' : 'Logout button missing');
    this.logResult('Login button hidden when authenticated', !hasLoginBtn,
                   hasLoginBtn ? 'Login button still visible' : 'Login button properly hidden');
    
    await this.takeScreenshot('authenticated_state');
    
    return hasLogoutBtn;
  }

  async testLogoutFunctionality() {
    console.log('\n📍 STEP 5: Test Logout Functionality');
    
    // Find logout button
    let logoutBtn = await this.page.$('[data-testid="button-logout"]');
    
    if (!logoutBtn) {
      // Try broader search
      logoutBtn = await this.page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button, a')).find(el => 
          el.textContent && el.textContent.toLowerCase().includes('logout')
        );
      });
      
      const hasBtn = await this.page.evaluate(btn => !!btn, logoutBtn);
      if (!hasBtn) {
        this.logResult('Logout button availability', false, 'Logout button not found');
        return false;
      }
    }
    
    // Check if button is enabled
    const isEnabled = await this.page.evaluate(btn => {
      return btn && !btn.disabled && !btn.hasAttribute('disabled');
    }, logoutBtn);
    
    this.logResult('Logout button is enabled', isEnabled,
                   isEnabled ? 'Button is clickable' : 'Button is disabled');
    
    if (!isEnabled) {
      return false;
    }
    
    // Get initial button text
    const initialText = await this.page.evaluate(btn => btn.textContent.trim(), logoutBtn);
    console.log(`Initial logout button text: "${initialText}"`);
    
    // Click logout button
    console.log('🖱️ Clicking logout button...');
    await this.page.evaluate(btn => btn.click(), logoutBtn);
    
    // Check for loading state
    await this.delay(500);
    
    const afterClickText = await this.page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => 
        el.textContent && el.textContent.toLowerCase().includes('logout')
      );
      return btn ? btn.textContent.trim() : '';
    });
    
    const showsLoading = afterClickText.toLowerCase().includes('logging out') ||
                       afterClickText.toLowerCase().includes('signing out');
    
    this.logResult('Logout button shows loading state', showsLoading,
                   `Button text changed to: "${afterClickText}"`);
    
    await this.takeScreenshot('logout_loading_state');
    
    return true;
  }

  async verifyLogoutCompletion() {
    console.log('\n📍 STEP 6: Verify Logout Completion');
    
    // Wait for logout to complete
    console.log('⏱️ Waiting for logout to complete...');
    await this.delay(4000);
    
    const postLogoutUrl = this.page.url();
    console.log(`Post-logout URL: ${postLogoutUrl}`);
    
    // Check if redirected to landing page
    const isOnLanding = postLogoutUrl.includes('localhost:5000') && 
                       !postLogoutUrl.includes('/auth') && 
                       !postLogoutUrl.includes('/dashboard');
    
    this.logResult('Redirected to landing page after logout', isOnLanding,
                   `Final URL: ${postLogoutUrl}`);
    
    await this.takeScreenshot('post_logout_state');
    
    return isOnLanding;
  }

  async verifyPostLogoutNavbar() {
    console.log('\n📍 STEP 7: Verify Post-Logout Navbar State');
    
    await this.delay(1000);
    
    // Check navbar state after logout
    const loginBtn = await this.page.$('[data-testid="link-login"]');
    const dashboardBtn = await this.page.$('[data-testid="link-dashboard"]');
    const logoutBtn = await this.page.$('[data-testid="button-logout"]');
    
    // Use broader searches if specific selectors don't work
    const hasLoginBtn = loginBtn || await this.page.evaluate(() => {
      return !!Array.from(document.querySelectorAll('a, button')).find(el => 
        el.textContent && el.textContent.toLowerCase().includes('login')
      );
    });
    
    const hasDashboardBtn = dashboardBtn || await this.page.evaluate(() => {
      return !!Array.from(document.querySelectorAll('a, button')).find(el => 
        el.textContent && el.textContent.toLowerCase().includes('dashboard')
      );
    });
    
    const hasLogoutBtn = logoutBtn || await this.page.evaluate(() => {
      return !!Array.from(document.querySelectorAll('button, a')).find(el => 
        el.textContent && el.textContent.toLowerCase().includes('logout')
      );
    });
    
    this.logResult('Login button visible after logout', hasLoginBtn,
                   hasLoginBtn ? 'Login button restored' : 'Login button missing');
    this.logResult('Dashboard button hidden after logout', !hasDashboardBtn,
                   hasDashboardBtn ? 'Dashboard button still visible' : 'Dashboard button properly hidden');
    this.logResult('Logout button hidden after logout', !hasLogoutBtn,
                   hasLogoutBtn ? 'Logout button still visible' : 'Logout button properly hidden');
    
    await this.takeScreenshot('final_navbar_state');
  }

  async verifySessionClearing() {
    console.log('\n📍 STEP 8: Verify Session Clearing');
    
    const originalUrl = this.page.url();
    console.log('🔍 Attempting to access dashboard to verify session clearing...');
    
    try {
      await this.page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle2' });
      await this.delay(2000);
      
      const dashboardAccessUrl = this.page.url();
      const canAccessDashboard = dashboardAccessUrl.includes('/dashboard');
      
      this.logResult('Session properly cleared (cannot access dashboard)', !canAccessDashboard,
                     `Dashboard access resulted in: ${dashboardAccessUrl}`);
      
      // Return to original page
      if (originalUrl !== dashboardAccessUrl && !canAccessDashboard) {
        await this.page.goto(originalUrl, { waitUntil: 'networkidle2' });
      }
      
      await this.takeScreenshot('session_clearing_test');
      
    } catch (error) {
      this.logResult('Session clearing test', false, error.message);
    }
  }

  async runCompleteTest() {
    console.log('🔬 Starting Comprehensive Logout Functionality Test');
    console.log('==================================================');
    
    try {
      await this.initialize();
      
      const appLoaded = await this.navigateToApp();
      if (!appLoaded) {
        throw new Error('Failed to load application');
      }
      
      const authState = await this.checkAuthenticationState();
      
      if (authState === 'unauthenticated') {
        const authSuccess = await this.authenticateUser();
        if (!authSuccess) {
          console.log('⚠️ Authentication failed - continuing to test current state');
        }
      }
      
      const hasLogoutBtn = await this.verifyAuthenticatedState();
      
      if (hasLogoutBtn) {
        const logoutSuccess = await this.testLogoutFunctionality();
        
        if (logoutSuccess) {
          await this.verifyLogoutCompletion();
          await this.verifyPostLogoutNavbar();
          await this.verifySessionClearing();
        }
      } else {
        console.log('❌ Cannot test logout - user not authenticated');
        this.logResult('Logout test execution', false, 'User not authenticated');
      }
      
    } catch (error) {
      console.error('❌ Test execution error:', error);
      this.logResult('Test execution', false, error.message);
    }
    
    await this.generateReport();
    await this.cleanup();
  }

  async generateReport() {
    console.log('\n📊 LOGOUT FUNCTIONALITY TEST RESULTS');
    console.log('====================================');
    console.log(`✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);
    
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
    console.log(`📈 Success Rate: ${successRate}%`);
    
    console.log('\n📋 Detailed Test Results:');
    this.results.details.forEach((result, index) => {
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
    
    // Write results to file
    const reportData = {
      timestamp: new Date().toISOString(),
      successRate,
      totalTests: total,
      passed: this.results.passed,
      failed: this.results.failed,
      details: this.results.details
    };
    
    require('fs').writeFileSync('logout_test_report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: logout_test_report.json');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleanup completed');
    }
  }
}

// Run the test
async function main() {
  const tester = new LogoutFunctionalityTester();
  await tester.runCompleteTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LogoutFunctionalityTester;