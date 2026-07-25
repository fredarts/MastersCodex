import { test, expect } from '@playwright/test';

test.describe('Masters Codex - Fluxo de Criação de Mundo & Lore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('deve navegar até o Worldbuilder e exibir a lista de mundos', async ({ page }) => {
    const worldbuilderTab = page.getByRole('button', { name: /Mundos & Lore Graph/i });
    await expect(worldbuilderTab).toBeVisible();
    await worldbuilderTab.click();

    await expect(page.getByText(/Biblioteca de Mundos & Universos/i).first()).toBeVisible();
  });

  test('deve permitir criar um novo mundo', async ({ page }) => {
    const worldbuilderTab = page.getByRole('button', { name: /Mundos & Lore Graph/i });
    await worldbuilderTab.click();

    const createWorldBtn = page.getByRole('button', { name: /Forjar Novo Mundo/i });
    await expect(createWorldBtn).toBeVisible();
    await createWorldBtn.click();

    const inputName = page.getByPlaceholder(/Ex: Valíria - O Reino dos Ventos/i);
    await expect(inputName).toBeVisible();
    await inputName.fill('Reino de Eldoria');

    const descInput = page.getByPlaceholder(/Ex: Um mundo em ruínas/i);
    await descInput.fill('Um mundo fantástico de alta magia e dragões antigos.');

    const submitBtn = page.getByRole('button', { name: /Criar Mundo/i });
    await submitBtn.click();

    await expect(page.getByText('Reino de Eldoria').first()).toBeVisible();
  });
});
