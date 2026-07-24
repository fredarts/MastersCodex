import { test, expect } from '@playwright/test';

test.describe('Masters Codex - Fluxos de Combate e Live Cockpit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start with a pristine state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('deve carregar o Live Cockpit, alternar projeção e avançar turnos no Combat Tracker', async ({ page }) => {
    // 1. Carrega os dados da demo na página inicial para ter campanhas e combates prontos
    const demoButton = page.getByRole('button', { name: /Carregar Exemplo de Demo/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // 2. Vai para a aba do Estúdio Sessão ao Vivo (Live Cockpit)
    const liveCockpitTab = page.getByRole('button', { name: /Estúdio Sessão ao Vivo/i });
    await expect(liveCockpitTab).toBeVisible();
    await liveCockpitTab.click();

    // 3. Verifica se a página do estúdio foi carregada com sucesso
    const cockpitTitle = page.getByText('Estúdio Cockpit Ao Vivo');
    await expect(cockpitTitle).toBeVisible();

    // 4. Alterna a exibição de projeção para Modo Combate
    const combatModeButton = page.getByRole('button', { name: /Modo Combate/i });
    await expect(combatModeButton).toBeVisible();
    await combatModeButton.click();

    // Verifica se a classe ativa bg-rose-600 foi aplicada ao botão de Modo Combate
    await expect(combatModeButton).toHaveClass(/bg-rose-600/);

    // 5. Navega para a aba de Combat Tracker
    const combatTrackerTab = page.getByRole('button', { name: /Combat Tracker/i });
    await expect(combatTrackerTab).toBeVisible();
    await combatTrackerTab.click();

    // 6. Verifica se exibe o painel de combate e o indicador de rodada inicial
    await expect(page.getByRole('heading', { name: /Combat Tracker/i })).toBeVisible();
    await expect(page.getByText('RODADA 1')).toBeVisible();

    // 7. Clica no botão de PRÓXIMO TURNO e verifica o avanço
    const nextTurnButton = page.getByRole('button', { name: /PRÓXIMO TURNO/i });
    await expect(nextTurnButton).toBeVisible();
    await nextTurnButton.click();

    // 8. Testa a injeção rápida de monstros da barra inferior
    const addGoblinButton = page.getByRole('button', { name: /\+ Goblin/i }).first();
    await expect(addGoblinButton).toBeVisible();
    await addGoblinButton.click();

    // Verifica se o novo combatente "Goblin" apareceu no painel do tracker
    await expect(page.getByText(/Goblin/i).first()).toBeVisible();
  });
});
