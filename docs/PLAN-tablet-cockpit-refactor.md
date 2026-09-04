# PLAN: Refatoração UI/UX do Cockpit do Jogador (Otimização Desktop & Tablet)

> **Task Slug:** `tablet-cockpit-refactor`  
> **Status:** Planejado  
> **Arquivos Afetados:** `components/PlayerLobby.tsx`, `components/PlayerCombatTrackerHUD.tsx`, `components/PlayerTokenActionDock.tsx`

---

## 🎯 Objetivo
Transformar o **Cockpit do Jogador** (`PlayerLobby.tsx`) em uma interface moderna, imersiva e responsiva (com foco especial em **Tablets/iPads** e telas médias), eliminando o acúmulo vertical de 4 barras de topo (*Chrome Overhead*), resolvendo redundâncias visuais, ampliando a área útil do Tabuleiro 3D/Mapa para 100% e criando alvos de toque ergonômicos (*Touch Targets* ≥ 44px).

---

## 🔍 Diagnóstico e Pontos Cegos Identificados

1. **Monstro do Header Quádruplo (Perda de ~35% de Altura):**
   - Barra Global da Aplicação + Barra de Sessão + Barra de Ações Rápidas + Barra de Iniciativa criam um empilhamento excessivo que esmaga o canvas 3D no Tablet.
2. **Duplicações de Ações:**
   - Botão "Ficha" presente no topo e duplicado no card do personagem.
   - Nome da campanha repetido em 2 barras.
   - Seletores de visualização misturados com câmeras 3D.
3. **Ergonomia e Touch Targets no Tablet:**
   - Chips de ação (`• Ação`, `• Bônus`, `• Reação`) e abas do chat com altura inferior a 32px.
   - Cards de iniciativa sofrendo corte lateral (*horizontal clipping*) com sobreposição de texto.
4. **Desproporção do Canvas:**
   - A coluna do chat ocupa ~380px fixos, deixando a área central de combate apertada mesmo quando não há mensagens ativas.

---

## 📐 Arquitetura da Nova Interface (Desktop & Tablet First)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [←] [CODEX] • No ninho do dragão  [Dia 20 08:00]  |  [🎨|🗺️|🎲]  | [🎧] [📖13] [⚙️] 👤│ ← Header Unificado (48px)
├─────────────────────────────────────────────────────────────┬──────────────────────────┤
│ ⚔️ [ #17 Kobold 3 (Vez) ] [ #14 Kobold 1 ] [ #11 Lilith ] ❯ │ 🛡️ KIRION   PV: 7/14    │ ← Tracker Glass Flutuante
├─────────────────────────────────────────────────────────────┤    CA 17  • 🏃 9ft  [📄] │   + Hero Action Dock
│                                                             ├──────────────────────────┤
│                                                             │ 💬 Chat / Log / Grupo    │
│                                                             │                          │
│                      CANVAS 3D / MAPA                       │                          │
│                     (IMERSÃO TOTAL)                         │                          │
│                                                             │                          │
│                                                             ├──────────────────────────┤
│ [📷 Tática ▾]                                  [🧭 Bússola] │ [Norm][Vant][Desv] [🎲]  │
└─────────────────────────────────────────────────────────────┴──────────────────────────┘
```

---

## 🚀 Fases de Implementação

### 🔹 Etapa 1: Refatoração e Fusão do Header Triplo em Header Unificado (48px)
- **Arquivo Alvo:** [`components/PlayerLobby.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/PlayerLobby.tsx)
- **Ações:**
  1. **Unificar as 3 barras superiores** em um único componente de topo com altura fixa de `h-12` (48px) e backdrop blur.
  2. **Esquerda:** Botão Voltar (`ArrowLeft`), Badge/Título da Mesa compacto com Tooltip do Código de Convite de 1-toque, e Widget de Calendário/Horário compacto.
  3. **Centro:** Seletor de visualização em *Segmented Control* integrado: `[Auto | Ilustração | Mapa 2D | Grid 3D]`.
  4. **Direita:** Indicador de Presença (Avatars), Ícone de Voz (`Call` com status dinâmico), Botão `Crônicas` (com badge de notificações), Botão `Safety Tools (X-Card)` e Menu Dropdown/Popover para ações secundárias (`Modo TV`, `Sair da Campanha`).
  5. **Remover duplicações:** Eliminar o botão redundante de "Ficha" do header (mantendo o acesso na Hero Dock do personagem).

---

### 🔹 Etapa 2: Redesenho do Combat Tracker & Player Token Action Dock
- **Arquivos Alvo:** 
  - [`components/PlayerCombatTrackerHUD.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/PlayerCombatTrackerHUD.tsx)
  - [`components/PlayerTokenActionDock.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/PlayerTokenActionDock.tsx)
- **Ações:**
  1. **Combat Tracker como Overlay Flutuante:** Posicionar a barra de iniciativa em camada translúcida (*glassmorphism*) sobre o topo do Canvas, sem empurrar o layout para baixo.
  2. **Scroll Horizontal Fluído (*Touch Carousel*):** Suporte nativo a *touch drag*, setas de navegação discretas e eliminação da sobreposição do botão "Aguardando Turno".
  3. **Card do Kirion (Hero Dock):**
     - Otimizar os seletores de **Ação, Ação Bônus, Reação e Deslocamento** para botões com tamanho mínimo de `44px × 40px` (padrão WCAG touch target para tablets).
     - Barra de PV dinâmica mais visível com feedback visual de dano/cura.
     - Botão de abertura da Ficha Completa integrado diretamente no cabeçalho do card do personagem.

---

### 🔹 Etapa 3: Layout Responsivo, Gaveta Retrátil (Drawer) e Controles Flutuantes
- **Arquivo Alvo:** [`components/PlayerLobby.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/PlayerLobby.tsx)
- **Ações:**
  1. **Sidebar Retrátil Inteligente (*Collapsible Drawer*):**
     - Em telas de Tablet (< 1200px ou ao tocar no toggle), permitir recolher a sidebar lateral para um botão flutuante discreto com badge de mensagens não lidas.
     - No modo recolhido, o Canvas 3D assume **100% da largura e altura**.
     - Abertura suave como *Drawer lateral* com backdrop blur sem quebrar o contexto 3D.
  2. **Bandeja de Dados e Rolagens Ergonômica:**
     - Posicionamento da barra de rolagem (`Norm / Vant / Desv`, `/roll`, `/gmroll`) acessível pelo polegar no tablet.
  3. **Ajuste dos Controles de Câmera 3D:**
     - Reposicionar os botões de câmera (*Tática / Cinemática / Top-Down*) para um menu *floating pill* no canto inferior esquerdo do canvas, evitando qualquer choque com a iniciativa.

---

## 🧪 Plano de Verificação e Testes

| Teste | Critério de Aceitação |
|---|---|
| **Altura Vertical no Tablet** | O Canvas 3D deve ocupar pelo menos 75% da altura total da tela em resoluções `1024x768` e `1280x800`. |
| **Touch Target Size** | Nenhum botão interativo primário (ações, rolagens, abas) deve ter altura inferior a `40px`. |
| **Toggle da Sidebar** | O colapso e expansão da sidebar devem ser suaves (`transition-transform duration-300`) sem recarregar o canvas WebGL 3D. |
| **Tracker de Iniciativa** | Todos os combatentes devem ser visíveis através de scroll horizontal por toque sem corte visual de texto. |
| **Build & Typecheck** | Executar `npm run build` ou validação do TypeScript sem nenhum erro de tipagem. |

---

## 📌 Próximos Passos
- Revise o plano acima.
- Para iniciar a codificação e execução do plano, execute `/create` ou confirme o início da **Etapa 1**.
