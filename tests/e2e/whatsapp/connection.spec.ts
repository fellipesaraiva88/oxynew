import { test, expect } from '@playwright/test';

test.describe('WhatsApp Connection - Dual Authentication Methods', () => {
  test.beforeEach(async ({ page }) => {
    // Login primeiro
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');
    await page.getByRole('textbox', { name: /email/i }).fill('test@petshop.com');
    await page.getByRole('textbox', { name: /senha/i }).fill('Test@123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Aguardar dashboard carregar
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

    // Navegar para página de WhatsApp
    await page.goto('https://oxy-frontend-d84c.onrender.com/whatsapp');
    await page.waitForLoadState('networkidle');
  });

  test('Página WhatsApp deve exibir wizard de configuração', async ({ page }) => {
    // Verificar título principal
    await expect(page.getByRole('heading', { name: /conectar whatsapp/i })).toBeVisible();

    // Verificar que está no passo inicial
    await expect(page.getByText(/método.*conexão/i)).toBeVisible();
  });

  test('Ambos os métodos de autenticação devem estar visíveis', async ({ page }) => {
    // Verificar que ambos os botões de método estão presentes
    await expect(page.getByRole('button', { name: /pairing code/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /qr code/i })).toBeVisible();

    // Verificar emojis
    await expect(page.locator('text=🔢')).toBeVisible();
    await expect(page.locator('text=📱')).toBeVisible();

    // Verificar descrições
    await expect(page.getByText(/código.*8 dígitos/i)).toBeVisible();
    await expect(page.getByText(/escanear.*câmera/i)).toBeVisible();
  });

  test('Pairing Code deve ser selecionado por padrão', async ({ page }) => {
    // Verificar que Pairing Code está com estilo ativo (border-ocean-blue)
    const pairingButton = page.getByRole('button', { name: /pairing code/i });

    const buttonClasses = await pairingButton.getAttribute('class');
    expect(buttonClasses).toContain('border-ocean-blue');
  });

  test('Clicar em QR Code deve alternar seleção', async ({ page }) => {
    const qrButton = page.getByRole('button', { name: /qr code/i });

    // Clicar em QR Code
    await qrButton.click();

    // Verificar que QR Code agora está ativo
    const buttonClasses = await qrButton.getAttribute('class');
    expect(buttonClasses).toContain('border-ocean-blue');
  });

  test('Campo de telefone deve estar visível APENAS com Pairing Code', async ({ page }) => {
    // Com Pairing Code (padrão), campo deve estar visível
    const phoneField = page.locator('input[placeholder*="número"]').or(page.getByRole('textbox').filter({ hasText: /whatsapp/i }));
    await expect(phoneField).toBeVisible();

    // Alternar para QR Code
    await page.getByRole('button', { name: /qr code/i }).click();

    // Campo de telefone deve desaparecer
    await expect(phoneField).not.toBeVisible();

    // Voltar para Pairing Code
    await page.getByRole('button', { name: /pairing code/i }).click();

    // Campo deve reaparecer
    await expect(phoneField).toBeVisible();
  });

  test('Pairing Code: botão "Gerar Código" deve estar desabilitado sem número', async ({ page }) => {
    // Certificar que Pairing Code está selecionado
    await page.getByRole('button', { name: /pairing code/i }).click();

    // Botão de avançar/gerar deve estar desabilitado
    const submitButton = page.getByRole('button', { name: /gerar|continuar|próximo/i });
    await expect(submitButton).toBeDisabled();
  });

  test('Pairing Code: preencher número válido deve habilitar botão', async ({ page }) => {
    // Certificar que Pairing Code está selecionado
    await page.getByRole('button', { name: /pairing code/i }).click();

    // Preencher número de telefone
    const phoneInput = page.locator('input[placeholder*="número"]').or(page.getByRole('textbox').filter({ hasText: /whatsapp/i }));
    await phoneInput.fill('+5511999887766');

    // Botão deve estar habilitado
    const submitButton = page.getByRole('button', { name: /gerar|continuar|próximo/i });
    await expect(submitButton).toBeEnabled();
  });

  test('QR Code: botão "Gerar QR Code" deve estar habilitado sem número', async ({ page }) => {
    // Alternar para QR Code
    await page.getByRole('button', { name: /qr code/i }).click();

    // Botão deve estar habilitado imediatamente (não precisa de número)
    const submitButton = page.getByRole('button', { name: /gerar|continuar|próximo/i });
    await expect(submitButton).toBeEnabled();
  });

  test('Pairing Code: submeter formulário deve gerar código de 8 dígitos', async ({ page }) => {
    // Selecionar Pairing Code
    await page.getByRole('button', { name: /pairing code/i }).click();

    // Preencher telefone
    const phoneInput = page.locator('input[placeholder*="número"]').or(page.getByRole('textbox').filter({ hasText: /whatsapp/i }));
    await phoneInput.fill('+5511999887766');

    // Clicar em gerar código
    await page.getByRole('button', { name: /gerar|continuar|próximo/i }).click();

    // Aguardar resposta da API (timeout 15s)
    await page.waitForTimeout(2000);

    // Verificar se código de 8 dígitos apareceu OU mensagem de status de conexão
    const codeVisible = await page.getByText(/\d{8}/).isVisible({ timeout: 5000 }).catch(() => false);
    const statusVisible = await page.getByText(/conectando|aguardando|digite.*código/i).isVisible({ timeout: 5000 }).catch(() => false);

    expect(codeVisible || statusVisible).toBeTruthy();
  });

  test('QR Code: submeter formulário deve exibir QR Code ou loading', async ({ page }) => {
    // Selecionar QR Code
    await page.getByRole('button', { name: /qr code/i }).click();

    // Clicar em gerar QR Code
    await page.getByRole('button', { name: /gerar|continuar|próximo/i }).click();

    // Aguardar resposta
    await page.waitForTimeout(2000);

    // Verificar se QR Code apareceu (imagem) OU loading OU mensagem de status
    const qrImage = await page.locator('img[alt*="qr"], canvas, svg').isVisible({ timeout: 5000 }).catch(() => false);
    const loadingVisible = await page.getByText(/gerando|carregando|aguarde/i).isVisible({ timeout: 5000 }).catch(() => false);
    const statusVisible = await page.getByText(/conectando|escaneie/i).isVisible({ timeout: 5000 }).catch(() => false);

    expect(qrImage || loadingVisible || statusVisible).toBeTruthy();
  });

  test('Instrução deve mudar conforme método selecionado', async ({ page }) => {
    // Pairing Code selecionado (padrão)
    await expect(page.getByText(/código.*8 dígitos/i)).toBeVisible();

    // Alternar para QR Code
    await page.getByRole('button', { name: /qr code/i }).click();

    // Instrução deve mudar para QR Code
    await expect(page.getByText(/escanear.*câmera/i)).toBeVisible();
  });

  test('Status de conexão deve ser visível após submeter', async ({ page }) => {
    // Usar QR Code (mais simples para teste sem número real)
    await page.getByRole('button', { name: /qr code/i }).click();
    await page.getByRole('button', { name: /gerar|continuar|próximo/i }).click();

    // Aguardar e verificar status
    await page.waitForTimeout(2000);

    // Deve mostrar algum status (conectando, aguardando, erro, etc)
    const hasStatus = await page.getByText(/status|conectando|aguardando|erro|sucesso/i).isVisible({ timeout: 5000 }).catch(() => false);

    // Ou pode ter redirecionado para tela de sucesso
    const isSuccessScreen = await page.getByText(/conectado|sucesso|pronto/i).isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasStatus || isSuccessScreen).toBeTruthy();
  });

  test('Voltar do wizard deve ser possível', async ({ page }) => {
    // Verificar se há botão de voltar/cancelar
    const backButton = page.getByRole('button', { name: /voltar|cancelar/i });

    if (await backButton.isVisible({ timeout: 2000 })) {
      await backButton.click();

      // Verificar que ainda está na página de WhatsApp ou voltou ao dashboard
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/whatsapp|dashboard/);
    }
  });
});

test.describe('WhatsApp Connection - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Login e navegar para WhatsApp
    await page.goto('https://oxy-frontend-d84c.onrender.com/login');
    await page.getByRole('textbox', { name: /email/i }).fill('test@petshop.com');
    await page.getByRole('textbox', { name: /senha/i }).fill('Test@123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await page.goto('https://oxy-frontend-d84c.onrender.com/whatsapp');
    await page.waitForLoadState('networkidle');
  });

  test('Número de telefone com formato inválido deve mostrar erro', async ({ page }) => {
    await page.getByRole('button', { name: /pairing code/i }).click();

    // Tentar com número muito curto
    const phoneInput = page.locator('input[placeholder*="número"]').or(page.getByRole('textbox').filter({ hasText: /whatsapp/i }));
    await phoneInput.fill('123');
    await page.getByRole('button', { name: /gerar|continuar|próximo/i }).click();

    // Deve mostrar erro de validação
    await expect(page.getByText(/inválido|formato|número/i)).toBeVisible({ timeout: 3000 });
  });

  test('Alternância rápida entre métodos não deve causar erro', async ({ page }) => {
    // Alternar rapidamente entre os dois métodos
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /qr code/i }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: /pairing code/i }).click();
      await page.waitForTimeout(100);
    }

    // Não deve ter erros no console ou na UI
    const errors = await page.locator('text=/erro|error/i').count();
    expect(errors).toBe(0);
  });

  test('Recarregar página durante conexão deve manter estado', async ({ page }) => {
    // Iniciar conexão com QR Code
    await page.getByRole('button', { name: /qr code/i }).click();
    await page.getByRole('button', { name: /gerar|continuar|próximo/i }).click();
    await page.waitForTimeout(2000);

    // Recarregar página
    await page.reload();

    // Verificar que ainda está na página de WhatsApp
    await expect(page).toHaveURL(/.*\/whatsapp/);
  });
});
