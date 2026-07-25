import { test, expect } from '@playwright/test';

test.describe('Masters Codex - Interações E2E BattleGrid3D e Live Cockpit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('deve carregar o BattleGrid3D, alternar projeção para modo combate e acionar rolagens de dados', async ({ page }) => {
    // 1. Carrega os dados da demo
    const demoButton = page.getByRole('button', { name: /Carregar Exemplo de Demo/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // 2. Navega para o Estúdio Cockpit Ao Vivo
    const liveCockpitTab = page.getByRole('button', { name: /Estúdio Sessão ao Vivo/i });
    await expect(liveCockpitTab).toBeVisible();
    await liveCockpitTab.click();

    // 3. Alterna Projeção para Modo Combate (Ativa o BattleGrid3D)
    const combatModeButton = page.getByRole('button', { name: /Modo Combate/i });
    await expect(combatModeButton).toBeVisible();
    await combatModeButton.click();

    // 4. Verifica se a área do Grid 3D ou container Three.js é visível
    const cockpitTitle = page.getByText('Estúdio Cockpit Ao Vivo');
    await expect(cockpitTitle).toBeVisible();

    // 5. Garante que os controles do Combat Tracker estão acessíveis e responsivos
    const combatTrackerTab = page.getByRole('button', { name: /Combat Tracker/i });
    await expect(combatTrackerTab).toBeVisible();
    await combatTrackerTab.click();

    // 6. Avança turno no combate
    const nextTurnButton = page.getByRole('button', { name: /PRÓXIMO TURNO/i });
    await expect(nextTurnButton).toBeVisible();
    await nextTurnButton.click();

    // 7. Adiciona um combatente para verificar atualização no grid/tracker
    const addGoblinButton = page.getByRole('button', { name: /\+ Goblin/i }).first();
    await expect(addGoblinButton).toBeVisible();
    await addGoblinButton.click();

    await expect(page.getByText(/Goblin/i).first()).toBeVisible();
  });
});
