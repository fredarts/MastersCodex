# Plano de Aprimoramento: Layout Tablet & Sistema Astral de Eclipses e Conjunções

**Documento:** `docs/PLAN-tablet-astral-calendar.md`  
**Status:** Proposta & Brainstorming (Socratic Gate)  
**Especialistas:** `@project-planner`, `@frontend-specialist`, `@game-developer`

---

## 🌟 1. Visão Geral do Objetivo

Aprimorar a experiência do **Campaign Calendar Studio** para visualização perfeita em **Tablets (ex: Galaxy Tab S4 1138×712, iPad 1024×768 / 1194×834)** eliminando o scroll vertical indesejado, e introduzir um ecossistema astronômico imersivo e lúdico estilo *Astrolábio Fantástico de RPG*.

---

## 📐 2. Otimização de Layout para Tablet (Zero-Scroll Viewport 1138×712)

### Diagnóstico da Imagem Atual:
- **Header & Sub-header:** Ocupam cerca de 130px de altura vertical (Menu superior, Seletor de mundo, Tabs e Botões de Ação).
- **Grid Calendário (Harptos 10 colunas):** 10 dias por linha × 3 a 4 linhas de dias. Os cards de dias têm padding alto e fontes grandes, empurrando o final da tela para além dos 712px.
- **Sidebar Direita:** Cartões de Data Atual, Luas e Marés ocupam espaço vertical excessivo com espaçamentos folgados.

### Soluções de UI/UX Responsiva:
1. **Layout Compacto em Grade de Altura Fixa (`h-screen` / `max-h-[calc(100vh-...)]` com Flex/Grid):**
   - Header unificado e ultra-otimizado (reduzindo altura de 130px para ~78px).
   - Day-cards auto-ajustáveis com `aspect-[1/1]` ou `h-full min-h-0` para caber todas as semanas perfeitamente no container.
   - Ícones de fase lunar e marcadores de eventos em micro-badges elegantes sem quebrar altura.
2. **Sidebar Direita Dinâmica / Retrátil:**
   - Em tablets, permitir colapsar ou usar mini-cards condensados de alta densidade informativa (Data, Relógio de Sol/Lua analógico, Marés).
3. **Nova Barra de Abas Unificada:**
   - `[📅 Grade Mensal]`
   - `[📜 Crônica & Linha do Tempo]`
   - `[🌌 Observatório Astral (Orrery 2D/3D)]` *(NOVO)*
   - `[✨ Eclipses & Conjunções]` *(NOVO)*
   - `[☕ Descanso]` | `[⏱️ Avanço]` | `[⚙️ Config]`

---

## 🪐 3. Nova Aba: Observatório Astral (Orrery Interativo Dia a Dia)

Uma visão visualmente deslumbrante no estilo **Astrolábio Mecânico D&D / Planetário Arcano**:

1. **Astrolábio Interativo (Canvas / SVG Animado):**
   - Centro: O Mundo da Campanha (ex: Valíria / Toril) com anel dia/noite.
   - Órbitas Concéntricas: Sol Dourado e múltiplas Luas (Selûne, Lágrimas de Selûne, luas customizadas de cada mundo).
   - Constelações do Zodíaco girando no anel exterior de acordo com o mês/estação.
2. **Controle de Tempo Interativo (Scrubber / Timeline Dial):**
   - Slider e botões estilo "Player de Mídia Celestial" (`◀◀ -10d`, `◀ -1d`, `▶ Play Tempo (Animação Fluida)`, `+1d ▶`, `+10d ▶▶`).
   - Ao avançar o tempo ou arrastar o dial, o astrolábio gira os corpos celestes em tempo real com efeitos de brilho estelar e trilhas de luz (*orbital trails*).
3. **Visão do Céu Local (Cúpula Celestial):**
   - Alternância entre "Visão Heliocêntrica/Geocêntrica (Astrolábio)" e "Visão do Horizonte do Aventureiro (O que os personagens veem ao olhar para o céu esta noite)".

---

## 🌑 4. Nova Aba: Eclipses & Conjunções Celestiais (Game-like & Místico)

Uma experiência altamente lúdica, com animações ricas estilo cutscene / mini-game de RPG:

1. **Simulador e Detector de Fenômenos Celestiais:**
   - **Eclipse Solar Total / Anular:** O Sol é encoberto pela Lua, o céu escurece gradualmente, surge a coroa solar flamejante (*corona effect* com partículas).
   - **Eclipse Lunar (Lua de Sangue / Véu de Sombra):** A lua mergulha no cone de sombra do planeta, adquirindo tom carmesim ardente com névoa arcana.
   - **Conjunção Lunar (Beijo das Luas):** Duas ou mais luas se sobrepõem ou alinham no céu noturno.
   - **Alinhamento dos Planos / Grande Convergência (Syzygy Máxima):** Alinhamento perfeito do Sol, todas as Luas e Constelações Regentes.
2. **Previsor de Eclipses (Radar Astrológico do Mestre):**
   - Lista os próximos grandes eventos astronômicos dos próximos 1 a 10 anos in-game.
   - Botão *"Viajar no Tempo até Este Evento"* para teletransportar o calendário direto para o dia da conjunção.
3. **Tabela de Efeitos Arcanos & Presságios (Lore & Gameplay Hooks):**
   - Durante eclipses solares: Magias de Necromancia e Trevas +2 DC; luzes mágicas enfraquecidas; monstros das profundezas emergem.
   - Durante Lua de Sangue: Licantropos não conseguem reverter a transformação; rituais de sangue custam metade dos componentes.
   - Durante Conjunção Cósmica: Portais para os Planos Exteriores se abrem espontaneamente; marés gigantescas.

---

## 🎨 5. Design System & Estética Visual (UI-UX Pro Max)

- **Paleta de Cores Mística & Nobre (Sem Roxo/Violeta):**
  - **Fundo Base:** `#090d16` (Deep Midnight Obsidian) com detalhes em `#111827`.
  - **Dourado Solar & Astrolábio:** `#f59e0b`, `#fbbf24`, `#d97706` com glow sutil.
  - **Ciano Astral & Prateado Lunar:** `#38bdf8`, `#7dd3fc`, `#e0f2fe`.
  - **Rubi do Eclipse (Lua de Sangue):** `#ef4444`, `#dc2626`, `#991b1b`.
- **Efeitos Visuais:**
  - Animações CSS GPU-accelerated & Canvas leve para partículas estelares.
  - Glassmorphism refinado (`backdrop-blur-md`, bordas douradas sutis `border-amber-500/20`).
  - Fontes temáticas: Cabeçalhos com visual rúnico/serifado clássico e números tabulares monospaçados para relógios.

---

## ❓ 6. Socratic Gate (Perguntas Estratégicas para o Usuário)

1. **Modos de Órbita e Luas:** O seu mundo (Valíria) possui 1 única lua (como Selûne) ou você deseja suporte nativo a 2 ou mais luas orbitando em velocidades diferentes para criar conjunções mais frequentes?
2. **Interação com a Campanha:** Gostaria que eventos astronômicos (como um Eclipse) criem automaticamente uma anotação na "Linha do Tempo / Crônica" da campanha com um clique?
3. **Formato da Animação do Eclipse:** Prefere uma visão no estilo **Planetário/Astrolábio giratório** onde você vê o alinhamento de cima, ou uma **Câmera Cinemática de Céu** (onde você assiste o sol/lua se sobrepondo no horizonte), ou um toggle entre os dois?
