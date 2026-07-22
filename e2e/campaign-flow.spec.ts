import { test, expect } from '@playwright/test';

test.describe('Masters Codex - Fluxos Críticos de E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve carregar o Studio e exibir o cabeçalho do Live Cockpit', async ({ page }) => {
    await expect(page).toHaveTitle(/Masters Codex/i);
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toContainText(/Studio Live Cockpit/i);
  });

  test('deve alternar entre os modos de exibição de Projeção (Ilustração, Mapa Tático e Grid 3D)', async ({ page }) => {
    const mapButton = page.getByRole('button', { name: /Mapa Tático/i });
    await expect(mapButton).toBeVisible();
    await mapButton.click();
    await expect(mapButton).toHaveClass(/bg-indigo-500/);

    const combatButton = page.getByRole('button', { name: /Grid 3D \/ Combate/i });
    await expect(combatButton).toBeVisible();
    await combatButton.click();
    await expect(combatButton).toHaveClass(/bg-rose-500/);
  });

  test('deve permitir abrir o modal de ajuda do Grid 3D', async ({ page }) => {
    const combatButton = page.getByRole('button', { name: /Grid 3D \/ Combate/i });
    await combatButton.click();

    const helpButton = page.locator('button[title="Ajuda e Controles"]');
    if (await helpButton.isVisible()) {
      await helpButton.click();
      await expect(page.getByText('Controles do Grid 3D')).toBeVisible();
    }
  });
});
