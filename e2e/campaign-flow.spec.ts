import { test, expect } from '@playwright/test';

test.describe('Masters Codex - Fluxos de Shell e Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start with a pristine state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('deve carregar a página principal com o cabeçalho e logo corretos', async ({ page }) => {
    // Verifica o título da página
    await expect(page).toHaveTitle(/Masters Codex/i);

    // Verifica o nome do sistema no Header
    const brandName = page.locator('h1').first();
    await expect(brandName).toContainText(/Master's/i);
    await expect(brandName).toContainText(/Codex/i);
  });

  test('deve alternar entre os papéis de Mestre e Jogador no Header', async ({ page }) => {
    const playerButton = page.getByRole('button', { name: 'Jogador', exact: true });
    const dmButton = page.getByRole('button', { name: 'Mestre', exact: true });

    // Verifica se os botões estão visíveis
    await expect(playerButton).toBeVisible();
    await expect(dmButton).toBeVisible();

    // Clica no modo Jogador e verifica se exibe o lobby de jogador
    await playerButton.click();
    await expect(playerButton).toHaveClass(/bg-cyan-500/);
    await expect(page.getByText(/MODO JOGADOR/i)).toBeVisible();

    // Volta para o modo Mestre
    await dmButton.click();
    await expect(dmButton).toHaveClass(/bg-amber-500/);
  });

  test('deve abrir e fechar o modal de criação de campanha', async ({ page }) => {
    // Encontra o botão de Iniciar Campanha na área vazia da sidebar
    const createButton = page.getByRole('button', { name: /\+ Iniciar Campanha/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Verifica se o modal abriu
    const modalTitle = page.getByRole('heading', { name: /Criar Nova Campanha de RPG/i });
    await expect(modalTitle).toBeVisible();

    // Clica em Cancelar para fechar o modal
    const cancelButton = page.getByRole('button', { name: /Cancelar/i });
    await cancelButton.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test('deve permitir carregar os dados de demonstração (Demo) e cenas modelo', async ({ page }) => {
    // Clica em Carregar Exemplo de Demo (que reinicia a página)
    const demoButton = page.getByRole('button', { name: /Carregar Exemplo de Demo/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Clica em uma Cena Modelo na barra lateral para carregar os combatentes
    const encounterButton = page.getByRole('button', { name: /Emboscada na Estrada da Floresta/i });
    await expect(encounterButton).toBeVisible();
    await encounterButton.click();

    // Ao carregar o encontro, a aba de Combate (Combat Tracker) fica focada
    const combatTab = page.getByRole('button', { name: /Combat Tracker/i });
    await expect(combatTab).toBeVisible();
    
    // Verifica a presença de monstros do encontro carregado no tracker
    await expect(page.getByText(/Líder Hobgoblin Kraag/i).first()).toBeVisible();
    await expect(page.getByText(/Goblin Espião/i).first()).toBeVisible();
  });

  test('deve navegar pelas abas da barra lateral', async ({ page }) => {
    // Navega para Compêndio SRD 5e
    const compendiumTab = page.getByRole('button', { name: /Compêndio SRD 5e/i });
    await expect(compendiumTab).toBeVisible();
    await compendiumTab.click();

    // Clica no botão para abrir a busca do compêndio
    const openSearchButton = page.getByRole('button', { name: /Abrir Busca Flutuante do Compêndio/i });
    await expect(openSearchButton).toBeVisible();
    await openSearchButton.click();

    // Verifica se o modal de busca do compêndio foi aberto (usando placeholder correto)
    await expect(page.getByPlaceholder(/Pesquisar no Compêndio/i)).toBeVisible();

    // Fecha o modal
    await page.keyboard.press('Escape');

    // Navega para Mundos & Lore Graph
    const worldbuilderTab = page.getByRole('button', { name: /Mundos & Lore Graph/i });
    await expect(worldbuilderTab).toBeVisible();
    await worldbuilderTab.click();

    // Verifica que o painel do criador de mundos foi renderizado (usando texto correto)
    await expect(page.getByText(/Biblioteca de Mundos & Universos/i).first()).toBeVisible();
  });
});
