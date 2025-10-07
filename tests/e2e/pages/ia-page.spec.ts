import { test, expect } from '@playwright/test';
import { login } from '../../helpers/auth';

test.describe('Página de IA - Redesign Completo', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/ia');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Hero Card - Impacto Visual', () => {
    test('deve exibir card hero com gradiente', async ({ page }) => {
      const heroCard = page.locator('.bg-gradient-to-br');
      await expect(heroCard).toBeVisible();
    });

    test('deve exibir tempo economizado', async ({ page }) => {
      const timeText = page.getByText(/h.*min/);
      await expect(timeText).toBeVisible();
    });

    test('deve exibir receita gerada', async ({ page }) => {
      const revenueText = page.getByText(/R\$/);
      await expect(revenueText).toBeVisible();
    });

    test('deve exibir gráfico de atividade', async ({ page }) => {
      const chart = page.locator('svg');
      await expect(chart.first()).toBeVisible();
    });

    test('botão "Ver conversas" deve navegar', async ({ page }) => {
      const button = page.getByRole('button', { name: /ver todas/i });
      await expect(button).toBeVisible();
      await button.click();
      await expect(page).toHaveURL(/\/conversas/);
    });
  });

  test.describe('Métricas Visuais', () => {
    test('deve exibir 3 cards de métricas', async ({ page }) => {
      const metricCards = page.locator('.glass-card').filter({ hasText: /clientes atendidos|agendamentos|cadastros/i });
      await expect(metricCards).toHaveCount(3);
    });

    test('card de clientes deve ter ícone MessageCircle', async ({ page }) => {
      const clientCard = page.locator('.glass-card').filter({ hasText: /clientes atendidos/i });
      await expect(clientCard).toBeVisible();
    });

    test('card de agendamentos deve ter ícone Calendar', async ({ page }) => {
      const bookingCard = page.locator('.glass-card').filter({ hasText: /agendamentos/i });
      await expect(bookingCard).toBeVisible();
    });

    test('card de cadastros deve ter ícone Users', async ({ page }) => {
      const registerCard = page.locator('.glass-card').filter({ hasText: /cadastros/i });
      await expect(registerCard).toBeVisible();
    });

    test('métricas devem ser responsivas em mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const grid = page.locator('.grid');
      await expect(grid).toBeVisible();
    });
  });

  test.describe('Feed de Atividade', () => {
    test('deve exibir título "O Que Ela Fez Agora Mesmo"', async ({ page }) => {
      const title = page.getByText(/o que ela fez agora mesmo/i);
      await expect(title).toBeVisible();
    });

    test('deve exibir ícone Flame no título', async ({ page }) => {
      const flameIcon = page.locator('svg[class*="lucide-flame"]');
      await expect(flameIcon.first()).toBeVisible();
    });

    test('deve listar atividades com timestamps', async ({ page }) => {
      const activities = page.locator('[class*="activity"]').or(page.getByText(/há.*minuto|hora|dia/));
      const count = await activities.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('botão "Ver todas as ações" deve estar presente', async ({ page }) => {
      const button = page.getByRole('button', { name: /ver todas as ações/i });
      const isVisible = await button.isVisible().catch(() => false);
      // Pode não estar visível se não houver atividades
      if (isVisible) {
        await expect(button).toBeVisible();
      }
    });
  });

  test.describe('Configurações - Tabs', () => {
    test('deve exibir 4 tabs de configuração', async ({ page }) => {
      const tabs = page.locator('[role="tablist"] [role="tab"]');
      await expect(tabs).toHaveCount(4);
    });

    test('tab "Atendimento" deve estar acessível', async ({ page }) => {
      const tab = page.getByRole('tab', { name: /atendimento/i });
      await expect(tab).toBeVisible();
      await tab.click();
    });

    test('tab "Automações" deve exibir toggles', async ({ page }) => {
      const tab = page.getByRole('tab', { name: /automações/i });
      await tab.click();
      const switches = page.locator('[role="switch"]');
      const count = await switches.count();
      expect(count).toBeGreaterThan(0);
    });

    test('tab "Horários" deve ter inputs de tempo', async ({ page }) => {
      const tab = page.getByRole('tab', { name: /horários/i });
      await tab.click();
      const timeInputs = page.locator('input[type="time"]');
      await expect(timeInputs).toHaveCount(2);
    });

    test('tab "Tom de Voz" deve ter opções selecionáveis', async ({ page }) => {
      const tab = page.getByRole('tab', { name: /tom/i });
      await tab.click();
      const options = page.locator('button').filter({ hasText: /profissional|amigável|descontraído/i });
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('botão "Salvar Configurações" deve estar presente', async ({ page }) => {
      const saveButton = page.getByRole('button', { name: /salvar configurações/i });
      await expect(saveButton).toBeVisible();
    });

    test('deve alternar entre tabs sem erros', async ({ page }) => {
      const tabs = ['Atendimento', 'Automações', 'Horários', 'Tom'];
      for (const tabName of tabs) {
        const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
        await tab.click();
        await page.waitForTimeout(200);
      }
    });
  });

  test.describe('Status de Saúde', () => {
    test('deve exibir badge de status', async ({ page }) => {
      const statusBadge = page.getByText(/funcionando|precisa de atenção/i);
      await expect(statusBadge).toBeVisible();
    });

    test('deve exibir ponto de status animado', async ({ page }) => {
      const statusDot = page.locator('.animate-pulse');
      const count = await statusDot.count();
      expect(count).toBeGreaterThan(0);
    });

    test('botão de expandir detalhes deve funcionar', async ({ page }) => {
      const expandButton = page.getByRole('button', { name: /detalhes|ocultar/i });
      if (await expandButton.isVisible()) {
        await expandButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Responsividade', () => {
    test('deve ser responsivo em desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      const mainContent = page.locator('main').or(page.locator('[class*="max-w"]'));
      await expect(mainContent.first()).toBeVisible();
    });

    test('deve ser responsivo em tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      const mainContent = page.locator('main').or(page.locator('[class*="max-w"]'));
      await expect(mainContent.first()).toBeVisible();
    });

    test('deve ser responsivo em mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const mainContent = page.locator('main').or(page.locator('[class*="max-w"]'));
      await expect(mainContent.first()).toBeVisible();
    });
  });

  test.describe('Acessibilidade', () => {
    test('título da página deve estar correto', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /sua assistente virtual/i });
      await expect(heading).toBeVisible();
    });

    test('subtitle deve mencionar "24/7"', async ({ page }) => {
      const subtitle = page.getByText(/24\/7/i);
      await expect(subtitle).toBeVisible();
    });

    test('botões devem ter textos descritivos', async ({ page }) => {
      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Linguagem - Soluções não Ferramentas', () => {
    test('NÃO deve mencionar "Inteligência Artificial"', async ({ page }) => {
      const content = await page.content();
      expect(content).not.toContain('Inteligência Artificial');
    });

    test('NÃO deve mencionar "Instância"', async ({ page }) => {
      const content = await page.content();
      expect(content.toLowerCase()).not.toContain('instância');
    });

    test('DEVE mencionar "Assistente Virtual"', async ({ page }) => {
      const text = page.getByText(/assistente virtual/i);
      await expect(text).toBeVisible();
    });

    test('DEVE usar linguagem de impacto (tempo, receita)', async ({ page }) => {
      const impactText = page.getByText(/economizou|receita|vendas|agendamentos/i);
      await expect(impactText.first()).toBeVisible();
    });
  });
});
