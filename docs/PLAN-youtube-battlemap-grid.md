# PLAN: Suporte a Vídeos do YouTube e Mapas Vivos Animados no Combat Grid 3D

## 1. Visão Geral & Objetivo
Permitir que o Mestre (DM) insira links de vídeos do **YouTube** (e URLs diretas de vídeo MP4/WebM) como textura/fundo animado do chão do **Combat Grid 3D** (Living Battle Maps), mantendo toda a camada 3D (grid tático, miniaturas/tokens, efeitos de clima, blocos 3D, superfícies de terreno e templates de magia) renderizada sobre o vídeo com perfeita interatividade.

Além disso, adiciona:
- **4º Canal de Áudio Dedicado no AudioMaestro** (controle de volume e mute específico para o áudio ambiente do mapa vivo).
- **Catálogo de Presets de Mapas Vivos** (Cachoeira & Ruínas, Floresta Élfica, Masmorra com Lava, Taverna, Navio, etc.).
- **Ferramenta de Calibração & Alinhamento de Grid 1:1** (Escala/Zoom, Deslocamento X/Y, Opacidade e Cor da Linha do Grid) para sobrepor perfeitamente os quadrados do vídeo com o grid do jogo.

---

## 2. Arquitetura em Camadas (Hybrid WebGL Layering)

```
┌─────────────────────────────────────────────────────────────┐
│                      BattleGrid3D (Container)              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. YouTube / Video Underlay Layer (Fundo Animado)      │  │
│  │    - YouTube IFrame API (Autoplay, Loop, Controls=0)  │  │
│  │    - Calibração: Scale Zoom, Offset X/Y, Aspect Ratio │  │
│  │    - Controle via 4º Canal do AudioMaestro            │  │
│  └───────────────────────────────────────────────────────┘  │
│                               ▲                             │
│                               │ (Chão 3D Transparente)      │
│  ┌────────────────────────────┴──────────────────────────┐  │
│  │ 2. Three.js WebGL Canvas Layer (alpha: true)          │  │
│  │    - Grid Helper com Cor e Opacidade Ajustáveis       │  │
│  │    - 3D Tokens / Miniaturas com Sombras               │  │
│  │    - 3D Terrain Surfaces, Blocos, Spells & Clima      │  │
│  │    - Raycasting & Drag-and-Drop de Tokens             │  │
│  └───────────────────────────────────────────────────────┘  │
│                               ▲                             │
│  ┌────────────────────────────┴──────────────────────────┐  │
│  │ 3. BattleControlsToolbar & AudioMaestro (UI)          │  │
│  │    - Seletor de Presets & Input de Link do YouTube    │  │
│  │    - Sliders de Calibração de Grid (Zoom / Offset)    │  │
│  │    - 4º Canal de Volume/Mute do Mapa Vivo             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detalhamento das Etapas

### Fase 1: Utilitários de Vídeo e Catálogo de Mapas Vivos
- `lib/living-battlemaps-catalog.ts`:
  - Parser robusto de links do YouTube (`extractYouTubeVideoId`, `isYouTubeUrl`, `isVideoFileUrl`, `getYouTubeEmbedUrl`).
  - Catálogo de mapas vivos recomendados com thumbnail e dados de áudio ambiente.
- `lib/types.ts`:
  - `VideoGridAlignmentConfig` (escala, offset X/Y, opacidade do grid, cor).

### Fase 2: 4º Canal de Áudio no AudioMaestro & AudioContext
- `context/AudioContext.tsx`:
  - Adicionar `videoMapVolume`, `isVideoMapMuted`, `activeVideoMapUrl` e funções `setVideoMapVolume`, `setIsVideoMapMuted`.
- `components/AudioMaestro.tsx`:
  - Adicionar o 4º canal (BGM, Narração, SFX e **Mapa Vivo / Vídeo**) na dock inferior.

### Fase 3: Componente `YouTubeBattlemapUnderlay.tsx`
- `components/battle-3d/YouTubeBattlemapUnderlay.tsx`:
  - Renderiza o player embed com IFrame API / parâmetros otimizados.
  - Sincronização em tempo real de volume e mute via AudioContext.
  - Aplicação de transformações CSS (`scale`, `translate`) para alinhamento 1:1 com o grid.

### Fase 4: Integração com `BattleGrid3D.tsx`
- Modo transparente do chão quando há mapa em vídeo.
- Personalização de opacidade e cor do `gridHelper` para contraste ideal.

### Fase 5: UI de Calibração na Toolbar (`BattleControlsToolbar.tsx`)
- Seletor de Presets com thumbnails.
- Sliders de Zoom, Offset X/Y e Contraste do Grid.
- Sincronização com sessões multiplayer e visão do jogador.

---

## 4. Checklist de Verificação

- [ ] Inserir link do YouTube carrega o vídeo em loop sem bordas.
- [ ] Presets de mapas vivos carregam com 1 clique.
- [ ] Sliders de Calibração alinham os quadrados do vídeo com o grid do jogo.
- [ ] 4º canal de áudio no AudioMaestro controla o volume do vídeo e o botão de Mute.
- [ ] Miniaturas 3D e templates continuam funcionando perfeitamente sobre o mapa vivo.
- [ ] Sincronização em tempo real para telas de jogadores.
