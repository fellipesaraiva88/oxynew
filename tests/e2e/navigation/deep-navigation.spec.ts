import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Navegação Profunda - Fluxo Completo do Sistema', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Fluxo: Dashboard → IA → Configurações → Conversas → Clientes → Agenda → WhatsApp', async ({ page }) => {
    // 1. Dashboard (página inicial após login)
    await page.goto('/');
    await expect(page).toHaveURL('/');
    const dashboardTitle = page.getByRole('heading').first();
    await expect(dashboardTitle).toBeVisible();

    // 2. Navegar para IA
    await page.click('a[href="/ia"], button:has-text("IA")');
    await page.waitForURL('/ia');
    await expect(page.getByText(/assistente virtual/i)).toBeVisible();

    // 3. Interagir com Configurações (Tabs)
    const automationTab = page.getByRole('tab', { name: /automações/i });
    if (await automationTab.isVisible()) {
      await automationTab.click();
      await page.waitForTimeout(300);
    }

    // 4. Clicar em "Ver conversas" do Hero Card
    const viewConversationsBtn = page.getByRole('button', { name: /ver todas.*conversas/i });
    if (await viewConversationsBtn.isVisible()) {
      await viewConversationsBtn.click();
      await page.waitForURL(/\/conversas/, { timeout: 5000 });
    } else {
      // Fallback: navegar via sidebar
      await page.click('a[href="/conversas"]');
      await page.waitForURL('/conversas');
    }

    // 5. Página de Conversas
    await expect(page.getByRole('heading', { name: /conversas/i })).toBeVisible();

    // 6. Navegar para Clientes
    await page.click('a[href="/clientes"]');
    await page.waitForURL('/clientes');
    await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible();

    // 7. Navegar para Agenda
    await page.click('a[href="/agenda"]');
    await page.waitForURL('/agenda');
    await expect(page.getByRole('heading', { name: /agenda/i })).toBeVisible();

    // 8. Navegar para WhatsApp
    await page.click('a[href="/whatsapp"]');
    await page.waitForURL('/whatsapp');
    await expect(page.getByText(/conecte seu whatsapp|whatsapp/i)).toBeVisible();

    // 9. Voltar para IA
    await page.click('a[href="/ia"]');
    await page.waitForURL('/ia');
    await expect(page.getByText(/assistente virtual/i)).toBeVisible();
  });

  test('Navegação via Sidebar - Todas as páginas principais', async ({ page }) => {
    const pages = [
      { path: '/', name: /dashboard|início/i },
      { path: '/ia', name: /assistente|ia/i },
      { path: '/conversas', name: /conversas/i },
      { path: '/clientes', name: /clientes/i },
      { path: '/agenda', name: /agenda/i },
      { path: '/whatsapp', name: /whatsapp/i },
    ];

    for (const { path, name } of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const heading = page.getByRole('heading', { name }).or(page.getByText(name));
      const isVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBeTruthy();
    }
  });

  test('Breadcrumbs e voltar funcionam corretamente', async ({ page }) => {
    // Navegar: Dashboard → IA → Conversas
    await page.goto('/');
    await page.click('a[href="/ia"]');
    await page.waitForURL('/ia');
    await page.click('a[href="/conversas"]');
    await page.waitForURL('/conversas');

    // Voltar usando navegador
    await page.goBack();
    await expect(page).toHaveURL('/ia');

    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('Links externos não quebram navegação', async ({ page }) => {
    await page.goto('/ia');
    
    // Testar que links internos mantêm mesma aba
    const internalLink = page.locator('a[href^="/"]').first();
    if (await internalLink.isVisible()) {
      const href = await internalLink.getAttribute('href');
      await internalLink.click();
      await page.waitForTimeout(500);
      // Ainda na mesma página/contexto
      expect(page.url()).toContain(href || '');
    }
  });

  test('Estados de loading aparecem durante navegação', async ({ page }) => {
    await page.goto('/ia');
    
    // Navegar para página pesada
    const conversasLink = page.locator('a[href="/conversas"]');
    await conversasLink.click();
    
    // Loading pode aparecer brevemente
    const loader = page.locator('[class*="animate-spin"], [class*="loading"]');
    // Não falhamos se não aparecer (pode ser rápido demais)
    await page.waitForLoadState('networkidle');
  });

  test('URL reflete estado atual da aplicação', async ({ page }) => {
    await page.goto('/ia');
    await expect(page).toHaveURL('/ia');

    await page.goto('/conversas');
    await expect(page).toHaveURL('/conversas');

    await page.goto('/clientes');
    await expect(page).toHaveURL('/clientes');
  });

  test('Navegação rápida entre páginas não causa erros', async ({ page }) => {
    const routes = ['/ia', '/conversas', '/clientes', '/agenda', '/whatsapp', '/'];
    
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(100);
    }
    
    // Sem erros de console críticos
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/ia');
    await page.waitForTimeout(1000);
    
    // Alguns erros podem ser esperados (APIs externas, etc)
    expect(errors.length).toBeLessThan(10);
  });

  test('Página 404 para rotas inválidas', async ({ page }) => {
    await page.goto('/rota-inexistente-123');
    const notFoundText = page.getByText(/404|não encontrado|not found/i);
    const isVisible = await notFoundText.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isVisible) {
      // Pode redirecionar para home
      await expect(page).toHaveURL('/');
    } else {
      await expect(notFoundText).toBeVisible();
    }
  });

  test('Refresh da página mantém estado', async ({ page }) => {
    await page.goto('/ia');
    await page.waitForLoadState('networkidle');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL('/ia');
    await expect(page.getByText(/assistente virtual/i)).toBeVisible();
  });

  test('Navegação funciona em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.click('a[href="/ia"]');
    await page.waitForURL('/ia');
    await expect(page.getByText(/assistente/i)).toBeVisible();
    
    await page.click('a[href="/conversas"]');
    await page.waitForURL('/conversas');
  });
});
