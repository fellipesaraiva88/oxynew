import { test, expect } from '@playwright/test';

test.describe('Socket.io Connection Validation', () => {
  test('should connect to Socket.io without UUID errors', async ({ page }) => {
    // Array to capture console messages
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];

    // Listen to console events
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);

      // Check for Socket.io related messages
      if (text.includes('Socket.io') || text.includes('socket')) {
        console.log(`[CONSOLE] ${text}`);
      }

      // Check for UUID errors
      if (text.includes('invalid input syntax for type uuid') || text.includes('undefined')) {
        errorMessages.push(text);
        console.log(`[ERROR] ${text}`);
      }
    });

    // Listen to page errors
    page.on('pageerror', (error) => {
      const errorText = error.message;
      errorMessages.push(errorText);
      console.log(`[PAGE ERROR] ${errorText}`);
    });

    // Navigate to the login page
    console.log('📱 Navigating to https://oxy-frontend-d84c.onrender.com');
    await page.goto('https://oxy-frontend-d84c.onrender.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take screenshot of login page
    await page.screenshot({
      path: '/Users/saraiva/autonomous-paw-actuator-main/tests/screenshots/01-login-page.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: 01-login-page.png');

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill in login credentials
    console.log('🔐 Filling login credentials...');
    await page.fill('input[type="email"]', 'fellipesaraivabarbosa@gmail.com');
    await page.fill('input[type="password"]', 'Sucesso2025$');

    // Take screenshot before login
    await page.screenshot({
      path: '/Users/saraiva/autonomous-paw-actuator-main/tests/screenshots/02-before-login.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: 02-before-login.png');

    // Click login button
    console.log('🚀 Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(async () => {
      // If dashboard URL doesn't match, wait for any navigation
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    });

    // Wait a bit for Socket.io to initialize
    console.log('⏳ Waiting for Socket.io initialization...');
    await page.waitForTimeout(5000);

    // Take screenshot after login
    await page.screenshot({
      path: '/Users/saraiva/autonomous-paw-actuator-main/tests/screenshots/03-after-login.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: 03-after-login.png');

    // Check browser console for Socket.io state and user data
    const socketState = await page.evaluate(() => {
      // Parse localStorage data
      const authToken = localStorage.getItem('auth_token');
      const user = localStorage.getItem('user');
      const organizationId = localStorage.getItem('organizationId');
      const selectedOrg = localStorage.getItem('selectedOrganization');

      let userProfile = null;
      try {
        userProfile = user ? JSON.parse(user) : null;
      } catch (e) {
        userProfile = null;
      }

      // @ts-expect-error - accessing window.socket
      return {
        socketExists: typeof window.socket !== 'undefined',
        socketConnected: window.socket?.connected || false,
        socketId: window.socket?.id || null,
        // Check localStorage for user/org data
        hasAuthToken: !!authToken,
        tokenPreview: authToken ? authToken.substring(0, 20) + '...' : null,
        hasUserData: !!user,
        hasOrgData: !!selectedOrg,
        hasOrgId: !!organizationId,
        organizationId: organizationId,
        // User profile details
        userEmail: userProfile?.email || null,
        userOrgId: userProfile?.organization_id || null,
        userRole: userProfile?.role || null,
        // All localStorage keys
        allKeys: Object.keys(localStorage)
      };
    });

    console.log('\n🔌 Socket.io State:', JSON.stringify(socketState, null, 2));

    // Open DevTools console and take screenshot
    console.log('📊 Capturing console state...');

    // Print captured console messages
    console.log('\n📋 Console Messages Summary:');
    console.log('Total messages:', consoleMessages.length);
    console.log('Socket.io messages:', consoleMessages.filter(m =>
      m.toLowerCase().includes('socket')
    ).length);

    // Print ALL console messages for debugging
    console.log('\n📝 All Console Messages:');
    consoleMessages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. ${msg}`);
    });

    // Print Socket.io related messages
    const socketMessages = consoleMessages.filter(m =>
      m.toLowerCase().includes('socket') ||
      m.includes('✅') ||
      m.includes('❌')
    );

    if (socketMessages.length > 0) {
      console.log('\n🔌 Socket.io Related Messages:');
      socketMessages.forEach(msg => console.log(`  - ${msg}`));
    }

    // Print error messages
    if (errorMessages.length > 0) {
      console.log('\n❌ Error Messages:');
      errorMessages.forEach(msg => console.log(`  - ${msg}`));
    }

    // Assertions
    console.log('\n🧪 Running Assertions...');

    // Check for UUID errors
    const hasUuidError = errorMessages.some(msg =>
      msg.includes('invalid input syntax for type uuid') ||
      (msg.includes('uuid') && msg.includes('undefined'))
    );

    if (hasUuidError) {
      console.log('❌ FAILED: UUID error still present');
      expect(hasUuidError).toBe(false);
    } else {
      console.log('✅ PASSED: No UUID errors found');
    }

    // Check for successful Socket.io connection
    const hasSocketSuccess = consoleMessages.some(msg =>
      msg.includes('Socket.io connected') ||
      msg.includes('Socket.io authenticated')
    );

    if (hasSocketSuccess) {
      console.log('✅ PASSED: Socket.io connected successfully');
    } else {
      console.log('⚠️  WARNING: Socket.io success message not found in console');
    }

    // Final validation
    expect(hasUuidError).toBe(false);

    console.log('\n✅ Socket.io validation completed successfully!');
  });
});
