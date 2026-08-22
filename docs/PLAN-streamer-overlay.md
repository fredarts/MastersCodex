# PLAN-streamer-overlay.md - Streamer Mode / Overlay OBS

> **Status:** 🎯 Planejado  
> **Impacto:** ⭐⭐⭐ (Alto valor de marketing orgânico e engajamento para transmissões ao vivo)  
> **Complexidade:** Baixa-Média  
> **Rota Principal:** `/overlay`  
> **Chave de sincronização:** `useRealtimeSync` / Supabase Realtime Channel (`campaign:{campaignId}`)

---

## 📌 1. Visão Geral & Objetivo

Criar uma rota dedicada e ultra-leve `/overlay` projetada especificamente para ser consumida como **Browser Source** em softwares de streaming (OBS Studio, Streamlabs, Twitch Studio, vMix).

### Principais Benefícios:
1. **Fundo 100% Transparente (`bg-transparent`)**: Permite sobrepor qualquer cena de câmera, tabuleiro ou layout sem alterar a composição do streamer.
2. **Sincronização em Tempo Real com Zero Autenticação Pesada**: O streamer pode passar apenas o `campaignId` e uma chave pública ou token de visualização via Query Params, ou reutilizar a sessão pública da campanha.
3. **Módulos / Widgets Totalmente Customizáveis**:
   - 🎲 **Dice Roll HUD**: Alerta animado de rolagens (D20, dano, vantagem/desvantagem, Destaque Nat 20 / Nat 1) que surge na tela com efeito visual e some após 6-8s.
   - ⚔️ **Initiative Turn Tracker**: Barra/Ticker de iniciativa mostrando o turno atual, próximo jogador, contagem de rodadas e avatares.
   - 🏰 **Scene & Atmosphere Banner**: Card cinematográfico que exibe o nome da cena projetada, clima (chuva, noite, névoa) e texto sensorial.
   - 💬 **Live Chat / In-Character Bubble**: Balão de fala ou mensagens de interpretação (*In-Character*) dos personagens.
4. **Filtro de Privacidade & Anti-Spoiler (DM Safe)**:
   - Rolagens marcadas como `isSecret` ou `visibility === 'gm_only'` **NUNCA** são renderizadas no overlay.
   - Monstros ou combatentes ocultos (`revealedToPlayers: false`) não aparecem na barra de iniciativa.

---

## 🏗️ 2. Arquitetura da Solução

```mermaid
flowchart TD
    A[Mestre / Jogador no Live Cockpit] -->|Dispara Rolagem / Troca Turno / Troca Cena| B[useRealtimeSync / Supabase Broadcast]
    B -->|Canal: campaign:id| C[/overlay?campaignId=XYZ&widgets=dice,combat,scene&theme=fantasy&align=bottom-right]
    C --> D[OverlaySyncEngine Hook]
    D --> E[Widget: DiceRollAlert]
    D --> F[Widget: CombatTrackerBar]
    D --> G[Widget: SceneAtmosphereCard]
    D --> H[Widget: ChatBubbleTicker]
```

---

## 🎨 3. URL Parameters & Customização no OBS

O overlay aceitará parâmetros na URL para permitir flexibilidade total no OBS sem necessidade de interagir com o navegador do OBS:

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `campaignId` | `string` | *(Obrigatório)* | ID da campanha a sincronizar |
| `widgets` | `string` (csv) | `dice,combat,scene` | Quais widgets exibir (`dice`, `combat`, `scene`, `chat`) |
| `theme` | `string` | `obsidian` | Tema visual (`obsidian`, `gold`, `minimal`, `cyberpunk`) |
| `combatLayout`| `string` | `horizontal` | Formato do tracker de iniciativa (`horizontal`, `vertical`, `compact`) |
| `showHp` | `boolean` | `false` | Se exibe a barra/valor numérico de vida dos combatentes |
| `diceDuration`| `number` | `7000` | Tempo em milissegundos que o card de rolagem fica visível |
| `align` | `string` | `bottom-center` | Alinhamento do container (`top-left`, `top-right`, `bottom-left`, `bottom-right`, `bottom-center`) |
| `scale` | `number` | `1.0` | Fator de escala da UI (ex: `0.8`, `1.2` para telas 1080p ou 4K) |

---

## 🧩 4. Estrutura de Arquivos e Componentes

```
app/
└── overlay/
    ├── page.tsx                     # Rota Next.js SSR-safe para o Browser Source
    ├── layout.tsx                   # Layout com background transparente forçado e viewport limpo
components/
└── overlay/
    ├── StreamerOverlayContainer.tsx # Container orquestrador, escala e alinhamento
    ├── widgets/
    │   ├── OverlayDiceAlert.tsx     # Animação de rolagem de dados (Nat20 glow, Nat1 glitch)
    │   ├── OverlayCombatTracker.tsx # Ticker de iniciativa horizontal/vertical
    │   ├── OverlaySceneBanner.tsx   # Título da cena, clima e iluminação
    │   └── OverlayChatFeed.tsx      # Mensagens IC (In-Character) e sussurros públicos
    └── config/
        └── StreamerOverlayModal.tsx # Modal no Live Cockpit para o Mestre configurar e copiar o link OBS
lib/
└── hooks/
    └── useStreamerOverlaySync.ts    # Hook lightweight para conectar ao canal Realtime da campanha
```

---

## 📋 5. Tarefas de Implementação

### Fase 1: Fundação & Sincronização em Tempo Real (`lib/hooks/useStreamerOverlaySync.ts`)
- [ ] Criar hook leve que subscreve ao canal Supabase `campaign:{campaignId}` sem requerer login de usuário.
- [ ] Implementar handlers para os eventos:
  - `DICE_ROLL` & `DICE_3D_BURST`: Adicionar rolagem à fila com auto-dismiss com timeout configurável.
  - `COMBAT_UPDATE`: Atualizar lista de combatentes (filtrando monstros ocultos).
  - `LIVE_PROJECTION_UPDATE`: Atualizar cena e clima atual.
  - `CHAT_MESSAGE`: Exibir falas de interpretação (`channel === 'ic'`).
- [ ] Implementar fila de animação para múltiplos dados rolados em sequência (combo de ataques).

### Fase 2: Componentes dos Widgets Visuais (`components/overlay/widgets/`)
- [ ] **`OverlayDiceAlert.tsx`**:
  - Exibir Avatar + Nome do Jogador.
  - Título do teste / ataque / magia.
  - Efeito visual de Crítico (Dourado/Partículas) e Falha Crítica (Vermelho/Cinza).
  - Animação de entrada `framer-motion` (slide-in / spring) e saída fluida.
- [ ] **`OverlayCombatTracker.tsx`**:
  - Layout horizontal (estilo card game/RPG de console) ou vertical.
  - Destaque vibrante no combatente do turno atual (com badge "TURNO ATUAL" e contagem de rodada).
  - Mini-cards para os próximos na ordem de iniciativa.
- [ ] **`OverlaySceneBanner.tsx`**:
  - Título da cena com tipografia estilizada de fantasia.
  - Ícone e indicador de clima (Ex: 🌧️ Chuva Torrencial • 🌙 Noite).

### Fase 3: Rota e Layout Transparente (`app/overlay/`)
- [ ] Criar `app/overlay/layout.tsx` com `html, body { background: transparent !important; overflow: hidden; }`.
- [ ] Criar `app/overlay/page.tsx` lendo searchParams via `useSearchParams()`.
- [ ] Suporte a `scale` CSS transform para ajuste fácil em resoluções 720p/1080p/1440p/4K no OBS.

### Fase 4: Gerador de Links & Preview no Cockpit (`components/overlay/config/`)
- [ ] Criar `StreamerOverlayModal.tsx` acessível via botão "Transmitir / OBS" na barra superior do `LiveCockpitStudio.tsx`.
- [ ] Preview interativo em tempo real com botão de "Testar Rolagem de Dado" e "Testar Alerta de Combate".
- [ ] Opções com switches visuais para marcar/desmarcar widgets e seletor de alinhamento.
- [ ] Botão de "Copiar URL para o OBS" com feedback de toast.

---

## 🔒 6. Segurança & Anti-Spoiler (Regras Críticas)

1. **Rolagens Ocultas do Mestre**: O overlay rejeita imediatamente se `payload.isSecret === true` ou `payload.visibility === 'gm_only'` para nunca vazar testes secretos na stream.
2. **Combatentes Escondidos**: Se `combatant.revealedToPlayers === false` ou `combatant.hidden === true`, o combatente é omitido da barra de iniciativa ou exibido apenas como `???` (configurável).
3. **Notas Secretas de Cena**: Somente o `title` e `sensoryText` público da cena são transmitidos, nunca as notas do DM (`gmNotes`).

---

## 🧪 7. Plano de Verificação

1. **Teste em Navegador Isolado (Simulando OBS)**:
   - Abrir `/overlay?campaignId=test-id&widgets=dice,combat,scene` em uma aba anônima.
   - No Live Cockpit de outra aba, rolar um dado e avançar o turno de combate.
   - Validar se o overlay atualiza instantaneamente (< 150ms).
2. **Teste de Transparência**:
   - Inserir a URL como "Navegador" no OBS Studio e verificar ausência de bordas ou fundo branco/escuro indesejado.
3. **Teste de Rolagens Secretas**:
   - Rolar um dado no modo "Rolagem Oculta (DM)" e confirmar que nenhum alerta aparece no overlay.
4. **Teste de Responsividade & Escala**:
   - Testar com `scale=0.75` e `scale=1.25` para garantir nitidez vetorial.
