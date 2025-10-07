import { test, expect } from '@playwright/test';

test.describe('Authentication - Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar localStorage antes de cada teste
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('Página de login deve estar acessível', async ({ page }) => {
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');

    // Verificar elementos da página de login
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /senha/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('Login com credenciais válidas deve redirecionar para dashboard', async ({ page }) => {
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');

    // Preencher formulário de login
    await page.getByRole('textbox', { name: /email/i }).fill('test@petshop.com');
    await page.getByRole('textbox', { name: /senha/i }).fill('Test@123');

    // Clicar no botão de login
    await page.getByRole('button', { name: /entrar/i }).click();

    // Aguardar redirecionamento (timeout de 10s para requisições de API)
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Verificar que está no dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verificar que sidebar está visível (indicando autenticação bem-sucedida)
    await expect(page.getByText('OPERAÇÃO')).toBeVisible({ timeout: 5000 });
  });

  test('Login com credenciais inválidas deve mostrar erro', async ({ page }) => {
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');

    // Preencher com credenciais inválidas
    await page.getByRole('textbox', { name: /email/i }).fill('invalid@example.com');
    await page.getByRole('textbox', { name: /senha/i }).fill('WrongPassword123');

    // Clicar no botão de login
    await page.getByRole('button', { name: /entrar/i }).click();

    // Aguardar mensagem de erro (toast ou texto)
    await expect(page.getByText(/credenciais inválidas|erro|falha/i)).toBeVisible({ timeout: 5000 });
  });

  test('Campo de email deve validar formato de email', async ({ page }) => {
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');

    // Tentar submeter com email inválido
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await emailInput.fill('not-an-email');
    await page.getByRole('textbox', { name: /senha/i }).fill('SomePassword123');

    // Clicar no botão
    await page.getByRole('button', { name: /entrar/i }).click();

    // Verificar validação (pode ser mensagem de erro ou validação HTML5)
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);

    expect(validationMessage).toBeTruthy();
  });

  test('Campos vazios devem impedir login', async ({ page }) => {
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');

    // Tentar clicar sem preencher
    await page.getByRole('button', { name: /entrar/i }).click();

    // Verificar que não houve redirecionamento
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Link "Esqueci minha senha" deve estar presente', async ({ page }) => {
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');

    // Verificar presença do link
    await expect(page.getByText(/esqueci.*senha/i)).toBeVisible();
  });

  test('Persistência de sessão: após login, recarregar página deve manter autenticação', async ({ page }) => {
    // Fazer login
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');
    await page.getByRole('textbox', { name: /email/i }).fill('test@petshop.com');
    await page.getByRole('textbox', { name: /senha/i }).fill('Test@123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Aguardar dashboard
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Recarregar página
    await page.reload();

    // Verificar que ainda está autenticado (não redirecionou para /login)
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByText('OPERAÇÃO')).toBeVisible({ timeout: 5000 });
  });

  test('Logout deve limpar sessão e redirecionar para login', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');
    await page.getByRole('textbox', { name: /email/i }).fill('test@petshop.com');
    await page.getByRole('textbox', { name: /senha/i }).fill('Test@123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Procurar e clicar no botão de logout (pode estar em menu dropdown ou sidebar)
    const logoutButton = page.getByRole('button', { name: /sair|logout/i });

    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
    } else {
      // Pode estar em dropdown de usuário
      const userMenu = page.locator('[data-testid="user-menu"], button[aria-label*="user"], button[aria-label*="usuário"]').first();
      if (await userMenu.isVisible({ timeout: 2000 })) {
        await userMenu.click();
        await page.getByRole('menuitem', { name: /sair|logout/i }).click();
      }
    }

    // Verificar redirecionamento para página de login
    await page.waitForURL(/.*\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*\/login/);
  });
});
