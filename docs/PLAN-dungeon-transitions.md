# PLAN: Transições de Níveis da Masmorra e Pontos de Spawn (Dungeon Transitions)

> **Status:** Proposto / Em Planejamento  
> **Comando:** `/plan`  
> **Slug:** `PLAN-dungeon-transitions.md`

---

## 🎯 Visão Geral
Criar um sistema de **Transições de Níveis da Masmorra** (Escadas, Portas de Nível, Alçapões e Portais) no **MapMaker** e no **Live Cockpit**, permitindo:
1. Marcar células como pontos de saída/entrada para outros andares (`transitionConfig`).
2. Definir o **ponto de spawn exato** (coordenadas ou raio) onde os tokens chegam no outro nível.
3. Permitir que o Mestre clique na escada ou arraste um personagem para ela para acionar a transição imediata do grupo ou de um aventureiro individual para o novo andar.

---

## 📐 Estrutura Técnica

### 1. Extensão do Modelo de Célula e Tipos (`lib/types.ts` & `MapMaker.tsx`)
```typescript
export type TransitionType = 'stairs_down' | 'stairs_up' | 'ladder' | 'portal' | 'doorway';

export interface DungeonTransitionConfig {
  id: string;
  name: string;
  type: TransitionType;
  targetLevelId: string;
  targetSpawnR?: number;
  targetSpawnC?: number;
  linkedTransitionId?: string;
  status?: 'open' | 'locked' | 'blocked';
  lockpickDC?: number;
  description?: string;
}
```

### 2. Renderização Dyson (`DysonCanvas.tsx`)
- Desenho vetorial no estilo clássico Dyson/blueprint para:
  - Degraus com setas direcionais (`stairs_down`, `stairs_up`).
  - Escada de mão / alçapão (`ladder`).
  - Círculo rúnico arcano (`portal`).
- Indicador flutuante de destino com badge `↳ [Nome do Andar Destino]`.

### 3. Modal de Configuração no MapMaker e Cockpit
- Modal tático para configurar o nome da passagem, o andar de destino e o ponto de chegada.
- Opção para criar automaticamente a escada correspondente no nível de destino (elo bidirecional).

### 4. Ações no Cockpit (`CockpitDungeonMap.tsx`)
- Menu de ação ao clicar na escada:
  - `🚀 Enviar Todo o Grupo`
  - `👤 Enviar Personagem Selecionado`
  - `👁️ Mudar Visão para Andar de Destino`
- Ao soltar um token sobre a escada: pergunta se deseja transportar o personagem/grupo para o andar vinculado.

---

## 📋 Próximos Passos
1. Validar as decisões de UX com o usuário.
2. Executar a implementação dos tipos, modal e renderização no DysonCanvas.
3. Integrar ações de teleporte e transição de spawn no Cockpit.
