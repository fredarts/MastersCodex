# 📜 PLANO MESTRE: Atualização Épica do README — Masters Codex (The Campaign Forge Tool)

## 🎯 1. Visão Geral do Projeto & Propósito
O **Masters Codex** é uma suíte all-in-one de última geração desenvolvida para Mestres (DMs) e Jogadores de D&D 5ª Edição (compatível com regras 2014 & 2024). 
A aplicação combina um **Virtual Tabletop (VTT) Tático 2D & 3D em Three.js**, **Live Cockpit em tempo real**, **Assistente IA Multimodal (Google Gemini 2.0)**, **Worldbuilder Studio com Grafos e Linha do Tempo**, **Sistema de Comércio Dinâmico (Baldur's Gate 3 inspired)**, **Ficha de Personagem Mobile-First**, **Modo TV de Mesa / Overlay para Streaming** e **PWA Companion com Voz WebRTC e Notificações Push**.

---

## 🏛️ 2. Mapeamento Arquitetural & Funcionalidades do Código

A análise profunda do código (`lib/`, `components/`, `app/`, `context/`, `lib/__tests__/`) identificou os seguintes subsistemas consolidados:

### 🎲 Módulo I: Virtual Tabletop (VTT) Tático 2D & 3D
- **Engine 3D/2D Híbrida (`BattleGrid3D.tsx`, `lib/3d-*.ts`)**: Renderizador Three.js com controle de câmera orbital/tática, grids ajustáveis (quadrado/hex), elevações, paredes e colunas 3D.
- **Iluminação Dinâmica & Linha de Visão (LOS)**: Algoritmo de Raycasting e Oclusão 2D/3D (`visionCore.ts`, `dynamic-lighting-fog.ts`), visão no escuro (Darkvision), tochas e auras circulares dinâmicas (`auraEngine.ts`).
- **Névoa de Guerra (Fog of War)**: Névoa volumétrica e estática com revelação progressiva e controle do mestre.
- **Simulador de Física de Dados 3D (`Dice3DCanvas.tsx`, `lib/dice-physics/`)**: Rolagens 3D realistas de d4, d6, d8, d10, d12, d20 e d100, com detecção de Acertos Críticos e efeitos de partículas/confetes.
- **Gerador Procedural Dyson Map & Map Maker (`MapMaker.tsx`, `dungeonParser.ts`)**: Criação automática de masmorras procedurais e suporte a living battlemaps (vídeos e WebGL).
- **Ferramentas Táticas & Spells AoE**: Cones, esferas, cubos, cilindros e linhas de projéteis balísticos (*Ranged Attack Splines*).
- **Gestão de Tokens & Mecanismos**: Tamanhos de criatura (Médio, Grande, Enorme, Descomunal), elevações dinâmicas, portas interativas (abertas/fechadas/trancadas) e armadilhas.

### 🧙‍♂️ Módulo II: DM Live Cockpit & Session Studio
- **Live Cockpit em Tempo Real (`LiveCockpitStudio.tsx`, `context/LiveCockpitContext.tsx`)**: Central de comando do mestre com controle instantâneo de combate, iniciativa dinâmica, HP, condições de status e relógios de progresso (Progress Clocks).
- **Session Studio & Scene Navigator (`SessionStudio.tsx`, `CreateSceneModal.tsx`)**: Planejamento de sessões em nós de cenas narrativas, notas secretas, gatilhos reativos e slideshow com shaders mágicos (*Magic Shader Slideshow*).
- **Audio Maestro (`AudioMaestro.tsx`, `lib/audio/`)**: Motor de áudio multicanal com Howler.js, trilhas de combate automáticas, ambiência 3D e integração com YouTube/arquivos locais.
- **Projeção em TV & Streaming**:
  - **Modo TV (`/tv`)**: Interface limpa sem spoilers com scaling adaptativo para TVs deitadas na mesa ou monitores secundários.
  - **Streamer Overlay (`/overlay`)**: HUD transparente com cromaqui para OBS Studio, exibindo ordem de iniciativa, HP e rolagens ao vivo para o chat.
- **Omnibar Global (`lib/omnibar-engine.ts`)**: Atalho de teclado `Ctrl+K` para busca instantânea de qualquer monstro, magia, item, cena ou regra da mesa.

### 🌍 Módulo III: Worldbuilder Studio & Módulos Narrativos
- **LoreGraph (`LoreGraph.tsx`)**: Grafo interativo de rede (force-directed) mapeando conexões entre NPCs, facções, locais, segredos e relíquias.
- **Mapa Mundi Interativo (`WorldInteractiveMapView.tsx`)**: Navegação de mapas regionais com alfinetes interativos, dossiers de cidades e encontros georreferenciados.
- **Quadro de Investigação & Conspirações (`investigation/`)**: Corkboard estilo detetive com fotos, notas, pistas e linhas vermelhas conectando evidências.
- **Árvore Genealógica (`family-tree/`)**: Gerador de linhagens familiares nobres, casas reais e brasões heráldicos.
- **Calendário Astral & Clima (`calendarEngine.ts`)**: Gestão de fases da lua, estações, ciclos planetários, passagens de tempo e clima reativo com simulação de chuva e respingos.
- **Merchant Forge (`merchant/`)**: Sistema completo de mercadores inspirado em Baldur's Gate 3, com estoque randômico, raridades, tabela de preços e mecânica de pechincha.
- **Party Loot & Transferência (`loot/`, `item-transfer/`)**: Baús de tesouro compartilhados, divisão automática de moedas e transferências de itens P2P entre jogadores.

### 🛡️ Módulo IV: Player Suite & Mobile Companion
- **Ficha de Personagem D&D 5e (Mobile-First Portrait)**:
  - Layout otimizado tipo aplicativo nativo para smartphones.
  - Automação integral das regras D&D 5e (2014 & 2024): modificadores, salvaguardas, perícias com 3 estados (Normal, Proficiente, Especialista), cálculo de CA e CD de magia.
  - Suporte completo às 12 Classes Oficiais (Guerreiro, Mago, Ladino, Clérigo, Druida, Monge, Bardo, Patrulheiro, Bruxo, Paladino, Bárbaro, Feiticeiro), subclasses, talentos (Feats) e regras de Multiclasse.
  - Wild Shape Tracker para Druidas com fichas de bestas automáticas.
  - Grimório de Magias completo com slots por nível e marcação de magias preparadas.
  - Barra de Combate Rápida Fixa (*Sticky Combat Bar*) com rolagem d20 embutida.
- **Mobile Companion PWA (`/companion`)**: Aplicativo web instalável offline com suporte a Service Worker.
- **Web Push Notifications (`lib/push/`)**: Notificações no celular para o turno do jogador, sussurros secretos do Mestre e distribuição de saques.
- **Voz Integrada WebRTC (`lib/voice/`)**: Canais de voz P2P integrados com áudio espacial e push-to-talk.
- **Importador D&D Beyond (`lib/importers/dndbeyond-importer.ts`)**: Importação de personagens através de arquivos de dados do D&D Beyond.

### 🤖 Módulo V: Inteligência Artificial & Compêndio
- **AI Master Co-Pilot (`@google/genai` Gemini 2.0 / Flash)**:
  - Geração contextual de cenários e descrições de salas.
  - Gerador de NPCs, dinastias, documentos de lore e reviravoltas na trama.
  - Conselheiro tático de monstros em combate (*Monster Tactics AI*).
  - Gerador de Crônicas de Sessão pós-jogo (*Session Chronicle*).
  - Criação de fichas completas de monstros customizados.
- **Compêndio SRD 5.1 Completo**: Banco de dados completo de magias, monstros e centenas de itens mágicos com busca instantânea e filtros avançados.
- **Ferramentas de Segurança de Mesa (Safety Tools)**: Cartão X (*X-Card*) e matriz de Linhas & Véus (*Lines & Veils*) integradas para bem-estar do grupo.

### ☁️ Módulo VI: Infraestrutura, Sincronização & Qualidade
- **Supabase Realtime & PostgreSQL**: Sincronização em tempo real de rolagens, movimentação de tokens e status entre Mestre e Jogadores.
- **Offline First & Cache Resiliente**: Fallback no `localStorage` com resolução de conflitos (CRDT Solver) permitindo que o app rode mesmo sem conexão.
- **Segurança de Banco de Dados**: Políticas RLS (Row Level Security) protegendo dados privados de mestres e fichas de jogadores.
- **Bateria de Testes Abrangente**: Mais de 60 suítes de testes unitários e de integração (`vitest`) cobrindo física, regras de D&D, áudio, rede e performance 3D.

---

## 📸 3. Estrutura do Guia de Capturas de Tela (`docs/screenshots/`)

Será criada a pasta `docs/screenshots/` contendo um `README.md` explicativo e placeholders apontando para os seguintes arquivos de imagem:

| Arquivo de Imagem | Módulo Relacionado | Descrição / Dica de Captura |
| :--- | :--- | :--- |
| `battlegrid-3d.png` | **VTT Tático 3D/2D** | Screenshot do grid 3D com iluminação dinâmica, névoa e tokens em combate. |
| `live-cockpit.png` | **Live Cockpit** | Painel do Mestre em ação com combatentes, dados 3D e controle de cena. |
| `character-sheet-mobile.png` | **Ficha de Personagem** | Visualização da ficha mobile portrait com atributos, magias e barra fixa. |
| `worldbuilder-loregraph.png` | **Worldbuilder Studio** | Visualização do LoreGraph com conexões interativas entre entidades. |
| `merchant-forge.png` | **Comércio (BG3)** | Tela de negociação com mercador, inventário e pechincha. |
| `investigation-board.png` | **Quadro de Investigação** | Quadro de mistério com evidências, cartas e linhas vermelhas conectadas. |
| `tv-overlay.png` | **Modo TV & Streamer** | Exibição da tela limpa para TV de mesa ou do HUD transparente para OBS. |

---

## 🎨 4. Estilo & Tom do Novo README.md
- **Tom de Escrita**: Épico, envolvente, profissional e profundamente enraizado na tradição do RPG de mesa e D&D 5e.
- **Elementos Visuais**: Badges temáticas, divisores estilizados em SVG/Unicode, tabelas comparativas e callouts bem diagramados.
- **Guia do Desenvolvedor**: Instruções claras de clone, configuração `.env.local`, banco Supabase e comandos `npm run dev`, `npm run test` e `npm run build`.
