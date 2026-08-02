# Plano de Implementação - Mecanismos de Masmorra & Passagens Avançadas

Este plano especifica a arquitetura técnica e o fluxo de interação para adicionar **Gatilhos Interativos (Alavancas, Botões, Placas de Pressão)**, **Grades de Ferro (Portcullis)** e **Paredes Ilusórias (False Walls)** ao **Dungeon Map Maker** e ao **Live Cockpit**.

---

## 📐 1. Arquitetura de Dados & Modelagem

### 1.1 Extensão de `TileType` e Interfaces (`MapMaker.tsx`)
Adicionar novos tipos de terreno e configurações de célula:

```typescript
export type TileType = 
  | 'floor' 
  | 'wall' 
  | 'grass' 
  | 'water' 
  | 'door' 
  | 'trap' 
  | 'chest' 
  | 'stash'
  | 'trigger'          // 🕹️ Alavancas, Botões, Correntes
  | 'portcullis'       // ⛓️ Grades de Ferro (visão livre, bloqueio de movimento)
  | 'illusion_wall';   // 🌫️ Parede Ilusória / Falsa

// Configuração de Gatilhos / Mecanismos
export type TriggerType = 'lever' | 'pressure_plate' | 'chain' | 'button';
export type TriggerState = 'inactive' | 'active';

export interface TriggerConfig {
  id: string;                    // ID único do gatilho (ex: "lever-sala-1")
  targetId: string;              // ID do alvo acionado (ex: "grade-sala-2")
  triggerType: TriggerType;
  state: TriggerState;           // 'inactive' (desativada/aberta) ou 'active' (acionada)
  name: string;                  // Ex: "Alavanca de Bronze Enferrujada"
  isSecret?: boolean;            // Oculta (ex: tijolo falso/botão escondido)
  detectDC?: number;             // CD Investigação para achar o botão
  revealedToPlayers?: boolean;
  description?: string;          // Feedback descritivo (ex: "Um clique ecoa no corredor...")
}

// Configuração de Grades de Ferro (Portcullis)
export interface PortcullisConfig {
  id: string;                    // ID para conexão com alavancas
  status: 'closed' | 'open';     // 'closed' = baixada (bloqueia andar, permite ver)
  liftDC?: number;               // CD de Atletismo/Força para erguer manualmente
  material?: 'iron' | 'reinforced' | 'bone' | 'wood_bars';
  name?: string;
}

// Configuração de Parede Ilusória
export interface IllusionWallConfig {
  id?: string;
  detectDC: number;              // CD Investigação para perceber a ilusão
  revealedToPlayers: boolean;    // Revelada aos jogadores
  blocksLight: boolean;          // Se a ilusão parece sólida bloqueando luz até ser revelada
  description?: string;
}
```

Atualização da interface `Cell`:
```typescript
export interface Cell {
  x: number;
  y: number;
  type: TileType;
  fog?: boolean;
  tokenName?: string;
  tokenColor?: string;
  doorConfig?: DoorConfig;
  trapConfig?: TrapConfig;
  chestConfig?: ChestConfig;
  triggerConfig?: TriggerConfig;           // [NOVO]
  portcullisConfig?: PortcullisConfig;     // [NOVO]
  illusionWallConfig?: IllusionWallConfig; // [NOVO]
}
```

---

## ⛓️ 2. Regras de Visão (LOS) & Movimento de Tokens

### 2.1 Linha de Visão e Iluminação (`visionCore.ts`)
* **Grades de Ferro (`portcullis`)**:
  * `isCellBlockingVision`: Retorna `false`! Mesmo com a grade fechada (`status === 'closed'`), a luz e a visão dos jogadores e monstros atravessam livremente as barras de ferro.
* **Paredes Ilusórias (`illusion_wall`)**:
  * Quando `revealedToPlayers === false` e `blocksLight === true`: Bloqueia visão normalmente (parece pedra maciça).
  * Quando `revealedToPlayers === true`: Transparente para quem conhece a ilusão.

### 2.2 Física de Movimentação no Grid (`DysonCanvas.tsx`)
* **Grades Fechadas**:
  * Ao arrastar tokens, `portcullis` com `status === 'closed'` bloqueia o movimento de entrada na célula.
  * Quando `status === 'open'`, o movimento é livremente permitido.
* **Paredes Ilusórias**:
  * Tokens podem atravessar paredes ilusórias a qualquer momento (permitindo ao mestre simular o jogador passando acidentalmente ou voluntariamente pela parede falsa).

---

## 🕹️ 3. Sistema de Conexão e Ativação de Triggers

### 3.1 Acionamento em Cadeia (Linking por ID)
* Quando o Mestre clica na alavanca no Canvas ou no Cockpit:
  1. Alterna o estado da alavanca (`'inactive'` ⇄ `'active'`).
  2. Varre o `grid` procurando células com `portcullisConfig.id === targetId` ou `doorConfig.id === targetId` ou `illusionWallConfig.id === targetId`.
  3. Alterna o status do alvo:
     * Portcullis: `'closed'` ⇄ `'open'`.
     * Portas conectadas: `'closed'` ⇄ `'open'`.
     * Paredes ilusórias: Revela a ilusão aos jogadores.
  4. Exibe notificação tática no Cockpit (ex: *"⚙️ Alavanca Sala A acionada → Grade de Ferro #1 erguida!"*).

---

## 🎨 4. Renderização Dyson Logos & Canvas

### 4.1 Funções Procedurais (`dysonCore.ts`)
1. **`drawPortcullisHachure`**:
   * Grade de ferro hachurada com barras verticais espaçadas e pontas afiadas no estilo Dyson Logos nanquim.
   * Estado Aberto vs Fechado com linhas pontilhadas de recolhimento no teto.
2. **`drawTriggerHachure`**:
   * Alavanca com base de suporte de pedra e haste inclinada (esquerda para inativo, direita para ativo).
   * Placa de pressão com contorno sutil de losango central.
3. **`drawIllusionWallHachure`**:
   * DM View: Parede com padrão de hachura pontilhada e runa sutil indicando falsidade.
   * Player View: Idêntica a uma parede de pedra sólida regular.

---

## 🎛️ 5. Modais de Configuração & UI de Cockpit

1. **Modal de Edição de Gatilhos (`Trigger Modal`)**:
   * Seletor de Tipo (Alavanca 🕹️, Botão 🔘, Placa de Pressão 🦶, Corrente ⛓️).
   * Campo de Target ID com autocomplete de IDs existentes no mapa.
   * Botão de Teste Rápido ("Acionar / Testar Mecanismo").
   * CD de Investigação para gatilhos secretos.
2. **Modal de Edição de Grade de Ferro (`Portcullis Modal`)**:
   * ID da Grade (ex: `grade-norte`).
   * Estado (Erguida / Baixada).
   * CD Força / Atletismo para erguer manualmente.
3. **Modal de Parede Ilusória (`Illusion Wall Modal`)**:
   * CD Percepção/Investigação Passiva.
   * Toggle Revelar aos Jogadores.

---

## 📋 6. Checklist de Tarefas

- [ ] 1. Extensão de Tipos e Interfaces em `MapMaker.tsx` (`trigger`, `portcullis`, `illusion_wall`)
- [ ] 2. Ajustes no motor de visão em `visionCore.ts` (portcullis transparente à luz)
- [ ] 3. Implementação de `drawPortcullisHachure`, `drawTriggerHachure` e `drawIllusionWallHachure` em `dysonCore.ts`
- [ ] 4. Lógica de ligação e disparo por ID em `DysonCanvas.tsx`
- [ ] 5. Modais de edição e atalhos táteis de acionamento
- [ ] 6. Hover tooltip de mecanismos no Cockpit
