import 'dotenv/config';
import { adminAuthService } from '../src/services/admin-auth.service.js';
import { logger } from '../src/config/logger.js';

async function testAdminLogin() {
  try {
    const email = 'test@oxy.com';
    const password = 'Oxy2025!';

    logger.info({ email }, 'Testing admin login...');

    const result = await adminAuthService.login(email, password, '127.0.0.1');

    if (result.success) {
      logger.info({ user: result.user }, '✅ Login successful!');
      logger.info({ token: result.token?.substring(0, 20) + '...' }, 'Token generated');
    } else {
      logger.error({ error: result.error }, '❌ Login failed');
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    logger.error({ error }, 'Fatal error during test');
    process.exit(1);
  }
}

testAdminLogin();
