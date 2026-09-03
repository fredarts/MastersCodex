# PLAN: Sistema de Transferência Direta com Modal de Recebimento Atômico (D&D 5e)

> **Status:** PLANEJAMENTO APROVADO / AGUARDANDO IMPLEMENTAÇÃO  
> **Objetivo:** Implementar o fluxo peer-to-peer de transferência de itens onde o destinatário recebe um modal temático de aceitação/coleta ("🎁 Itens Recebidos de [Remetente]") e realiza o salvamento atômico em sua própria ficha com credenciais válidas do Supabase (100% em conformidade com RLS).

---

## 1. Diagnóstico e Arquitetura do Problema

```
+---------------------------------------------------------------------------------------------------+
| FLUXO PEER-TO-PEER COM CONFIRMAÇÃO & RLS SEGURO                                                   |
+---------------------------------------------------------------------------------------------------+

 [ JOGADOR A (Remetente) ]                                     [ JOGADOR B (Destinatário) ]
            |                                                               |
 1. Abre ItemTransferModal                                                  |
 2. Seleciona itens & quantidades                                           |
 3. Clica "Confirmar Envio"                                                 |
 4. Deduz da Ficha A local &                                                |
    Salva no Supabase (user_id = A)                                         |
 5. Dispara Realtime Broadcast:                                             |
    DIRECT_TRANSFER (Pacote com Itens) -----------------------------------> 6. Recebe DIRECT_TRANSFER
            |                                                               7. Abre ReceivedItemsModal
            |                                                                  "🎁 Kirion enviou itens!"
            |                                                               8. Clica "Coletar Itens"
            |                                                               9. Integra na Ficha B &
            |                                                                  Salva no Supabase (user_id = B)
            v                                                               v
 [ Toast: "Enviado com Sucesso!" ]                             [ Toast: "Itens Adicionados à Ficha!" ]
```

### Por que esta é a solução definitiva:
1. **Conformidade Total com RLS do PostgreSQL**:
   - `auth.uid() = user_id`: O Jogador A salva a dedução em sua ficha (`user_id = A`). O Jogador B salva a adição em sua ficha (`user_id = B`). Nenhuma sessão tenta escrever na linha de outro usuário.
2. **Feedback Visual Imediato**:
   - O destinatário visualiza exatamente quem enviou, quais itens chegaram (com dados de dano, cura, CA, raridade, notas e cartas legíveis) e um botão de ação "Coletar Itens".
3. **Preservação de Dados de Alta Fidelidade**:
   - Preserva `potionProps`, `weaponProps`, `armorProps`, `readableContent`, `notes`, `quantity` e atualiza automaticamente a lista de ataques rápidos (`attacks`) se o item for uma arma.

---

## 2. Componentes e Arquivos a Serem Criados / Modificados

### [NOVO] `components/player-view/ReceivedItemsModal.tsx`
- **Design:** Dark Fantasy RPG Vault Modal (estilo BG3/D&D 5e).
- **Conteúdo:**
  - Cabeçalho com o nome e avatar do remetente (*"Presente / Encomenda de [Remetente]"*).
  - Lista detalhada de itens recebidos com badges de raridade, tipo, fórmulas de cura/dano e texto de leitura.
  - Botão de ação dourado **"Coletar Itens para a Ficha"** (com som de loot/equipamento e feedback visual).
  - Efeito sonoro suave e animação de entrada com Tailwind/framer.

### [MODIFICAR] `lib/types.ts`
- Atualizar `DirectTransferPayload` para suportar `items?: CharacterEquipmentItem[]` além de `item?: CharacterEquipmentItem`.

### [MODIFICAR] `context/PartyLootContext.tsx`
- Integrar `onDirectTransfer` para abrir o `ReceivedItemsModal` se o destinatário for o usuário ativo (`toCharacterName` ou `toUserId`).
- Adicionar estado `pendingReceivedTransfer: DirectTransferPayload | null`.

### [MODIFICAR] `components/PlayerLobby.tsx`
- Inserir o `ReceivedItemsModal` no rodapé dos modais do lobby.
- Integrar `handleConfirmItemTransfer` para despachar o pacote via `sendDirectTransfer` e broadcast realtime.
- Atualizar a função `handleCollectReceivedItems` para:
  - Adicionar todos os itens na ficha ativa (`equipment`, `items` e `attacks`).
  - Salvar no `localStorage` e no Supabase (`user_id = user.id`).
  - Fechar o modal com mensagem de sucesso.

### [MODIFICAR] `lib/__tests__/item-transfer.test.ts`
- Adicionar testes cobrindo a recepção de múltiplos itens via payload de transferência direta.

---

## 3. Plano de Fases

| Fase | Descrição | Arquivos |
|------|-----------|----------|
| **Fase 1** | Atualização de Tipos & Payloads de Transferência | `lib/types.ts`, `lib/services/itemTransferService.ts` |
| **Fase 2** | Criação do Modal `ReceivedItemsModal.tsx` | `components/player-view/ReceivedItemsModal.tsx` |
| **Fase 3** | Integração de Realtime & Coleta de Itens | `components/PlayerLobby.tsx`, `context/PartyLootContext.tsx` |
| **Fase 4** | Testes Unitários & Validação Completa | `lib/__tests__/item-transfer.test.ts`, `vitest run` |

---

## 4. Critérios de Aceite e Verificação
1. ✅ **Remetente**: Seleciona 1 ou mais itens e confirma o envio. Os itens somem/decrementam da ficha dele imediatamente e gravam no Supabase sem erros.
2. ✅ **Destinatário**: Assim que o remetente clica em enviar, abre instantaneamente o modal na tela do destinatário com a lista de itens recebidos.
3. ✅ **Coleta**: Ao clicar em "Coletar Itens", a ficha do destinatário recebe todos os itens (e ataques de armas), grava no Supabase com suas próprias credenciais (sem erro de RLS) e atualiza o inventário na tela.
4. ✅ **Sem Alertas de Rolagem**: O Mestre não vê nenhum popup indevido de rolagem (d20 = 0).
5. ✅ **100% de Testes Aprovados**: Todos os testes unitários do Vitest passam.
