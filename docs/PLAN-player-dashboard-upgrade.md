# PLAN-player-dashboard-upgrade: Dashboard do Jogador Completo & PlayerView Enriquecida

> **Status:** ✅ Aprovado pelo Usuário | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Next.js, React, TypeScript, Zustand, Supabase Realtime)

---

## 📖 Visão Geral (Overview)

O objetivo é transformar a experiência do jogador de "espectador passivo" para **participante ativo com controle real sobre seu personagem**. Atualmente:

- O `PlayerLobby.tsx` (~905 linhas) tem uma tela de campanha básica com feed e D-Pad do grid 3D.
- O `PlayerViewModal.tsx` (~275 linhas) é uma "TV passiva" — mostra o grid/arte e a fila de iniciativa, mas **sem interatividade de combate**.
- O botão "Tela de Exibição (TV/Discord)" está acessível **fora do contexto de campanha** (no Hub), o que pode gerar confusão sobre qual campanha está ativa.
- Não existe **log de batalha** no lado do jogador.
- Não há **indicador visual de "é sua vez"** com call-to-action.
- O jogador não pode **usar skills/magias** da ficha durante a batalha transmitida.

### O que este plano resolve:

1. **Acesso condicional:** Botão "Tela do Jogador" só disponível dentro do menu da campanha selecionada.
2. **Dashboard de Campanha enriquecido** com widgets de HP, iniciativa ao vivo, condições ativas, e atalhos.
3. **PlayerView interativa:** Log de batalha em tempo real, indicador visual de turno com som + vibração, acesso à ficha completa como modal overlay.
4. **Controle real do personagem:** O jogador pode rolar skills, usar magias, e enviar resultados ao DM via broadcast.

---

## ✅ Decisões Confirmadas pelo Usuário

| # | Decisão | Resposta Confirmada |
|---|---------|-------------------|
| 1 | **Notificação de "Sua Vez"** | ✅ **Som de alerta** (sino medieval) + **Vibração** no celular via `navigator.vibrate()`. Não intrusivo. |
| 2 | **Permissões na ficha** | ✅ **Rolar livremente** + **ajustar HP/slots de magia**, mas **NÃO alterar atributos base** (STR, DEX, etc). |
| 3 | **Scope da ficha no PlayerView** | ✅ **Ficha COMPLETA** (6 abas: Geral, Combate, Perícias, Equipamentos, Magias, RP). Reutilizar o `CharacterSheetModal` existente. |
| 4 | **Broadcast PLAYER_ROLL** | ✅ **Confirmado.** Rolagens do jogador vão para o canal da campanha e aparecem no BattleLog do DM. |
| 5 | **Remoção do botão TV do Hub** | ✅ **Confirmado.** Botão só aparece dentro da campanha selecionada. |
| 6 | **Reutilização do BattleLog com `readOnly`** | ✅ **Confirmado.** Mesmo componente, prop `readOnly` esconde controles do DM. |

---

## 📁 Estrutura de Arquivos Afetados

```plaintext
components/
├── PlayerLobby.tsx                      # [MODIFY] Remover botão TV do Hub, adicionar widgets ao Dashboard
├── PlayerViewModal.tsx                  # [MODIFY] Adicionar BattleLog, Turn Indicator, botão da ficha
├── player-view/                         # [NEW] Nova pasta para sub-componentes do PlayerView
│   ├── PlayerTurnBanner.tsx             # [NEW] Banner animado "É SUA VEZ!" + som + vibração
│   └── PlayerBattleLogPanel.tsx         # [NEW] Wrapper readonly do BattleLog para o lado do jogador
├── BattleLog.tsx                        # [MODIFY] Adicionar prop `readOnly` para esconder botões DM
context/
└── LiveCockpitContext.tsx               # [MODIFY] Adicionar combatLogs, broadcastCombatLogEntry, broadcastPlayerRoll
lib/
├── hooks/
│   └── useRealtimeSync.ts              # [MODIFY] Adicionar canais COMBAT_LOG_ENTRY + PLAYER_ROLL
└── types.ts                             # [MODIFY] Adicionar PlayerRollEvent type
```

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

### Fase 1: Acesso Condicional e Limpeza do Hub
### Fase 2: Dashboard Enriquecido na Visão da Campanha
### Fase 3: Infraestrutura Realtime para Log e Rolagens do Jogador
### Fase 4: PlayerView Interativa — Log, Turno e Ficha Completa
### Fase 5: Integração do DM — Receber Rolagens dos Jogadores
