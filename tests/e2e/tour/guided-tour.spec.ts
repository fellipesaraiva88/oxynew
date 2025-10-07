import { test, expect } from '@playwright/test';

test.describe('Tutorial Guiado do Sistema', () => {
  test.beforeEach(async ({ page }) => {
    // Acessar a aplicação
    await page.goto('https://oxy-frontend-d84c.onrender.com');

    // Fazer login
    await page.getByRole('textbox', { name: /e-mail/i }).fill('teste@teste.com');
    await page.getByRole('textbox', { name: /senha/i }).fill('Test@123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Aguardar carregamento da página principal
    await page.waitForTimeout(2000);
  });

  test('Welcome Modal deve aparecer no primeiro acesso', async ({ page }) => {
    // Limpar localStorage para simular primeiro acesso
    await page.evaluate(() => {
      localStorage.removeItem('oxy-system-tour-progress');
      localStorage.removeItem('oxy-system-tour-completed');
      localStorage.setItem('onboarding-completed', 'true');
    });

    // Recarregar página para ativar tour
    await page.reload();
    await page.waitForTimeout(2000);

    // Verificar se Welcome Modal aparece
    const welcomeModal = page.locator('text=Bem-vindo ao Oxy!');
    await expect(welcomeModal).toBeVisible({ timeout: 3000 });

    // Verificar botões do modal
    await expect(page.getByRole('button', { name: /começar tour guiado/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pular/i })).toBeVisible();

    // Capturar screenshot
    await page.screenshot({ path: 'test-results/tour/welcome-modal.png', fullPage: true });
  });

  test('Iniciar tour deve mostrar primeiro step', async ({ page }) => {
    // Configurar primeiro acesso
    await page.evaluate(() => {
      localStorage.removeItem('oxy-system-tour-progress');
      localStorage.removeItem('oxy-system-tour-completed');
      localStorage.setItem('onboarding-completed', 'true');
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Clicar em "Começar Tour Guiado"
    await page.getByRole('button', { name: /começar tour guiado/i }).click();
    await page.waitForTimeout(1000);

    // Verificar se Joyride tooltip aparece
    const joyrideTooltip = page.locator('[data-test-id="react-joyride-step-0"], .react-joyride__tooltip');
    await expect(joyrideTooltip).toBeVisible({ timeout: 5000 });

    // Verificar botões de navegação do tour
    await expect(page.getByRole('button', { name: /próximo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pular tutorial/i })).toBeVisible();

    // Capturar screenshot
    await page.screenshot({ path: 'test-results/tour/first-step.png', fullPage: true });
  });

  test('Navegação entre steps deve funcionar', async ({ page }) => {
    // Configurar tour
    await page.evaluate(() => {
      localStorage.removeItem('oxy-system-tour-progress');
      localStorage.removeItem('oxy-system-tour-completed');
      localStorage.setItem('onboarding-completed', 'true');
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Iniciar tour
    await page.getByRole('button', { name: /começar tour guiado/i }).click();
    await page.waitForTimeout(1000);

    // Clicar em "Próximo" 3 vezes
    for (let i = 0; i < 3; i++) {
      const nextButton = page.getByRole('button', { name: /próximo/i });
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Verificar se chegou ao step 4
    const joyrideTooltip = page.locator('.react-joyride__tooltip');
    await expect(joyrideTooltip).toBeVisible();

    // Capturar screenshot
    await page.screenshot({ path: 'test-results/tour/step-4.png', fullPage: true });
  });

  test('Pular tour deve fechar e salvar no localStorage', async ({ page }) => {
    // Configurar tour
    await page.evaluate(() => {
      localStorage.removeItem('oxy-system-tour-progress');
      localStorage.removeItem('oxy-system-tour-completed');
      localStorage.setItem('onboarding-completed', 'true');
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Clicar em "Pular"
    await page.getByRole('button', { name: /pular/i }).click();
    await page.waitForTimeout(500);

    // Verificar se modal fechou
    const welcomeModal = page.locator('text=Bem-vindo ao Oxy!');
    await expect(welcomeModal).not.toBeVisible();

    // Verificar localStorage
    const tourProgress = await page.evaluate(() => {
      return localStorage.getItem('oxy-system-tour-progress');
    });

    expect(tourProgress).toBeTruthy();
    const progress = JSON.parse(tourProgress || '{}');
    expect(progress.skipped).toBe(true);

    // Capturar screenshot
    await page.screenshot({ path: 'test-results/tour/skipped.png', fullPage: true });
  });

  test('Atributos data-tour devem estar presentes', async ({ page }) => {
    // Verificar se elementos têm atributos data-tour
    const dashboard = page.locator('[data-tour="dashboard"]');
    await expect(dashboard).toBeVisible();

    // Verificar sidebar items
    const sidebarConversas = page.locator('[data-tour="sidebar-conversas"]');
    const sidebarAgenda = page.locator('[data-tour="sidebar-agenda"]');
    const sidebarClientes = page.locator('[data-tour="sidebar-clientes"]');
    const sidebarAurora = page.locator('[data-tour="sidebar-aurora"]');

    await expect(sidebarConversas).toBeVisible();
    await expect(sidebarAgenda).toBeVisible();
    await expect(sidebarClientes).toBeVisible();
    await expect(sidebarAurora).toBeVisible();

    // Capturar screenshot
    await page.screenshot({ path: 'test-results/tour/data-tour-attributes.png', fullPage: true });
  });

  test('Completion Modal deve aparecer ao finalizar tour', async ({ page }) => {
    // Configurar tour
    await page.evaluate(() => {
      localStorage.removeItem('oxy-system-tour-progress');
      localStorage.removeItem('oxy-system-tour-completed');
      localStorage.setItem('onboarding-completed', 'true');
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Iniciar tour
    await page.getByRole('button', { name: /começar tour guiado/i }).click();
    await page.waitForTimeout(1000);

    // Simular completar tour navegando até o final
    // (Como são 18 steps, vamos clicar "Próximo" 17 vezes)
    for (let i = 0; i < 17; i++) {
      const nextButton = page.getByRole('button', { name: /próximo|finalizar/i });
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      await nextButton.click();
      await page.waitForTimeout(300);
    }

    // Clicar no botão final
    const finalButton = page.getByRole('button', { name: /finalizar/i });
    if (await finalButton.isVisible()) {
      await finalButton.click();
      await page.waitForTimeout(1000);
    }

    // Verificar se Completion Modal aparece
    const completionModal = page.locator('text=Parabéns! Tour Completo!');
    await expect(completionModal).toBeVisible({ timeout: 5000 });

    // Verificar botões
    await expect(page.getByRole('button', { name: /rever tutorial/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /começar a usar/i })).toBeVisible();

    // Capturar screenshot
    await page.screenshot({ path: 'test-results/tour/completion-modal.png', fullPage: true });
  });
});
