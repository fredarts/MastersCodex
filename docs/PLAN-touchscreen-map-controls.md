# PLAN-touchscreen-map-controls.md - Suporte Completo a Touchscreen no Dungeon Forge e Cockpit 2D

## 1. Visão Geral e Objetivos

O objetivo deste plano é transformar a experiência de manipulação de mapas 2D (tanto no **Dungeon Forge / MapMaker** quanto no **Live Cockpit 2D Dungeon Map**) em uma experiência tátil de primeira classe para tablets (iPads, tablets Android, Surface e dispositivos touch), replicando 100% das capacidades de mestre disponíveis no mouse/teclado de PC, com gestos naturais (multi-touch, pinch-to-zoom, pan com 2 dedos, arrasto de tokens/POIs com 1 dedo, long-press para ações de contexto/menu radial e réguas táticas adaptadas).

---

## 2. Análise de Lacunas Atuais (PC vs Tablet)

| Funcionalidade no PC | Limitação Atual no Tablet | Solução Touchscreen Planejada |
|---|---|---|
| **Navegação no Mapa (Pan)** | Depende de botão do meio, espaço+arrasto ou ferramenta Pan ativa | **Pan com 2 dedos** a qualquer momento (mesmo com ferramenta de pintura/token ativa), além do Pan com 1 dedo na ferramenta Pan |
| **Zoom no Mapa** | Roda do mouse (Wheel) ou botões HUD | **Pinch-to-zoom nativo com 2 dedos** com ponto focal centrado entre os dedos e limites suaves de 0.05x a 5.0x |
| **Arrastar Tokens / Pinos** | Clique com botão esquerdo + arrasto | **Toque e arraste com 1 dedo** com feedback visual de elevação (shadow/glow), detecção de limiar (>6px) para evitar toques acidentais, e recálculo instantâneo de névoa/visão ao soltar |
| **Arrastar POIs (Portas, Baús, Armadilhas)** | Clique e arrasto do mouse | **Toque e arraste direto com 1 dedo** no POI para reposicionar no grid |
| **Ações Secundárias / Clique Direito (Remover Token, Excluir Luz, Apagar)** | Botão direito do mouse (`e.button === 2`) | **Gesto de Long-Press (Toque longo de ~500ms com anel de progresso visual)** para abrir menu radial/de contexto touch (Excluir Token, Abrir Ficha/Configuração, Apagar Hachura, Remover Luz) + Alternador Rápido na UI touch |
| **Configuração de Célula / Abrir Baú** | Clique simples / duplo clique | **Toque simples em POI** abre modal de inspeção/saque (ou menu de contexto via long press) |
| **Pintura e Névoa (Fog)** | Clique contínuo e arraste do mouse | **Pintura contínua com 1 dedo** com `pointerdown`/`pointermove` sem scroll da página (`touch-action: none`) |
| **Régua Tática (Measure)** | Clique inicial + clique sucessivo / arraste | **Toque no ponto inicial + toques sucessivos ou arrasto guiado** com HUD flutuante com botões de toque grandes (Concluir, Desfazer, Limpar) |
| **Desenho Livre (Lápis, Círculo, Retângulo)** | Mouse drag | **Desenho com 1 dedo / Caneta Stylus (Apple Pencil, S-Pen)** de alta precisão |
| **Ergonomia de Menus e Gavetas** | Menus otimizados para mouse hover/clique pequeno | **Áreas de toque aumentadas (mínimo 44px)**, gaveta de tokens deslizante e barra de ferramentas ergonômica com botão rápido de modo "Lápis / Borracha" |

---

## 3. Arquitetura Técnica da Implementação

### 3.1. Unificação de Ponteiros e Gestos no `DysonCanvas.tsx`
O motor gráfico `DysonCanvas.tsx` passará a utilizar um sistema de gestão de ponteiros unificado:
1. **Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`)**:
   - Rastreamento dinâmico de múltiplos ponteiros (`activePointersMap: Map<number, { x: number, y: number, clientX: number, clientY: number }>`).
   - Diferenciação precisa entre:
     - **0 ponteiros**: Inativo / Idle.
     - **1 ponteiro**: Ação da ferramenta ativa (arrastar token/POI/luz, pintar célula, revelar/cobrir névoa, traçar régua, desenhar com caneta/lápis).
     - **2 ponteiros**: Modo Navegação Livre Universal (Pinch-to-zoom geométrico centrado no baricentro dos dois dedos + Pan bidirecional sem afetar o grid ou disparar ferramentas de desenho).
2. **Sistema de Long-Press (Toque Longo)**:
   - Temporizador de 500ms acionado no `onPointerDown` se 1 único dedo estiver pressionado e o deslocamento for inferior a 8px.
   - Disparo de micro-animação (anel circular de progresso SVG) no ponto de toque.
   - Ação disparada:
     - Sobre Token: Menu radial rápido (Remover Token, Ver Ficha, Mudar Cor, Ocultar).
     - Sobre POI/Porta/Baú: Configurar Célula / Alternar Estado (Abrir/Fechar Porta, Inspecionar Baú).
     - Sobre Luz: Remover Fonte de Luz / Alterar Intensidade.
     - Sobre Célula comum: Ação secundária (Apagar/Pintar parede inversa).
3. **Prevenção de Conflitos do Navegador**:
   - `touch-action: none` garantido no container do canvas para evitar gestos de scroll/zoom nativos do Safari/Chrome mobile.
   - Prevenção de gestos de recarga (pull-to-refresh) do navegador mobile enquanto manipula o mapa.

### 3.2. Integração no Live Cockpit (`CockpitDungeonMap.tsx`)
1. **Gaveta de Tokens Otimizada para Touch**:
   - Suporte a scroll touch suave com inércia (`-webkit-overflow-scrolling: touch`).
   - Botões de seleção de tokens com hitboxes de no mínimo 48x48px com indicação visual de seleção rápida para posicionamento em 1 toque.
2. **Alternador de Ferramentas e Ações Rápidas Flutuante para Tablet**:
   - Botão flutuante de alternância rápida entre "Modo Mão/Navegação" e "Modo Ação/Token".
   - Botão de "Desfazer / Borracha" acessível com o polegar.
3. **Régua Tática no Tablet**:
   - HUD da Régua com botões aumentados e feedback háptico (se suportado pelo navegador via `navigator.vibrate`) e botões claros de "Adicionar Curva", "Concluir Medição" e "Cancelar".

### 3.3. Integração no Dungeon Forge (`MapMaker.tsx` e Sub-Barras)
1. **Adaptação de Sub-barras e Ferramentas**:
   - Sub-barras (`ToolSubBar.tsx`, `MapMakerToolbar.tsx`) com layout responsivo ajustado para tablets na horizontal (landscape) e vertical (portrait).
   - Dropdowns e seletores de tiles/POIs com fechamento automático ao tocar no canvas e áreas de clique confortáveis para os dedos.

---

## 4. Plano de Tarefas Detalhado

### Fase 1: Motor Multi-Touch e Gestos no `DysonCanvas.tsx`
- [ ] Implementar rastreamento de múltiplos ponteiros (`activePointersMap`, contagem de toques ativos).
- [ ] Implementar Pinch-to-Zoom e Two-Finger Pan com pivô no ponto médio dos dois dedos.
- [ ] Implementar rotina de Long-Press (500ms com anel visual animado) para emulação de clique direito/menu de contexto.
- [ ] Implementar detecção inteligente de arrasto de tokens, POIs e luzes com 1 dedo (com tolerância inicial de 6px para diferenciar toque de arrasto).
- [ ] Adaptar ferramentas de desenho (`draw-pencil`, `draw-rect`, `draw-circle`, `draw-eraser`), caixa (`box`) e calibração para eventos de ponteiro touch.

### Fase 2: HUD Touch e Menus Radiais / de Contexto
- [ ] Criar overlay visual de Toque Longo (Radial Progress Indicator / Quick Action Menu).
- [ ] Adaptar o `RulerHUD.tsx` para tamanhos de toque ergonômicos e suporte a toques sucessivos de waypoints sem dependência de teclas de teclado (como Shift ou ESC).
- [ ] Adicionar botão flutuante de atalho Touch (Alternar Mão / Ferramenta e Modo Borracha/Pincel).

### Fase 3: Adaptação de UI do Cockpit e Dungeon Forge
- [ ] Ajustar `CockpitDungeonMap.tsx` (gaveta de tokens, botões de ação de exploração, painel de camadas e filtros de tokens para tablets).
- [ ] Ajustar `MapMaker.tsx`, `MapMakerToolbar.tsx` e `ToolSubBar.tsx` para garantir espaçamento touch de 44px+ e prevenção de toques fantasmas no canvas.

### Fase 4: Testes de Compatibilidade e Verificação
- [ ] Teste unitário e de lógica para cálculos de multi-touch (cálculo de distância euclidiana para pinch, centroide dos dedos para pan).
- [ ] Verificação em dispositivos touch e modo de emulação de toque do navegador (Chrome Touch Emulation / Safari iPad viewport).
- [ ] Validação dos fluxos completos do Mestre: navegação, movimentação de monstros/jogadores, revelação de névoa, portas, armadilhas, réguas e transições de nível.

---

## 5. Critérios de Sucesso
- [x] O Mestre consegue controlar 100% da masmorra em um tablet sem necessidade de mouse ou teclado físico.
- [x] Zoom e Pan com 2 dedos funcionam de maneira fluida e sem travar a ferramenta ativa.
- [x] Movimentação de tokens e pinos responde instantaneamente ao toque de 1 dedo com atualização de linha de visão (LOS).
- [x] Ações secundárias (como remover token ou configurar baú/porta) são acessíveis via Long-Press intuitivo.
- [x] Nenhuma regressão no uso tradicional com mouse e teclado no PC.
