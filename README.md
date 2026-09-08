<div align="center">

# ⚔️ MASTERS CODEX — THE CAMPAIGN FORGE TOOL ⚔️
### *A Forja Definitiva para Mestres e Jogadores de D&D 5ª Edição*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2_Turbopack-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Engine-049EF4?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_&_Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.0_Flash-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_&_Push-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Vitest](https://img.shields.io/badge/Vitest-60+_Test_Suites-FCC72B?style=for-the-badge&logo=vitest&logoColor=black)](https://vitest.dev/)

<p align="center">
  <b>O Masters Codex</b> é uma suíte completa de engenharia e suporte para mesas de RPG de mesa (TTRPG), unindo um <b>Virtual Tabletop (VTT) Tático 2D/3D em tempo real</b>, <b>Assistente IA com RAG Contextual</b>, <b>Ficha de Personagem Mobile-First Portrait</b>, <b>Worldbuilder Studio com Grafos</b>, <b>Comércio Dinâmico</b>, <b>Modos TV & Streaming</b> e <b>PWA Companion com Voz WebRTC</b>.
</p>

[✨ Funcionalidades](#-funcionalidades-em-destaque) •
[📸 Vitrine Visual](#-vitrine-visual) •
[🎲 Módulos do Sistema](#-módulos-do-sistema) •
[🛠️ Stack Tecnológica](#️-stack-tecnológica) •
[⚡ Instalação & Setup](#-como-executar-o-projeto) •
[🗺️ Arquitetura](#-estrutura-do-projeto) •
[📜 Licença](#-licença)

---

</div>

## 📸 Vitrine Visual

> [!TIP]
> Para adicionar ou atualizar as capturas de tela da plataforma, consulte o guia em [`docs/screenshots/README.md`](docs/screenshots/README.md).

<div align="center">

| 🎲 Virtual Tabletop 3D Tático | 🧙‍♂️ Live Cockpit do Mestre |
| :---: | :---: |
| ![VTT 3D BattleGrid](docs/screenshots/battlegrid-3d.png) | ![Live Cockpit Studio](docs/screenshots/live-cockpit.png) |
| *Grid 3D Three.js com Iluminação Dinâmica e Névoa* | *Painel de Controle em Tempo Real e Gestão de Combate* |

| 🛡️ Ficha Mobile-First Portrait | 🌍 LoreGraph & Worldbuilder |
| :---: | :---: |
| ![Ficha Mobile](docs/screenshots/character-sheet-mobile.png) | ![LoreGraph Studio](docs/screenshots/worldbuilder-loregraph.png) |
| *Layout nativo para smartphones com 12 classes 5e* | *Grafo de conexões entre facções, NPCs e locais* |

| 💰 Merchant Forge (BG3 Style) | 🕵️ Quadro de Investigação |
| :---: | :---: |
| ![Merchant Forge](docs/screenshots/merchant-forge.png) | ![Quadro de Investigação](docs/screenshots/investigation-board.png) |
| *Comércio de itens, estoques vivos e pechincha* | *Mural de mistérios com pistas e fios vermelhos* |

</div>

---

## 🌟 Funcionalidades em Destaque

- 🎲 **VTT 3D/2D Híbrido**: Renderização Three.js fluida com suporte a elevações, paredes, colunas, múltiplos tipos de grids e gerador procedural de masmorras (*Dyson Map*).
- 💡 **Iluminação Dinâmica & Linha de Visão Real (LOS)**: Algoritmo de Raycasting com oclusão de paredes, visão no escuro (*Darkvision*), tochas, auras mágicas e Névoa de Guerra (*Fog of War*) volumétrica.
- 🎲 **Física de Dados 3D**: Rolagens realistas de dados poliédricos (d4 a d100) com detecção automática de Acertos Críticos (*Nat 20*) e efeitos especiais de partículas.
- ⚡ **Live Cockpit em Tempo Real**: Sincronização instantânea via Supabase Realtime entre a tela do Mestre e os jogadores para iniciativas, status, dano e relógios de progresso (*Progress Clocks*).
- 📺 **Modos TV & Streaming**:
  - **Modo TV (`/tv`)**: Painel limpo sem segredos para projeção em mesas deitadas ou monitores secundários com escala adaptativa.
  - **Streamer Overlay (`/overlay`)**: HUD transparente com cromaqui para OBS Studio, exibindo iniciativas e PVs ao vivo.
- 📱 **Ficha de Personagem Mobile-First Portrait**: Experiência fluida para celular com cálculos automáticos de regras D&D 5e (2014 & 2024), 12 classes oficiais com subclasses, talentos (*Feats*), multiclasse, *Wild Shape* de Druida e grimório de magias.
- 📲 **PWA Mobile Companion (`/companion`)**: Aplicativo web instalável offline com Notificações Push (*Web Push*) para turnos/sussurros e canal de voz integrado (*WebRTC P2P*).
- 🌐 **Worldbuilder Studio Completo**: *LoreGraph* (grafo interativo de conexões), Mapa Mundi com alfinetes, Calendário Astral com luas/estações, Clima Reativo com chuva volumétrica, Árvore Genealógica e Quadro de Investigação conspiratório.
- ⚖️ **Merchant Forge & Party Loot**: Sistema de comércio inspirado em *Baldur's Gate 3* com estoques randômicos, pechincha e baús de tesouro compartilhados.
- 🤖 **AI Master Co-Pilot (Gemini 2.0 RAG)**: Geração contextual de cenários, NPCs, fichas de monstros customizados, conselhos táticos em combate e crônicas narrativas pós-sessão.
- 🔍 **Omnibar Global (`Ctrl+K`)**: Busca fuzzy relâmpago por monstros, magias, itens, regras e cenas da campanha.

---

## 🎲 Módulos do Sistema

### 1. ⚔️ Virtual Tabletop (VTT) Tático 2D & 3D
*Engine tática de alta fidelidade visual desenvolvida com Three.js e WebGL.*

- **Grid Tridimensional & Terrenos**: Suporte a grids quadrados e hexagonais, texturas de terreno procedurais, elevações de terreno e estruturas modulares (muralhas, pilares, portas, armadilhas).
- **Linha de Visão (LOS) & Oclusão**: Raycasting em tempo real calculando bloqueio de visão por paredes e portas abertas/fechadas.
- **Iluminação & Auras Dinâmicas**: Tochas com tremulação realista, fontes de luz coloridas, auras circulares de magias (ex: *Spirit Guardians*, *Paladin Auras*) e visão no escuro.
- **Spells AoE & Ranged Attack Splines**: Modelos visuais para cones, esferas, cubos e cilindros de magia com detecção de alvos atingidos, além de arcos de trajetória balística para ataques à distância.
- **Gerador Procedural Dyson Map**: Criação automática de masmorras labirínticas com um único clique e suporte a mapas animados em vídeo.

---

### 2. 🧙‍♂️ DM Live Cockpit & Session Studio
*O centro de comando definitivo para o Mestre planejar e orquestrar sessões sem esforço.*

- **Live Cockpit**: Rastreamento de iniciativas dinâmicas, controle de Pontos de Vida (Dano/Cura rápida), condições de status oficiais da 5e e *Progress Clocks* circulares.
- **Session Studio & Scene Navigator**: Estruturação de sessões em grafos de cenas, notas secretas do mestre, gatilhos automáticos e apresentador de slides com *Magic Shaders* e pergaminhos narrativos.
- **Audio Maestro**: Mesa de som multicanal com Howler.js, incluindo camadas de música ambiente, trilhas de combate dinâmicas, efeitos sonoros 3D posicionais e suporte a áudio customizado e YouTube.
- **Omnibar (`Ctrl+K`)**: Acesso instantâneo a qualquer recurso do universo da mesa através de atalhos rápidos de teclado.
- **Exibição Dedicada (TV & OBS)**:
  - `/tv`: Projeção em tela cheia otimizada para televisores embutidos em mesas de RPG.
  - `/overlay`: Camada de transmissão com fundo transparente ideal para captura de janela no OBS Studio.

---

### 3. 🌍 Worldbuilder Studio & Módulos Narrativos
*Ferramentas profundas para dar vida a mundos ricos, mistérios e civilizações.*

- **LoreGraph**: Visualização em grafo de força interativo conectando NPCs, facções, locais, itens lendários e laços de lore.
- **Mapa Mundi Interativo**: Navegação com zoom de alta resolução, marcadores customizados, dossiers de cidades e encontros regionais.
- **Quadro de Investigação (Corkboard)**: Quadro de cortiça interativo com notas coladas, fotos de suspeitos, evidências e conexões com linhas vermelhas para campanhas de mistério e intriga.
- **Árvore Genealógica (Family Tree)**: Criação de linhagens nobres, árvores de ascendência e heráldica de casas nobres.
- **Calendário Astral & Clima**: Rastreamento de ciclos lunares, estações do ano, passagens de dias e simulação de partículas climáticas (chuva com respingos, neblina volumétrica).
- **Merchant Forge**: Vitrine de comércio no estilo *Baldur's Gate 3*, com cálculo de taxas de câmbio, inventário categorizado e sistema de desconto por carisma/pechincha.
- **Party Loot**: Gestão de saques do grupo, divisão justa de tesouros e transferência direta de itens entre fichas de jogadores.

---

### 4. 🛡️ Player Suite & Mobile Companion
*Ficha de personagem responsiva e aplicativo companheiro projetados para máxima velocidade na mesa.*

- **Ficha Mobile-First Portrait**:
  - Interface moderna estilo app nativo para celular, com abas de Atributos, Perícias, Magias, Equipamentos e Lore.
  - Automação integral das regras D&D 5e: modificadores, bônus de proficiência, testes de resistência, CA, Percepção Passiva e CDs de conjuração.
  - Suporte às 12 Classes Oficiais (*Guerreiro, Mago, Ladino, Clérigo, Druida, Monge, Bardo, Patrulheiro, Bruxo, Paladino, Bárbaro, Feiticeiro*), com subclasses e sistema de Multiclasse.
  - Rastreador de *Wild Shape* com catálogo completo de bestas e estatísticas atualizadas.
  - Grimório de Magias completo com slots por círculo (Truques ao 9º nível) e marcadores de magias preparadas.
  - *Quick Combat Bar Sticky*: Barra fixa inferior com rolagem de d20 integrada e ações de combate de um toque.
- **Mobile Companion PWA (`/companion`)**: Instalável em qualquer dispositivo móvel com funcionamento offline e sincronização em segundo plano.
- **Web Push Notifications**: Alertas no smartphone para chegada do seu turno, avisos secretos do mestre e distribuição de tesouros.
- **Voz Integrada WebRTC**: Canais de comunicação por voz em tempo real diretamente pelo navegador sem dependência de softwares externos.
- **Importador D&D Beyond**: Importação de personagens através de arquivos de dados JSON.

---

### 5. 🤖 AI Master Co-Pilot & Compêndio
*Inteligência Artificial contextual e acervo completo de regras ao alcance de um clique.*

- **AI Co-Pilot (Google Gemini 2.0 / Flash)**:
  - Geração instantânea de ganchos de aventura, descrições de salas e reviravoltas na trama com memória de campanha (RAG).
  - Gerador de NPCs ricos com motivações, segredos e diálogos sugeridos.
  - Conselheiro tático de combate para monstros (*Monster Tactics AI*).
  - Gerador automático de crônicas narrativas pós-sessão (*Session Chronicle*).
  - Criador de fichas completas de monstros customizados fora da SRD.
- **Compêndio SRD 5.1 Oficial**: Catálogo completo e pesquisável de magias, monstros com statblocks interativos e centenas de itens mágicos.
- **Safety Tools**: Cartão X (*X-Card*) e matriz de Linhas & Véus (*Lines & Veils*) com acionamento anônimo e discreto durante a sessão.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias Utilizadas |
| :--- | :--- |
| **Core Framework** | [Next.js 16 (App Router & Turbopack)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Linguagem** | [TypeScript 5.0](https://www.typescriptlang.org/) (Tipagem Estrita em todo o código) |
| **Motor 3D & Gráficos** | [Three.js](https://threejs.org/) + Canvas 2D + WebGL Shaders |
| **Estilização & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) + [Lucide React](https://lucide.dev/) |
| **Banco de Dados & Realtime** | [Supabase](https://supabase.com/) (PostgreSQL, PostgREST API, Realtime WebSockets & RLS) |
| **Inteligência Artificial** | [Google GenAI SDK](https://ai.google.dev/) (`@google/genai` Gemini 2.0 Flash) |
| **Áudio & Multimídia** | [Howler.js](https://howlerjs.com/) (Áudio 3D Espacial & Multicanal) + Web Audio API |
| **Comunicação & PWA** | [WebRTC](https://webrtc.org/) (P2P Voice) + [Web Push](https://web.dev/push-notifications-overview/) + Service Workers |
| **Gerenciamento de Estado** | [Zustand 5](https://zustand-demo.pmnd.rs/) + React Context API |
| **Testes & Qualidade** | [Vitest](https://vitest.dev/) (60+ suítes de teste) + [Playwright](https://playwright.dev/) (E2E) + ESLint 9 |

---

## ⚡ Como Executar o Projeto

### Pré-requisitos
- **Node.js**: `v18.0.0` ou superior (recomendado `v20+`)
- **Gerenciador de Pacotes**: `npm`, `pnpm` ou `yarn`
- **Conta Supabase**: Projeto configurado no [supabase.com](https://supabase.com)

### 1. Clonar o Repositório
```bash
git clone git@github.com:fredarts/MastersCodex.git
cd MastersCodex
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto baseado no `.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-anon-supabase
GEMINI_API_KEY=sua-chave-api-google-gemini
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-chave-publica-vapid-push
VAPID_PRIVATE_KEY=sua-chave-privada-vapid-push
```

### 4. Configurar o Banco de Dados no Supabase
1. Acesse o **SQL Editor** no painel do seu projeto no Supabase.
2. Execute o script principal de banco de dados localizado em [`supabase/schema.sql`](supabase/schema.sql).

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para forjar suas campanhas!

### 6. Executar os Testes Automatizados
```bash
npm run test
```

---

## 🗺️ Estrutura do Projeto

```text
├── app/                  # Rotas Next.js App Router (/tv, /overlay, /companion, /api)
│   ├── api/ai/           # Endpoints de IA (Gemini RAG, táticas de monstros, cenas)
│   ├── companion/        # Rota da PWA Mobile Companion
│   ├── overlay/          # Rota de HUD transparente para streaming (OBS)
│   └── tv/               # Rota de projeção limpa para mesas digitais
├── components/           # Componentes de Interface e Módulos
│   ├── battle-3d/        # Engine Three.js, tokens 3D e iluminação dinâmica
│   ├── calendar/         # Calendário astral e rastreador de tempo/luas
│   ├── character-sheet/  # Ficha de personagem D&D 5e mobile portrait & desktop
│   ├── combat/           # Rastreador de combate e iniciativa
│   ├── investigation/    # Quadro de cortiça de investigações e mistérios
│   ├── live-cockpit/     # Painel de controle em tempo real do Mestre
│   ├── map/              # Map Maker e visualizador de masmorras
│   ├── merchant/         # Sistema de comércio estilo Baldur's Gate 3
│   └── world/            # LoreGraph, Linha do Tempo e Árvore Genealógica
├── context/              # Provedores React Context (Live Cockpit, Áudio, etc.)
├── docs/                 # Documentação arquitetural, planos e screenshots
│   └── screenshots/      # Galeria de imagens do projeto para o README
├── lib/                  # Motores de regras 5e, cálculos, hooks e utilitários
│   ├── __tests__/        # Mais de 60 suítes de testes unitários e de integração
│   ├── auras/            # Motor de auras dinâmicas de tokens
│   ├── dice-physics/     # Simulação de física de dados 3D
│   ├── dnd5e-calculator.ts # Cálculos completos de regras de D&D 5e
│   ├── omnibar-engine.ts # Motor de busca global rápida (Ctrl+K)
│   ├── srd-compendium.ts # Acervo do Compêndio Oficial SRD 5.1
│   └── vision/           # Motor de Raycasting, Oclusão e Névoa de Guerra
├── public/               # Assets estáticos, áudios, texturas 3D e ícones PWA
└── supabase/             # Scripts SQL de schema, migrations e políticas RLS
```

---

## 📄 Licença

Este projeto é distribuído sob os termos da licença [MIT](LICENSE).

---

<div align="center">
  <sub>Forjado com ⚔️, 🎲 e ❤️ pela comunidade de RPG de Mesa!</sub>
</div>
