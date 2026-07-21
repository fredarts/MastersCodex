import { test, expect } from '@playwright/test';

test.describe('Masters Codex - Fluxo da Aplicação', () => {
  test('deve carregar a aplicação e navegar pelas abas do Studio', async ({ page }) => {
    // 1. Acessar a aplicação
    await page.goto('/');

    // 2. Verificar título do documento
    await expect(page).toHaveTitle(/Masters Codex/i);

    // 3. Verificar presença da barra de navegação principal (Live Cockpit)
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toContainText(/Studio Live Cockpit/i);

    // 4. Testar clique em alternância de abas de exibição (Mapa Tático / Grid 3D)
    const mapButton = page.getByRole('button', { name: /Mapa Tático/i });
    if (await mapButton.isVisible()) {
      await mapButton.click();
      await expect(mapButton).toHaveClass(/bg-indigo-500/);
    }
  });
});
