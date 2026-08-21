# PLAN-npc-character-sheet: Ficha Completa de D&D 5e para NPCs e Inimigos

## 1. Visão Geral e Objetivo
Transformar as fichas de NPCs e criaturas especiais no **Masters Codex** de um bloco simplificado de atributos para uma **Ficha Completa de D&D 5e** idêntica e interoperável com a dos jogadores (PCs).
Com isso, Mestres poderão criar e gerenciar NPCs com:
- **Classes, Subclasses e Níveis** (incluindo multiclasse e progressão automática de PV/Proficiência).
- **Raças, Sub-raças e Traços Raciais**.
- **Atributos, Salvaguardas e Perícias** completas.
- **Inventário e Equipamento Completo**: seleção de itens do SRD ou itens personalizados, equipar armaduras/escudos/armas com cálculo automático de CA, bônus de ataque e dano.
- **Magias, Truques e Espaços de Magia (Spell Slots / Pact Magic)** com CD de conjuração automática.
- **Habilidades de Classe, Recursos com Cargas** (Fúria, Canalizar Divindade, Inspiração de Bardo, etc.) e Talentos (Feats).
- **Integração Total com Combate e Live Cockpit**: NPCs com ficha completa entram em batalha prontos com todas as ações calculadas, QuickCombatBar e lançamento de dados com 1 clique.

---

## 2. Arquitetura e Modelagem de Dados

### 2.1 Modelo de Dados (`lib/types.ts`)
1. **Extensão de `WorldEntity` e `EntityStatSheet`**:
   - `WorldEntity` já possui `statSheet?: EntityStatSheet`.
   - Adicionar campo opcional `characterSheet?: CharacterSheet` em `WorldEntity` (ou vincular o `EntityStatSheet` expandido para ser compatível/bidirecional com `CharacterSheet`).
   - Permitir que o Mestre escolha o modo da ficha do NPC:
     - **Modo Monstro / Bloco Rápido (StatBlock)**: Para lacaios, monstros genéricos e animais rápidos (estilo SRD Monster Manual).
     - **Modo Personagem Completo (Full PC Sheet)**: Para vilões principais, aliados, chefes, NPCs importantes e campeões com classe/raça/itens/magias completas.

2. **Compatibilidade com Combatentes (`Combatant`)**:
   - Quando um NPC com ficha completa é adicionado a uma cena / combate, o objeto `Combatant` carrega a referência `characterSheet` completa, permitindo abrir o `CharacterSheetModal` ou o `MonsterStatBlockModal` dinamicamente no Live Cockpit e no combate da campanha.

---

## 3. Experiência de Criação e Edição (UI/UX)

### 3.1 Aba "Ficha de Estatísticas" no `WorldEntityModal`
- Toggle de Modo: `[ ⚔️ Bloco de Estatísticas Rápido ]` vs `[ 🛡️ Ficha Completa D&D 5e ]`.
- No modo **Ficha Completa**:
  - Resumo de Status Principal (Nível, Classe, Raça, CA, PV, Iniciativa, Percepção Passiva).
  - Botão de destaque **"🧙 Abrir Assistente de Criação (Wizard)"**: reutiliza `CharacterBuilderWizardModal` para construir o NPC passo a passo em segundos (escolhendo raça, classe, atributos, perícias).
  - Botão **"📜 Abrir Ficha Completa"**: abre o `CharacterSheetModal` completo dedicado ao NPC, com todas as 8 abas funcionais (Geral, Combate, Perícias, Habilidades, Equipamento, Magias, RP, Diário).
  - Seletor rápido de Equipamentos & Itens diretamente no modal ou através da aba de Equipamentos integrada.

### 3.2 Seletor e Gerenciador de Equipamentos para NPCs
- Acesso à base completa de itens do SRD (armas, armaduras, itens mágicos, poções, ferramentas).
- Equipar arma calcula automaticamente o ataque (ex: *Espada Longa +1: +6 no acerto, 1d8+4 cortante*).
- Equipar armadura/escudo ajusta dinamicamente a CA do NPC considerando modificadores de Destreza e bônus mágicos.

---

## 4. Integração no Combate e Cenas

1. **`CreateSceneModal.tsx`**:
   - Ao importar uma entidade NPC para os combatentes da cena, se o NPC tiver `characterSheet`, seus valores de HP, CA, ataques e magias são preenchidos automaticamente com precisão total.
2. **`LiveCockpit.tsx` / `app/page.tsx`**:
   - Clicar no NPC abre sua ficha completa ou statblock de combate rápido, com suporte a rolagem de dados em 3D, gastos de recursos e slots de magia.

---

## 5. Plano de Execução em Fases

### Fase 1: Extensão dos Tipos e Repositórios
- Atualizar `WorldEntity` em `lib/types.ts` para suportar `characterSheet?: CharacterSheet`.
- Atualizar `worldService` e repositórios (`LocalStorageWorldRepository` e `SupabaseWorldRepository`) para salvar e carregar `characterSheet` nas entidades.

### Fase 2: Integração no `WorldEntityModal`
- Implementar o seletor de tipo de ficha (Rápida vs Completa) no `WorldEntityModal`.
- Integrar o `CharacterSheetModal` e `CharacterBuilderWizardModal` para entidades do tipo NPC.
- Fornecer sincronização automática entre os campos do NPC (nome, raça, classe, imagem) e a ficha `CharacterSheet`.

### Fase 3: Equipamento, Itens e Ações
- Garantir que a aba de Equipamentos (`EquipmentSection`) e Magias (`SpellsSection`) funcione perfeitamente para NPCs no contexto de Mestre (sem restrições de permissão de jogador).
- Permitir carregar kits rápidos de equipamento para NPCs (ex: "Kit Soldado da Guarda", "Kit Mago Aprendiz", "Kit Assassino").

### Fase 4: Combate e Live Cockpit
- Adaptar o fluxo de combate para que combatentes baseados em NPCs completos usem todos os ataques, bônus e magias da ficha.
- Testes automatizados e validação de ponta a ponta.
