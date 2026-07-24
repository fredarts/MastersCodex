# Plano de Implementação: Fluxo de Batalha Completo D&D 5e

Este plano visa integrar a ficha de personagem ao Cockpit de Combate e implementar a economia de ações e deslocamento em grid para o controle total do combate.

---

## Tipo de Projeto
- **WEB**: Aplicação React com Three.js (3D Grid) e integração com Supabase.

---

## Decisões de Design Definidas

1. **Consumo de Ações (Híbrido)**:
   - Dedução automática de **Ação** ou **Ação Bônus** ao rolar ataques ou magias que gastem esses recursos.
   - Suporte a cliques manuais para ativar/desativar badges nos cards dos combatentes no Cockpit.
2. **Deslocamento e Limites no Grid 3D (Estilo Baldur's Gate 3 / Preso ao Grid)**:
   - Exibição visual de células do grid ativas (destacadas com brilho/cor translúcida) onde o personagem pode caminhar.
   - Cada quadrado do grid equivale a **1.5 metros (5 pés)**.
   - Bloqueio físico: o token ativo é impedido de ser arrastado ou solto fora das células destacadas de seu raio de deslocamento disponível.
   - Botão rápido de **Dash (Disparada)** no card do Cockpit para dobrar o deslocamento disponível.
3. **Cálculo da Distância Diagonal**:
   - **Diagonal Simples**: Cada quadrado percorrido na diagonal conta exatamente como 1.5m (distância Chebyshev). A área de alcance de movimento forma um quadrado ao redor do token.

---

## Critérios de Sucesso
1. **Ataque com Armas no Cockpit**: Jogadores em combate têm suas armas da ficha sincronizadas. O Cockpit exibe os botões de ataque rápido de cada arma.
2. **Economia de Ações**: Controle lógico de Ação, Ação Bônus e Reação, com reset no início do turno de cada combatente.
3. **Validação de Movimento em Grid 3D**:
   - Destaque translúcido no chão de todas as células acessíveis (raio de movimentação).
   - Bloqueio físico de arrasto para fora da zona de deslocamento restante.
   - Suporte a ação de Disparada (Dash) atualizando dinamicamente a área ativa.

---

## Mudanças Propostas

### 1. Tipos e Modelo de Dados

#### [MODIFY] [lib/types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts)
- Adicionar propriedades de controle ao `Combatant`:
  ```typescript
  export interface Combatant {
    // ... campos existentes
    actionUsed?: boolean;
    bonusActionUsed?: boolean;
    reactionUsed?: boolean;
    movementUsed?: number;    // em metros
    turnStartX?: number;      // Posição X inicial no início do turno
    turnStartZ?: number;      // Posição Z inicial no início do turno
    hasDashed?: boolean;      // Se usou ação de Disparada neste turno
  }
  ```

---

### 2. Lógica de Turnos e Painel (Cockpit)

#### [MODIFY] [components/LiveCockpitStudio.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/LiveCockpitStudio.tsx)
- **Carregamento de Armas**:
  - Procurar a ficha do jogador no array `characterSheets` correspondente ao combatente ativo.
  - Exibir as armas (`attacks`) como botões de ataque adicionais no painel rápido do cockpit.
  - Chamar `rollDice` configurando bônus de acerto e dano da arma, reduzindo a Ação (`actionUsed`) se bem-sucedido.
- **Badges de Economia de Ações**:
  - Renderizar no card de cada combatente três indicadores interativos: **Ação (A)**, **Ação Bônus (B)**, **Reação (R)**.
  - No início de um turno (`handleNextTurn`), resetar `actionUsed` e `bonusActionUsed` para `false`, limpar `movementUsed` e `hasDashed`, definir `turnStartX` e `turnStartZ` com a posição atual do token, e restaurar `reactionUsed` (se for o turno próprio).
  - Integrar o botão de "Disparada (Dash)" que consome a Ação e dobra a velocidade disponível.

#### [MODIFY] [components/live-cockpit/CombatTurnOrderPanel.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CombatTurnOrderPanel.tsx)
- Adicionar pequenos marcadores visuais discretos de recursos (Ação, Bônus, Reação, Deslocamento restante) para cada combatente na lista de ordem de combate.

---

### 3. Grid 3D de Batalha (Cálculo e Feedback Visual de Movimentação)

#### [MODIFY] [components/BattleGrid3D.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/BattleGrid3D.tsx)
- **Destaque Visual das Células (Baldur's Gate 3 Style)**:
  - Criar um grupo de meshes de plano fino (`THREE.PlaneGeometry`) com cor azul translúcida para representar as células válidas que o token ativo pode andar.
  - O cálculo de alcance usará Chebyshev: `max(abs(gridX - startX), abs(gridZ - startZ)) * 1.5 <= (speed_max - movementUsed)`.
- **Restrição de Movimento**:
  - Durante o arrasto do token (`handlePointerMove`), calcular o snap e validar se a célula destino está contida na área destacada (válida).
  - Se estiver fora da área válida, impedir o arrasto/snap para essa célula (manter o token na última posição válida ou limitar o snap na borda do alcance).
  - Ao concluir a movimentação (`handlePointerUp`), atualizar `movementUsed` com a distância percorrida no banco via `updateScene`.

---

## Plano de Verificação

### Testes Manuais
1. **Verificação de Seleção de Arma**:
   - Selecionar um jogador com 3 armas cadastradas na ficha.
   - Confirmar a renderização dos 3 botões de ataque no Cockpit. Rolar o ataque e garantir o consumo automático da Ação.
2. **Grid BG3 Style & Deslocamento**:
   - Iniciar o turno de um jogador.
   - Observar o destaque azul das células válidas ao redor do token correspondentes à sua velocidade (ex: velocidade de 9m gera uma área de 6x6 células destacadas ao redor do token).
   - Tentar arrastar o token para fora da área destacada. O token deve ser travado nas bordas da área azul.
   - Clicar no botão "Dash" no Cockpit. Observar a área destacada expandir para 12x12 células.
   - Mover o token por 4.5m. O deslocamento restante deve atualizar para 4.5m (ou 13.5m se com Dash), e a área de destaque azul deve encolher correspondentemente.
3. **Reset de Recursos**:
   - Passar o turno. Verificar se todos os status do combatente anterior são resetados e o novo combatente ganha sua área de movimento correspondente.
