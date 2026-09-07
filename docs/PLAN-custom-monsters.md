# PLAN - Sistema de Monstros Customizados, Variantes & Tunagem no Cockpit

## 📌 Visão Geral & Objetivo
Permitir que o Mestre crie, personalize, tune e salve monstros customizados e variantes mais fortes (ex: **Goblin Líder**, **Orc Xamã de Batalha**, **Esqueleto Campeão**, **Dragão Ancião Corrompido**) de forma rápida e intuitiva em três pontos-chave do sistema:
1. **A partir de qualquer monstro padrão (SRD / Compêndio)** com 1 clique ("Clonar & Customizar / Criar Variante").
2. **Diretamente durante o combate no Live Cockpit** (via `MonsterStatBlockModal`), permitindo alterar atributos/nome/PV e promover o monstro alterado a uma **Variante Permanente** salva na biblioteca.
3. **No fluxo de adicionar combatentes (`AddCombatantModal` e Omnibar)**, exibindo automaticamente as variantes customizadas ao buscar pelo monstro base (ex: pesquisar *"Goblin"* exibe o Goblin padrão e também *"Goblin Líder"* com badge de variante).

---

## 🔍 Análise de Pontos Cegos & Correções de Arquitetura

Identificamos e corrigimos 6 pontos cegos críticos do fluxo anterior:

| Ponto Cego | Risco / Problema | Solução Arquitetural Implementada |
| :--- | :--- | :--- |
| **1. Colisão de Nomes de Instância** | Ao editar um `Goblin (1)` ou `Goblin 2` no Cockpit e salvar como variante, salvaria com o número de instância no nome. | **Higienização Automática de Nomes:** Ao promover um combatente de combate para a biblioteca, remove automaticamente sufixos `(1)`, ` 2`, etc., sugerindo um nome limpo (ex: `Goblin Líder` ou `Goblin (Variante)`). |
| **2. Dessincronia de Ações e Habilidades** | `MonsterStatBlockModal` buscava ações apenas por fallback de nome na SRD (`INITIAL_MONSTERS.find`). Monstros tunados perdiam suas novas ações/habilidades se o objeto `Combatant` não as armazenasse de forma autônoma. | **Combatant Auto-Suficiente:** O `Combatant` passa a transportar `actions`, `abilities`, `spells`, `damageResistances`, `damageImmunities`, `damageVulnerabilities`, `tokenImageUrl`, `modelUrl` e `baseMonsterName` diretamente. |
| **3. Preservação de Dano vs Max HP** | Se um Goblin tomou 5 de dano (Vida atual: 2/7) e o Mestre tunar seu Max HP para 30, o cálculo de vida atual poderia quebrar ou deixar o monstro morto. | **Ajuste Proporcional / Total:** Na tunagem rápida, o Mestre tem a opção de *"Restaurar Vida Máxima"* ou *"Manter Dano Atual"*. |
| **4. Descoberta de Variantes na Busca** | Na aba de monstros padrão, o Mestre tinha que adivinhar se já havia criado uma variante ou alternar para a aba de customizados. | **Busca Unificada com Badges:** Ao pesquisar por *"Goblin"*, a listagem exibe o Goblin Base e, logo abaixo, as variantes customizadas derivadas dele com badge `Variante Custom` e botão de entrada em 1 clique. |
| **5. Integração com Omnibar & Comandos DM** | O Omnibar (`/spawn`) usava apenas a lista estática da SRD, ignorando monstros customizados. | **Provedor Dinâmico no Omnibar:** Integração do índice de monstros customizados no `omnibar-engine.ts` e `DmCommandPalette.tsx`. |
| **6. Atualização de Tokens 2D / 3D no BattleGrid** | Alterar o tamanho ou o token da variante no modal precisa refletir no grid 3D (`BattleGrid3D`) e no feed de combate em tempo real. | **Sincronização de Token & Tamanho:** A atualização dispara a re-renderização imediata da miniatura no grid 3D e da barra de iniciativa. |

---

## 🧭 Fluxos de Usuário (User Journeys)

### Fluxo 1: Criar Variante a partir do Compêndio / Bestiário
1. O Mestre abre o **Compêndio de Monstros** (`CompendiumView`) ou o modal de monstros.
2. Clica no botão **"Criar Variante / Tunar Monstro"** no card do Goblin.
3. O `CreateMonsterModal` abre com **todos os campos pré-carregados** (PV: 7, CA: 15, FOR: 8, DES: 14, Ataques: Cimitarra, Arco Curto).
4. O Mestre altera o nome para *"Goblin Líder"*, altera PV para 32, CA para 16, adiciona uma habilidade passiva *"Presença Intimidadora"* e um ataque *"Espada Larga Envenenada"*.
5. Clica em **"Salvar Monstro"**. O monstro é salvo em `customMonsterService` (localStorage + Supabase) com `baseMonsterName: "Goblin"`.

### Fluxo 2: Tunagem Rápida & Salvamento Direto no Live Cockpit
1. No meio da sessão, o Mestre adiciona 3 Goblins ao combate.
2. Decide que um deles será o chefe. Abre a ficha dele (`MonsterStatBlockModal`).
3. Clica no novo botão **"Tunar / Salvar Variante"** no topo da ficha.
4. Faz alterações rápidas (ex: Nome = *"Goblin Líder"*, PV = 40, FOR = 16, CA = 17).
5. Escolhe:
   - **[Aplicar apenas a este Combate]**: Atualiza a criatura atual no grid e na ordem de turno.
   - **[Salvar também como Nova Variante na Biblioteca]**: Atualiza a criatura atual E adiciona *"Goblin Líder"* à lista permanente de monstros customizados para futuros combates!

### Fluxo 3: Adição Inteligente de Combatentes (Busca com Variantes)
1. No combate seguinte, o Mestre abre `AddCombatantModal` e digita *"Goblin"*.
2. A lista exibe:
   - **Goblin** *(CR 1/4 - SRD Oficial)* `[+ Adicionar]` `[Clonar/Tunar]`
   - **Goblin Líder** *(CR 2 - ⭐ Variante Customizada)* `[+ Adicionar]` `[Editar]`
3. O Mestre clica em `+ Adicionar` no Goblin Líder, que entra no combate com todos os atributos e ataques tunados.

---

## 🏗️ Modificações Propostas por Arquivo

### 1. Modelagem de Dados & Tipos
#### `lib/types.ts`
- **Campos adicionados em `CustomMonster` e `Combatant`:**
  - `baseMonsterId?: string` (ID do monstro original da SRD ou Custom)
  - `baseMonsterName?: string` (ex: `"Goblin"`, `"Orc"`)
  - `isCustomVariant?: boolean` (flag para identificação de variantes)
  - `variantTag?: string` (ex: `"Líder"`, `"Elite"`, `"Chefe"`, `"Mago"`)
  - Garantir que `Combatant` possua os campos `abilities`, `actions`, `spells`, `damageResistances`, `damageImmunities`, `damageVulnerabilities`, `conditionImmunities` totalmente tipados e populados.

---

### 2. Modal de Criação & Customização de Monstro
#### `components/modals/CreateMonsterModal.tsx`
- **Sincronização Reativa:** Corrigir a inicialização do estado interno através de `useEffect` / memoização quando `initialMonster` mudar ou for reaberto.
- **Suporte a Clonagem e Herança:** Ao clonar, preencher automaticamente todas as ações, magias, resistências e o token correspondente.
- **Sugestão de Nome Inteligente:** Quando clonado, sugerir `${initialMonster.name} (Líder)` ou `${initialMonster.name} (Variante)`.
- **Modo de Atualização Direta de Combatente:** Aceitar prop opcional `onUpdateActiveCombatant?: (combatant: Combatant) => void` e toggle de *"Salvar também na biblioteca global"*.
- **Cálculo de XP Automático:** Ao alterar o CR no select, atualizar automaticamente o XP sugerido (D&D 5e).

---

### 3. Ficha do Monstro no Live Cockpit
#### `components/live-cockpit/MonsterStatBlockModal.tsx`
- **Botão "Tunar / Salvar Variante":** Adicionado no header com ícone estilizado (`Sparkles` / `Wand2`).
- **Autonomia de Dados:** Renderizar `combatant.abilities` e `combatant.actions` prioritariamente antes de recorrer ao fallback da SRD.
- **Ações de Ataque e Testes Customizados:** Suporte à execução de rolagens com os bônus e dados específicos definidos nas ações customizadas do combatente.
- **Abertura do Editor:** Ao clicar em "Tunar", abre o `CreateMonsterModal` ou painel de edição com os dados do combatente atual (com nome higienizado de instâncias).

---

### 4. Modal de Adicionar Combatente no Combate
#### `components/live-cockpit/AddCombatantModal.tsx`
- **Botão "Clonar & Tunar" na Lista SRD:** Cada monstro do Bestiário ganha um botão com ícone de varinha/duplicar para criar uma variante antes de colocar no grid.
- **Busca Unificada no Bestiário:** Na aba "Monstros", mesclar os monstros da SRD com as variantes customizadas que correspondam à busca ou ao monstro base pesquisado, com badge destacada `Variante Custom` / `Custom`.
- **Aba "Meus Monstros":** Mantém a curadoria completa de monstros criados com busca, botão de "+ Criar do Zero", edição e exclusão.

---

### 5. Compêndio de Monstros
#### `components/CompendiumView.tsx`
- **Botão "Criar Variante Deste Monstro":** No painel de detalhes do monstro selecionado no Compêndio, adicionar botão de ação rápida para clonar e customizar.
- **Lista de Variantes do Monstro:** Exibir se existem variantes customizadas já criadas daquele monstro base (ex: ao ver o Goblin, listar *"Suas Variantes: Goblin Líder, Goblin Arqueiro"*).

---

### 6. Provedor de Monstros no Omnibar
#### `lib/omnibar-engine.ts` e `components/omnibar/DmCommandPalette.tsx`
- Integrar a busca de `customMonsterService.fetchCustomMonsters()` no Omnibar para que comandos como `/spawn Goblin Líder` ou buscas rápidas por texto encontrem instantaneamente os monstros customizados criados.

---

## 🧪 Plano de Testes & Verificação

### 1. Testes Automatizados (Unit & Integration)
- **`lib/__tests__/customMonsterService.test.ts`**:
  - Testar criação de monstro customizado a partir de um `SRDMonster`.
  - Testar herança de atributos, ações e cálculo de CR/XP.
  - Testar recuperação com filtro de variantes por `baseMonsterName`.
  - Testar persistência em `localStorage` e integração com `Supabase`.

### 2. Testes Manuais de Interface & Experiência do Usuário (UX)
1. **Teste de Clonagem no Compêndio:**
   - Acessar o Compêndio de Monstros → Selecionar *"Goblin"*.
   - Clicar em *"Criar Variante"*, renomear para *"Goblin Líder"*, alterar PV para 35 e salvar.
   - Verificar se aparece na aba *"Meus Monstros"*.
2. **Teste de Tunagem no Cockpit:**
   - Iniciar um combate e adicionar 2 Goblins.
   - Abrir a ficha do segundo Goblin.
   - Clicar em *"Tunar / Salvar Variante"*, mudar nome para *"Goblin Xamã"*, aumentar INT para 16 e adicionar magia *"Raio de Fogo"*.
   - Salvar como variante e verificar se o combatente no grid mudou de nome e se o novo ataque funciona no clique de rolagem.
3. **Teste de Busca e Reutilização:**
   - No modal de adicionar combatentes, digitar *"Goblin"*.
   - Verificar se tanto o *"Goblin"* oficial quanto o *"Goblin Líder"* e *"Goblin Xamã"* aparecem como opções claras e podem ser adicionados ao combate.
