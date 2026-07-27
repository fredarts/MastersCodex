# PLAN: Aprimoramento de UX e Layout do Estúdio de Sessões (Session Studio UX)

Este plano detalha as melhorias de interface e experiência de usuário (UX) no Estúdio de Sessões, tornando o menu de abas e a timeline de cenas colapsáveis e eliminando a duplicação de controles de sessão e campanha.

---

## 🎯 Objetivos

1. **Menu de Recursos Vertical e Colapsável**: Alterar as abas horizontais do editor de cena (`activeSubTab`) para um menu lateral esquerdo vertical e retrátil (estilo menu sanduíche/sidebar), semelhante ao estúdio de worldbuilding.
2. **Timeline de Cenas Colapsável**: Permitir contrair e expandir a barra lateral esquerda de cenas (`w-64` para `w-16`), mostrando apenas ícones e números das cenas quando contraída (idêntico ao cockpit de sessão ao vivo).
3. **Eliminar Redundância do Banner Superior**: Remover o banner do topo do `SessionStudio` que duplica seletores de campanha/sessão, centralizando os controles no `SessionNavigator` (já renderizado acima no workspace).
4. **Reposicionar Botão Ao Vivo**: Mover o botão "▶ DISPARAR CENA AO VIVO" para o cabeçalho do editor da cena atual, ao lado do botão "Salvar Cena".

---

## 📋 Proposta de Alterações

### 🛠️ Componente afetado: [SessionStudio.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/SessionStudio.tsx)

- **Novos Estados**:
  - `isScenesSidebarCollapsed` (boolean, default: `false`) para controlar a timeline de cenas.
  - `isSubTabsCollapsed` (boolean, default: `false`) para controlar o menu de recursos da cena.
- **Importações**:
  - Adicionar `ChevronLeft` e `ChevronRight` de `lucide-react` para os botões de recolhimento.
- **Estrutura de Layout**:
  - **Remover**: Banner superior (`{/* Top Banner */}`) inteiro, limpando a redundância do seletor de sessão e do formulário de criação.
  - **Timeline (Esquerda)**: Atualizar o contêiner e o mapeamento das cenas para reagir ao estado `isScenesSidebarCollapsed`. Quando contraído, a largura passa a ser `w-16` e as cenas exibem apenas o número compacto (ex: `#1`, `#2`) e o ícone de tipo.
  - **Menu de Recursos (Aba Lateral)**: Mudar a barra horizontal superior para um `<aside>` flex à esquerda do painel de conteúdo da aba. Ao colapsar (`isSubTabsCollapsed`), mostra apenas os ícones; ao expandir, exibe ícones e títulos (ex: "Arte da Cena", "Áudio (BGM)", "Encontro", etc.).
  - **Cabeçalho do Editor de Cenas**: Inserir o botão "▶ DISPARAR CENA AO VIVO" (em verde-esmeralda vibrante) logo antes/ao lado do botão "Salvar Cena" quando houver uma cena selecionada.

---

## 🏁 Plano de Verificação

### 🧪 Verificação Manual
1. **Verificação de Redundância**: Acessar o Estúdio de Sessões e checar se o cabeçalho duplicado desapareceu, mantendo apenas a navegação global do `SessionNavigator`.
2. **Verificação da Timeline de Cenas**:
   - Clicar no botão de colapsar na timeline de cenas e validar se contrai para `w-16`.
   - Clicar nas cenas em modo compacto e verificar se continuam selecionando corretamente.
   - Expandir a timeline de volta para `w-64`.
3. **Verificação do Menu de Recursos (Abas)**:
   - Alternar entre as abas no formato vertical.
   - Clicar para colapsar o menu e validar se reduz para mostrar apenas os ícones correspondentes.
   - Garantir que o conteúdo de cada aba (Upload de Imagens, BGM & SFX, Encontros, etc.) renderize sem quebras de layout.
4. **Verificação do Disparo Ao Vivo**: Clicar no botão "▶ DISPARAR CENA AO VIVO" reposicionado no cabeçalho da cena e validar se a projeção é iniciada perfeitamente.

### 🛡️ Testes de Build e Linters
- Executar `npm run lint` e testar a integridade dos tipos do TypeScript.
