import { Page } from '@playwright/test';

export async function login(page: Page, email: string = 'teste@oxy.com', password: string = 'teste123') {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function logout(page: Page) {
  // Implementar logout se necessário
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('supabase.auth.token'));
  return !!token;
}
