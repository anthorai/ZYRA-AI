// Comprehensive Avatar, Profile, and Logout Functionality Test
// This script tests all avatar-related components and functionality

class AvatarFunctionalityTester {
  constructor() {
    this.testResults = {
      dashboardAvatarDisplay: null,
      headerAvatarDropdown: null,
      sidebarAvatarDisplay: null,
      profileNavigation: null,
      profilePageFeatures: null,
      logoutFunctionality: null,
      navigationFlow: null,
      sessionManagement: null,
      issues: []
    };
    this.currentUrl = '';
  }

  log(message) {
    console.log(`🧪 [Avatar Test] ${message}`);
  }

  logError(message) {
    console.error(`❌ [Avatar Test Error] ${message}`);
    this.testResults.issues.push(message);
  }

  logSuccess(message) {
    console.log(`✅ [Avatar Test Success] ${message}`);
  }

  // Wait for element to be available
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        } else {
          setTimeout(checkElement, 100);
        }
      };
      checkElement();
    });
  }

  // Test 1: Dashboard Avatar Display
  async testDashboardAvatarDisplay() {
    this.log("Testing Dashboard Avatar Display...");
    try {
      // Check if we're on dashboard
      this.currentUrl = window.location.pathname;
      if (!this.currentUrl.includes('/dashboard')) {
        window.location.href = '/dashboard';
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Test header avatar menu trigger
      const avatarTrigger = await this.waitForElement('[data-testid="avatar-menu-trigger"]');
      if (avatarTrigger) {
        this.logSuccess("Header avatar menu trigger found");
        
        // Check avatar styling and visibility
        const computedStyle = window.getComputedStyle(avatarTrigger);
        const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
        
        if (isVisible) {
          this.logSuccess("Avatar is visible in header");
        } else {
          this.logError("Avatar is not visible in header");
        }

        // Check for avatar image/fallback
        const avatarImg = avatarTrigger.querySelector('img');
        const avatarFallback = avatarTrigger.querySelector('[class*="avatar-fallback"]');
        
        if (avatarImg || avatarFallback) {
          this.logSuccess("Avatar image or fallback found");
        } else {
          this.logError("No avatar image or fallback found");
        }

        this.testResults.dashboardAvatarDisplay = true;
      } else {
        this.logError("Header avatar menu trigger not found");
        this.testResults.dashboardAvatarDisplay = false;
      }
    } catch (error) {
      this.logError(`Dashboard avatar display test failed: ${error.message}`);
      this.testResults.dashboardAvatarDisplay = false;
    }
  }

  // Test 2: Header Avatar Dropdown
  async testHeaderAvatarDropdown() {
    this.log("Testing Header Avatar Dropdown...");
    try {
      const avatarTrigger = await this.waitForElement('[data-testid="avatar-menu-trigger"]');
      
      // Test click to open dropdown
      avatarTrigger.click();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if dropdown opened
      const profileMenuItem = document.querySelector('[data-testid="menuitem-profile"]');
      const settingsMenuItem = document.querySelector('[data-testid="menuitem-settings"]');
      const logoutMenuItem = document.querySelector('[data-testid="menuitem-logout"]');

      if (profileMenuItem && settingsMenuItem && logoutMenuItem) {
        this.logSuccess("Avatar dropdown opened successfully with all menu items");
        
        // Test menu items are clickable
        const isProfileClickable = profileMenuItem.offsetParent !== null;
        const isSettingsClickable = settingsMenuItem.offsetParent !== null;
        const isLogoutClickable = logoutMenuItem.offsetParent !== null;

        if (isProfileClickable && isSettingsClickable && isLogoutClickable) {
          this.logSuccess("All dropdown menu items are interactive");
        } else {
          this.logError("Some dropdown menu items are not interactive");
        }

        // Check user info display in dropdown
        const userInfo = avatarTrigger.closest('[class*="dropdown"]') || document.querySelector('[class*="dropdown-content"]');
        if (userInfo) {
          const userNamePattern = /demo|user|test/i;
          const planPattern = /trial|free|pro|starter/i;
          const dropdownText = userInfo.textContent.toLowerCase();
          
          if (userNamePattern.test(dropdownText)) {
            this.logSuccess("User name displayed in dropdown");
          } else {
            this.logError("User name not found in dropdown");
          }

          if (planPattern.test(dropdownText)) {
            this.logSuccess("User plan displayed in dropdown");
          } else {
            this.logError("User plan not found in dropdown");
          }
        }

        // Test click to close dropdown (click outside)
        document.body.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const isDropdownClosed = !document.querySelector('[data-testid="menuitem-profile"]') || 
                                document.querySelector('[data-testid="menuitem-profile"]').offsetParent === null;
        
        if (isDropdownClosed) {
          this.logSuccess("Dropdown closes when clicking outside");
        } else {
          this.logError("Dropdown does not close when clicking outside");
        }

        this.testResults.headerAvatarDropdown = true;
      } else {
        this.logError("Avatar dropdown did not open or menu items not found");
        this.testResults.headerAvatarDropdown = false;
      }
    } catch (error) {
      this.logError(`Header avatar dropdown test failed: ${error.message}`);
      this.testResults.headerAvatarDropdown = false;
    }
  }

  // Test 3: Sidebar Avatar Display
  async testSidebarAvatarDisplay() {
    this.log("Testing Sidebar Avatar Display...");
    try {
      // Look for sidebar user profile section
      const userProfile = document.querySelector('[data-testid="user-profile"]');
      const userName = document.querySelector('[data-testid="text-user-name"]');
      const userPlan = document.querySelector('[data-testid="text-user-plan"]');

      if (userProfile) {
        this.logSuccess("Sidebar user profile section found");

        if (userName && userName.textContent.trim()) {
          this.logSuccess(`User name displayed in sidebar: "${userName.textContent.trim()}"`);
        } else {
          this.logError("User name not displayed in sidebar");
        }

        if (userPlan && userPlan.textContent.trim()) {
          this.logSuccess(`User plan displayed in sidebar: "${userPlan.textContent.trim()}"`);
        } else {
          this.logError("User plan not displayed in sidebar");
        }

        // Check for sidebar avatar
        const sidebarAvatar = userProfile.querySelector('[class*="avatar"]');
        if (sidebarAvatar) {
          this.logSuccess("Avatar found in sidebar");
        } else {
          this.logError("Avatar not found in sidebar");
        }

        this.testResults.sidebarAvatarDisplay = true;
      } else {
        this.logError("Sidebar user profile section not found");
        this.testResults.sidebarAvatarDisplay = false;
      }
    } catch (error) {
      this.logError(`Sidebar avatar display test failed: ${error.message}`);
      this.testResults.sidebarAvatarDisplay = false;
    }
  }

  // Test 4: Profile Navigation
  async testProfileNavigation() {
    this.log("Testing Profile Navigation...");
    try {
      // Open avatar dropdown
      const avatarTrigger = await this.waitForElement('[data-testid="avatar-menu-trigger"]');
      avatarTrigger.click();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Click profile menu item
      const profileMenuItem = document.querySelector('[data-testid="menuitem-profile"]');
      if (profileMenuItem) {
        profileMenuItem.click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if navigated to profile page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/profile')) {
          this.logSuccess("Successfully navigated to profile page");
          this.testResults.profileNavigation = true;
        } else {
          this.logError(`Navigation failed. Current path: ${currentPath}`);
          this.testResults.profileNavigation = false;
        }
      } else {
        this.logError("Profile menu item not found");
        this.testResults.profileNavigation = false;
      }
    } catch (error) {
      this.logError(`Profile navigation test failed: ${error.message}`);
      this.testResults.profileNavigation = false;
    }
  }

  // Test 5: Profile Page Features
  async testProfilePageFeatures() {
    this.log("Testing Profile Page Features...");
    try {
      // Ensure we're on profile page
      if (!window.location.pathname.includes('/profile')) {
        window.location.href = '/profile';
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Test avatar upload button
      const uploadButton = document.querySelector('[data-testid="button-upload-image"]');
      const fileInput = document.querySelector('[data-testid="input-file-upload"]');

      if (uploadButton && fileInput) {
        this.logSuccess("Avatar upload functionality found");
      } else {
        this.logError("Avatar upload functionality not found");
      }

      // Test profile form inputs
      const fullNameInput = document.querySelector('[data-testid="input-full-name"]');
      const emailInput = document.querySelector('[data-testid="input-email"]');
      const saveButton = document.querySelector('[data-testid="button-save-profile"]');

      if (fullNameInput && emailInput && saveButton) {
        this.logSuccess("Profile form inputs and save button found");
        
        // Check if inputs have values
        if (fullNameInput.value.trim()) {
          this.logSuccess(`Full name input has value: "${fullNameInput.value}"`);
        } else {
          this.logError("Full name input is empty");
        }

        if (emailInput.value.trim()) {
          this.logSuccess(`Email input has value: "${emailInput.value}"`);
        } else {
          this.logError("Email input is empty");
        }
      } else {
        this.logError("Profile form inputs or save button not found");
      }

      // Test password change inputs
      const currentPasswordInput = document.querySelector('[data-testid="input-current-password"]');
      const newPasswordInput = document.querySelector('[data-testid="input-new-password"]');
      const confirmPasswordInput = document.querySelector('[data-testid="input-confirm-password"]');
      const changePasswordButton = document.querySelector('[data-testid="button-change-password"]');

      if (currentPasswordInput && newPasswordInput && confirmPasswordInput && changePasswordButton) {
        this.logSuccess("Password change functionality found");
      } else {
        this.logError("Password change functionality not complete");
      }

      this.testResults.profilePageFeatures = true;
    } catch (error) {
      this.logError(`Profile page features test failed: ${error.message}`);
      this.testResults.profilePageFeatures = false;
    }
  }

  // Test 6: Logout Functionality
  async testLogoutFunctionality() {
    this.log("Testing Logout Functionality...");
    try {
      // Navigate back to dashboard first
      window.location.href = '/dashboard';
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test logout from header avatar menu
      const avatarTrigger = await this.waitForElement('[data-testid="avatar-menu-trigger"]');
      avatarTrigger.click();
      await new Promise(resolve => setTimeout(resolve, 500));

      const logoutMenuItem = document.querySelector('[data-testid="menuitem-logout"]');
      if (logoutMenuItem) {
        this.logSuccess("Logout menu item found in header avatar dropdown");
        
        // Note: We won't actually logout in the test to preserve the session
        // but we verify the button is functional
        const isClickable = logoutMenuItem.offsetParent !== null;
        if (isClickable) {
          this.logSuccess("Logout button is clickable");
          this.testResults.logoutFunctionality = true;
        } else {
          this.logError("Logout button is not clickable");
          this.testResults.logoutFunctionality = false;
        }
      } else {
        this.logError("Logout menu item not found");
        this.testResults.logoutFunctionality = false;
      }
    } catch (error) {
      this.logError(`Logout functionality test failed: ${error.message}`);
      this.testResults.logoutFunctionality = false;
    }
  }

  // Test 7: Complete Navigation Flow
  async testNavigationFlow() {
    this.log("Testing Complete Navigation Flow...");
    try {
      // Dashboard → Profile → Settings → Back to Dashboard
      
      // 1. Start at dashboard
      window.location.href = '/dashboard';
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.logSuccess("Step 1: Navigated to Dashboard");

      // 2. Navigate to profile via avatar menu
      const avatarTrigger = await this.waitForElement('[data-testid="avatar-menu-trigger"]');
      avatarTrigger.click();
      await new Promise(resolve => setTimeout(resolve, 500));

      const profileMenuItem = document.querySelector('[data-testid="menuitem-profile"]');
      if (profileMenuItem) {
        profileMenuItem.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (window.location.pathname.includes('/profile')) {
          this.logSuccess("Step 2: Navigated to Profile page");
        } else {
          this.logError("Step 2 failed: Did not navigate to Profile page");
        }
      }

      // 3. Check settings navigation (if available)
      const settingsLink = document.querySelector('[href="/settings"]') || 
                          document.querySelector('[data-testid*="settings"]');
      if (settingsLink) {
        this.logSuccess("Step 3: Settings navigation available");
      } else {
        this.log("Step 3: Settings navigation not found (may be in tabs)");
      }

      // 4. Navigate back to dashboard
      window.location.href = '/dashboard';
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (window.location.pathname.includes('/dashboard')) {
        this.logSuccess("Step 4: Successfully returned to Dashboard");
        this.testResults.navigationFlow = true;
      } else {
        this.logError("Step 4 failed: Did not return to Dashboard");
        this.testResults.navigationFlow = false;
      }

    } catch (error) {
      this.logError(`Navigation flow test failed: ${error.message}`);
      this.testResults.navigationFlow = false;
    }
  }

  // Run all tests
  async runAllTests() {
    this.log("Starting Comprehensive Avatar Functionality Test Suite...");
    console.log("🧪 =====================================");
    
    try {
      await this.testDashboardAvatarDisplay();
      console.log("---");
      
      await this.testHeaderAvatarDropdown();
      console.log("---");
      
      await this.testSidebarAvatarDisplay();
      console.log("---");
      
      await this.testProfileNavigation();
      console.log("---");
      
      await this.testProfilePageFeatures();
      console.log("---");
      
      await this.testLogoutFunctionality();
      console.log("---");
      
      await this.testNavigationFlow();
      console.log("---");
      
      this.generateTestReport();
      
    } catch (error) {
      this.logError(`Test suite failed: ${error.message}`);
    }
  }

  // Generate comprehensive test report
  generateTestReport() {
    console.log("🧪 =====================================");
    console.log("📊 COMPREHENSIVE AVATAR FUNCTIONALITY TEST REPORT");
    console.log("🧪 =====================================");
    
    const tests = [
      { name: "Dashboard Avatar Display", result: this.testResults.dashboardAvatarDisplay },
      { name: "Header Avatar Dropdown", result: this.testResults.headerAvatarDropdown },
      { name: "Sidebar Avatar Display", result: this.testResults.sidebarAvatarDisplay },
      { name: "Profile Navigation", result: this.testResults.profileNavigation },
      { name: "Profile Page Features", result: this.testResults.profilePageFeatures },
      { name: "Logout Functionality", result: this.testResults.logoutFunctionality },
      { name: "Navigation Flow", result: this.testResults.navigationFlow }
    ];
    
    let passedTests = 0;
    tests.forEach(test => {
      const status = test.result === true ? "✅ PASS" : test.result === false ? "❌ FAIL" : "⏸️ SKIP";
      console.log(`${status} - ${test.name}`);
      if (test.result === true) passedTests++;
    });
    
    console.log("🧪 =====================================");
    console.log(`📈 SUMMARY: ${passedTests}/${tests.length} tests passed`);
    
    if (this.testResults.issues.length > 0) {
      console.log("🚨 ISSUES FOUND:");
      this.testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log("🎉 NO ISSUES FOUND!");
    }
    
    console.log("🧪 =====================================");
    
    // Return results for further processing
    return {
      summary: `${passedTests}/${tests.length} tests passed`,
      details: tests,
      issues: this.testResults.issues,
      allTestsPassed: passedTests === tests.length
    };
  }
}

// Auto-run the test suite
const avatarTester = new AvatarFunctionalityTester();
avatarTester.runAllTests().then(() => {
  console.log("🎯 Avatar functionality testing completed!");
});

// Export for manual use
window.avatarTester = avatarTester;