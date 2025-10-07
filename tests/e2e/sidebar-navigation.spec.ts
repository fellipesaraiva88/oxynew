import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation - Menu Atualizado com Linguagem de Valor', () => {
  test.beforeEach(async ({ page }) => {
    // Mock localStorage para simular autenticação
    await page.addInitScript(() => {
      localStorage.setItem('sb-kvwhqzxgxuodjhslvmoo-auth-token', JSON.stringify({
        access_token: 'fake-token-for-testing',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'authenticated'
        }
      }));
    });

    await page.goto('http://localhost:8083/');
    await page.waitForTimeout(1000); // Aguardar carregamento
  });

  test('Todos os grupos do menu estão visíveis', async ({ page }) => {
    // Verificar títulos de grupos
    await expect(page.getByText('OPERAÇÃO')).toBeVisible();
    await expect(page.getByText('CRESCIMENTO')).toBeVisible();
    await expect(page.getByText('INTELIGÊNCIA')).toBeVisible();
  });

  test('Grupo OPERAÇÃO contém itens corretos', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Painel de Controle/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Atendimento/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Agenda/i })).toBeVisible();
  });

  test('Grupo CRESCIMENTO contém novos serviços com badges', async ({ page }) => {
    // Itens existentes
    await expect(page.getByRole('link', { name: /Família Pet/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Faturamento/i })).toBeVisible();

    // Novos serviços com badges "Novo"
    await expect(page.getByRole('link', { name: /Educar Pets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Cuidado Estendido/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bem-Estar 360/i })).toBeVisible();

    // Verificar badges "Novo"
    const novoBadges = page.getByText('NOVO');
    await expect(novoBadges).toHaveCount(3);
  });

  test('Grupo INTELIGÊNCIA contém Aurora e WhatsApp', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Piloto Automático/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sua Parceira Aurora/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Conectar WhatsApp/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Configurações/i })).toBeVisible();

    // Verificar badge "Beta" na Aurora
    await expect(page.getByText('BETA')).toBeVisible();
  });

  test('Navegação para Educar Pets funciona', async ({ page }) => {
    await page.getByRole('link', { name: /Educar Pets/i }).click();
    await expect(page).toHaveURL(/.*\/training/);
  });

  test('Navegação para Cuidado Estendido funciona', async ({ page }) => {
    await page.getByRole('link', { name: /Cuidado Estendido/i }).click();
    await expect(page).toHaveURL(/.*\/daycare/);
  });

  test('Navegação para Bem-Estar 360° funciona', async ({ page }) => {
    await page.getByRole('link', { name: /Bem-Estar 360/i }).click();
    await expect(page).toHaveURL(/.*\/bipe/);
  });

  test('Navegação para Sua Parceira Aurora funciona', async ({ page }) => {
    await page.getByRole('link', { name: /Sua Parceira Aurora/i }).click();
    await expect(page).toHaveURL(/.*\/aurora\/meet/);
  });

  test('Navegação para Conectar WhatsApp funciona', async ({ page }) => {
    await page.getByRole('link', { name: /Conectar WhatsApp/i }).click();
    await expect(page).toHaveURL(/.*\/whatsapp/);
  });

  test('Dividers entre grupos estão presentes', async ({ page }) => {
    // Verificar que há separadores visuais entre os grupos
    const dividers = page.locator('.border-t.border-sidebar-border\\/30');
    await expect(dividers).toHaveCount(2); // 2 dividers para 3 grupos
  });

  test('Menu responsivo em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Abrir sidebar mobile
    const sidebarTrigger = page.locator('button[aria-label*="sidebar"], button[aria-label*="menu"]').first();
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click();
    }

    // Verificar itens visíveis no mobile
    await expect(page.getByText('OPERAÇÃO')).toBeVisible();
    await expect(page.getByRole('link', { name: /Educar Pets/i })).toBeVisible();
  });

  test('Total de 12 itens de menu', async ({ page }) => {
    // Contar todos os links de navegação
    const menuLinks = page.locator('nav a[href]');
    const count = await menuLinks.count();

    expect(count).toBe(12); // 3 + 5 + 4 = 12 itens
  });

  test('Ícones estão presentes em todos os itens', async ({ page }) => {
    // Verificar que cada link tem um ícone (svg com classe lucide)
    const icons = page.locator('nav a svg.lucide');
    const count = await icons.count();

    expect(count).toBeGreaterThanOrEqual(12); // Pelo menos 1 ícone por item
  });
});
