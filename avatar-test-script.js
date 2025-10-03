// Avatar and Profile Testing Script
// This script tests all avatar functionality systematically

const testResults = {
  authenticationTest: false,
  avatarDisplayHeader: false,
  avatarDropdownToggle: false,
  sidebarAvatar: false,
  profileAccess: false,
  userDataDisplay: false,
  avatarUpload: false
};

let testLog = [];

function log(message, status = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${status.toUpperCase()}: ${message}`;
  testLog.push(logEntry);
  console.log(logEntry);
}

function assertElement(selector, description) {
  const element = document.querySelector(selector);
  if (element) {
    log(`✅ ${description} - Element found: ${selector}`, 'success');
    return element;
  } else {
    log(`❌ ${description} - Element not found: ${selector}`, 'error');
    return null;
  }
}

function assertElementText(selector, expectedText, description) {
  const element = document.querySelector(selector);
  if (element && element.textContent.includes(expectedText)) {
    log(`✅ ${description} - Text matches: "${expectedText}"`, 'success');
    return true;
  } else {
    log(`❌ ${description} - Text mismatch or element not found: ${selector}`, 'error');
    return false;
  }
}

function assertElementVisible(selector, description) {
  const element = document.querySelector(selector);
  if (element && element.offsetParent !== null) {
    log(`✅ ${description} - Element is visible`, 'success');
    return true;
  } else {
    log(`❌ ${description} - Element not visible or not found`, 'error');
    return false;
  }
}

async function testAuthenticationState() {
  log('Testing Authentication State...', 'info');
  
  // Check if user is authenticated by looking for dashboard elements
  const dashboard = assertElement('[data-testid="dashboard-container"], .dashboard, #dashboard', 'Dashboard container');
  const userElements = assertElement('[data-testid="text-user-name"], [data-testid="user-profile"]', 'User profile elements');
  
  if (dashboard || userElements) {
    log('✅ User appears to be authenticated - dashboard/user elements found', 'success');
    testResults.authenticationTest = true;
    return true;
  } else {
    log('❌ User not authenticated or dashboard not accessible', 'error');
    return false;
  }
}

async function testAvatarDisplayHeader() {
  log('Testing Avatar Display in Header...', 'info');
  
  // Check for avatar menu trigger
  const avatarTrigger = assertElement('[data-testid="avatar-menu-trigger"]', 'Avatar menu trigger button');
  
  // Check for avatar component within trigger
  const avatarImage = assertElement('[data-testid="avatar-menu-trigger"] [class*="avatar"]', 'Avatar component');
  
  // Check for avatar fallback (initials)
  const avatarFallback = assertElement('[data-testid="avatar-menu-trigger"] [class*="avatar-fallback"]', 'Avatar fallback with initials');
  
  if (avatarTrigger && (avatarImage || avatarFallback)) {
    log('✅ Avatar display in header is working correctly', 'success');
    testResults.avatarDisplayHeader = true;
    return true;
  } else {
    log('❌ Avatar display in header is not working properly', 'error');
    return false;
  }
}

async function testAvatarDropdownToggle() {
  log('Testing Avatar Dropdown Toggle...', 'info');
  
  const avatarTrigger = document.querySelector('[data-testid="avatar-menu-trigger"]');
  if (!avatarTrigger) {
    log('❌ Avatar trigger not found for dropdown test', 'error');
    return false;
  }
  
  // Check if dropdown is initially closed
  let dropdown = document.querySelector('[role="menu"], .dropdown-menu-content');
  const initiallyHidden = !dropdown || dropdown.offsetParent === null;
  
  if (initiallyHidden) {
    log('✅ Dropdown is initially hidden', 'success');
  }
  
  // Simulate click to open dropdown
  avatarTrigger.click();
  
  // Wait a bit for animation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if dropdown is now visible
  dropdown = document.querySelector('[role="menu"], .dropdown-menu-content');
  const nowVisible = dropdown && dropdown.offsetParent !== null;
  
  if (nowVisible) {
    log('✅ Dropdown opens when avatar is clicked', 'success');
    
    // Check for dropdown menu items
    const profileItem = assertElement('[data-testid="menuitem-profile"]', 'Profile menu item');
    const settingsItem = assertElement('[data-testid="menuitem-settings"]', 'Settings menu item');
    const logoutItem = assertElement('[data-testid="menuitem-logout"]', 'Logout menu item');
    
    if (profileItem && settingsItem && logoutItem) {
      log('✅ All expected dropdown menu items are present', 'success');
      testResults.avatarDropdownToggle = true;
      
      // Close dropdown by clicking outside
      document.body.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } else {
      log('❌ Some dropdown menu items are missing', 'error');
      return false;
    }
  } else {
    log('❌ Dropdown does not open when avatar is clicked', 'error');
    return false;
  }
}

async function testSidebarAvatar() {
  log('Testing Sidebar Avatar Display...', 'info');
  
  // Check for sidebar user profile section
  const sidebarProfile = assertElement('[data-testid="user-profile"]', 'Sidebar user profile section');
  
  // Check for sidebar avatar
  const sidebarAvatar = assertElement('[data-testid="user-profile"] [class*="avatar"]', 'Sidebar avatar component');
  
  // Check for user name display
  const userName = assertElement('[data-testid="text-user-name"]', 'User name in sidebar');
  
  // Check for user plan display
  const userPlan = assertElement('[data-testid="text-user-plan"]', 'User plan in sidebar');
  
  if (sidebarProfile && sidebarAvatar && userName && userPlan) {
    log('✅ Sidebar avatar and user info display correctly', 'success');
    testResults.sidebarAvatar = true;
    return true;
  } else {
    log('❌ Sidebar avatar or user info display has issues', 'error');
    return false;
  }
}

async function testProfileAccess() {
  log('Testing Profile Page Access...', 'info');
  
  // Try to access profile through avatar dropdown
  const avatarTrigger = document.querySelector('[data-testid="avatar-menu-trigger"]');
  if (avatarTrigger) {
    avatarTrigger.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const profileItem = document.querySelector('[data-testid="menuitem-profile"]');
    if (profileItem) {
      profileItem.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we're on profile page
      const profileElements = document.querySelector('[data-testid="profile-page"], .profile-container, h1, h2');
      if (profileElements) {
        log('✅ Profile page is accessible via avatar dropdown', 'success');
        testResults.profileAccess = true;
        return true;
      }
    }
  }
  
  log('❌ Profile page access through avatar dropdown failed', 'error');
  return false;
}

async function testUserDataDisplay() {
  log('Testing User Data Display...', 'info');
  
  let validDisplays = 0;
  
  // Check avatar dropdown user info
  const avatarTrigger = document.querySelector('[data-testid="avatar-menu-trigger"]');
  if (avatarTrigger) {
    avatarTrigger.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dropdownUserName = document.querySelector('.dropdown-menu-content p:first-child');
    const dropdownUserPlan = document.querySelector('.dropdown-menu-content p:last-child');
    
    if (dropdownUserName && dropdownUserName.textContent.trim()) {
      log('✅ User name displays in avatar dropdown', 'success');
      validDisplays++;
    }
    
    if (dropdownUserPlan && dropdownUserPlan.textContent.includes('Plan')) {
      log('✅ User plan displays in avatar dropdown', 'success');
      validDisplays++;
    }
    
    // Close dropdown
    document.body.click();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Check sidebar user info
  const sidebarUserName = document.querySelector('[data-testid="text-user-name"]');
  const sidebarUserPlan = document.querySelector('[data-testid="text-user-plan"]');
  
  if (sidebarUserName && sidebarUserName.textContent.trim()) {
    log('✅ User name displays in sidebar', 'success');
    validDisplays++;
  }
  
  if (sidebarUserPlan && sidebarUserPlan.textContent.includes('Plan')) {
    log('✅ User plan displays in sidebar', 'success');
    validDisplays++;
  }
  
  if (validDisplays >= 3) {
    log('✅ User data displays correctly across components', 'success');
    testResults.userDataDisplay = true;
    return true;
  } else {
    log(`❌ User data display issues - only ${validDisplays} valid displays found`, 'error');
    return false;
  }
}

async function testAvatarUpload() {
  log('Testing Avatar Upload Functionality...', 'info');
  
  // This would require checking if there's an upload interface on the profile page
  // For now, we'll check if the upload elements exist
  const fileInput = document.querySelector('input[type="file"]');
  const uploadButton = document.querySelector('[data-testid*="upload"], [data-testid*="avatar"] button');
  
  if (fileInput || uploadButton) {
    log('✅ Avatar upload interface elements found', 'success');
    testResults.avatarUpload = true;
    return true;
  } else {
    log('ℹ️ Avatar upload interface not found (may not be implemented)', 'info');
    return false;
  }
}

async function runFullTest() {
  log('Starting Avatar and Profile Comprehensive Test Suite', 'info');
  log('=' .repeat(60), 'info');
  
  const tests = [
    { name: 'Authentication Test', func: testAuthenticationState },
    { name: 'Avatar Display Header', func: testAvatarDisplayHeader },
    { name: 'Avatar Dropdown Toggle', func: testAvatarDropdownToggle },
    { name: 'Sidebar Avatar', func: testSidebarAvatar },
    { name: 'Profile Access', func: testProfileAccess },
    { name: 'User Data Display', func: testUserDataDisplay },
    { name: 'Avatar Upload', func: testAvatarUpload }
  ];
  
  for (const test of tests) {
    log(`\n--- Running ${test.name} ---`, 'info');
    try {
      await test.func();
    } catch (error) {
      log(`❌ ${test.name} failed with error: ${error.message}`, 'error');
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  }
  
  // Generate summary
  log('\n' + '=' .repeat(60), 'info');
  log('TEST SUMMARY:', 'info');
  log('=' .repeat(60), 'info');
  
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const totalTests = Object.keys(testResults).length;
  
  for (const [testName, result] of Object.entries(testResults)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    log(`${status} - ${testName}`, result ? 'success' : 'error');
  }
  
  log(`\nOVERALL RESULT: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'success' : 'error');
  
  if (passedTests === totalTests) {
    log('🎉 All avatar and profile functionality tests PASSED!', 'success');
  } else {
    log('⚠️ Some tests failed. Please review the issues above.', 'error');
  }
  
  return { testResults, testLog, passed: passedTests, total: totalTests };
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  // Wait for page to load completely
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runFullTest, 2000); // Wait 2 seconds after DOM load
    });
  } else {
    setTimeout(runFullTest, 1000); // Wait 1 second if already loaded
  }
} else {
  // Export for Node.js environment
  module.exports = { runFullTest, testResults };
}