# Plano de Implementação - Portas Interativas & Armadilhas Ocultas no Dungeon Map

Este plano detalha o design técnico para adicionar interatividade de portas e ocultação/revelação de armadilhas no Dungeon Map estilo Dyson Logos, bem como a exibição de metadados em tempo real (via hover) no Cockpit do Mestre.

---

## 🛠️ Alterações Propostas

### 1. Extensão de Tipos no Grid ([MapMaker.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/MapMaker.tsx))
Estender a interface `Cell` para armazenar os novos metadados de portas e armadilhas diretamente no JSON de dados da célula:
* **`DoorConfig`**:
  * `status`: `'open' | 'closed'`
  * `doorType`: `'wooden' | 'iron' | 'stone' | 'secret'`
  * `breakDC`: `number` (CD para Arrombar)
  * `lockpickDC`: `number` (CD para Lockpick)
  * `secretRevealed`: `boolean` (Portas secretas visíveis aos jogadores)
* **`TrapConfig`**:
  * `trapType`: `string` (tipo/nome)
  * `detectDC`: `number` (CD para Detectar - Percepção/Investigação)
  * `disarmDC`: `number` (CD para Desarmar)
  * `revealedToPlayers`: `boolean` (Se a armadilha está revelada no mapa do jogador)
  * `description`: `string` (detalhes/efeitos da armadilha)

---

### 2. Edição de Metadados via Popover no DysonCanvas ([DysonCanvas.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/map/DysonCanvas.tsx))
* Adicionar um popover modal flutuante que se abre quando o mestre (modo edição/cockpit) clica em uma célula que já é do tipo `door` ou `trap`.
* **Formulário de Portas:**
  * Toggle para alternar status (Aberta/Fechada).
  * Dropdown para o Tipo de Porta (Madeira, Ferro, Pedra, Secreta).
  * Inputs numéricos para CD de Arrombar e CD de Lockpick.
  * Checkbox para "Revelar aos Jogadores" (se secreta).
* **Formulário de Armadilhas:**
  * Input de texto para Tipo da Armadilha e Descrição.
  * Inputs numéricos para CD de Detecção e CD de Desarmamento.
  * Checkbox/Toggle "Revelar aos Jogadores".

---

### 3. Lógica de Renderização de Elementos no Canvas ([DysonCanvas.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/map/DysonCanvas.tsx))
Diferenciar a renderização de portas e armadilhas entre a visualização do Mestre (DM) e do Jogador (Player):
* **No modo Mestre (DM):**
  * Desenhar um ícone ou indicador visual para portas fechadas (linhas de madeira hachuradas clássicas) ou portas abertas (traço pontilhado / linha rotacionada).
  * Mostrar portas secretas com um símbolo identificador estilizado (ex: círculo sepia com um "S").
  * Mostrar armadilhas com um símbolo identificador estilizado (ex: círculo vermelho com uma caveira ou "T") indicando se está visível aos jogadores ou oculta.
* **No modo Jogador (Player):**
  * **Porta Fechada:** Linha grossa marrom/sepia preenchida.
  * **Porta Aberta:** Linha pontilhada sutil na beirada ou espaço em branco.
  * **Porta Secreta:** Renderiza como parede comum se `secretRevealed == false`. Renderiza como porta aberta/fechada se `secretRevealed == true`.
  * **Armadilhas:** Completamente invisíveis (parece chão/parede normal) se `revealedToPlayers == false`. Caso `revealedToPlayers == true`, renderiza um ícone sutil de armadilha acionada/detectada.

---

### 4. Painel Hover de Informações no Cockpit ([CockpitDungeonMap.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CockpitDungeonMap.tsx))
* Rastrear a posição do mouse no canvas dentro do cockpit.
* Identificar se a célula sobre o ponteiro é uma porta ou armadilha.
* Caso seja, renderizar um painel de informações estilo *tooltip* flutuante seguindo o cursor com design premium (fundo escuro translúcido, bordas brilhantes, fonte mono):
  * **Exemplo de Porta:**
    * 🚪 **Porta de Ferro (Fechada)**
    * 🔨 CD para Arrombar: 18
    * 🔑 CD para Lockpick: 15
  * **Exemplo de Armadilha:**
    * ⚠️ **Armadilha de Agulha Envenenada (Oculta)**
    * 👁️ CD Percepção: 14 | 🔧 CD Desarmar: 16
    * *Efeito:* Dispara agulha causando 1d10 dano de veneno e envenenamento por 1 hora.

---

## 🧪 Plano de Verificação

### Testes Manuais
1. **Configuração de Portas/Armadilhas no MapMaker:**
   - Criar uma porta e uma armadilha. Clicar nas células delas e verificar se o popover de configuração é exibido.
   - Alterar as configurações (ex: fechar porta, mudar tipo para ferro, definir CDs) e verificar se o grid é salvo e atualizado.
2. **Visualização do Jogador:**
   - Abrir o `PlayerViewModal`.
   - Garantir que a porta secreta e a armadilha configurada como oculta **não apareçam** no mapa do jogador, mesmo se o fog of war for apagado.
   - Ativar a opção "Revelar aos Jogadores" no editor/cockpit e verificar se elas surgem instantaneamente na tela do jogador.
3. **Cockpit Hover:**
   - Abrir o Cockpit de mestre na aba Dungeon Map.
   - Passar o mouse sobre a porta e a armadilha e verificar se a tooltip flutuante surge com todas as estatísticas configuradas corretas.
