# PLAN: Transmissão de NPCs do World Building com Revelação Progressiva por Campanha

**Data:** 03 de Setembro de 2026  
**Status:** 📋 Aguardando Confirmação do Usuário (Socratic Gate)  
**Slug do Plano:** `docs/PLAN-campaign-npc-sharing.md`  
**Especialistas:** `@project-planner`, `@frontend-specialist`, `@game-developer`, `@backend-specialist`

---

## 🎯 1. Visão Geral & Requisitos do Usuário

1. **Vínculo por Campanha (Isolamento entre Mesas)**:
   - Um mesmo NPC do World Building (ex: *Lorde Valerius*) pode ser transmitido para várias campanhas diferentes.
   - Cada campanha possui sua própria máscara de visibilidade de conhecimento (*Progressive NPC Disclosure*), garantindo que o Grupo A não veja os segredos que apenas o Grupo B descobriu.
2. **Controle Granular Campo a Campo**:
   - Opções `👁️ Público` vs `🔒 Secreto / Oculto` para cada propriedade do NPC:
     - **Imagem / Retrato**: Se oculto, exibe uma silhueta sombria misteriosa ("Aparência Desconhecida").
     - **Nome Real / Título**: Se oculto, pode exibir um pseudônimo (ex: *"Figura Encapuzada"*) ou *"Desconhecido"*.
     - **Raça & Classe**: Se oculto, exibe *"???"*.
     - **Resumo / Primeira Impressão**: Visível ou oculto.
     - **Biografia Completa & Lore**: Visível ou oculto.
     - **Segredos & Motivações (`npcSecrets`)**: Visível ou oculto.
     - **Relacionamentos & Conexões (Facções/Aliados)**: Visível ou oculto.
     - **Ficha de Atributos & Combate (Stat Sheet)**: Visível ou oculto.
3. **Revelação Progressiva em Tempo Real**:
   - O Mestre pode abrir o painel da campanha e alternar as permissões a qualquer momento durante a sessão.
   - Os jogadores recebem uma notificação em tempo real (*Realtime Toast / Broadcast*): *"📜 Novo conhecimento revelado sobre [Nome do NPC]!"* com badge de "Não Visualizado".
4. **Modal de Leitura do Jogador**:
   - Baseado no modal clássico do World Building, mas adaptado para o jogador, ocultando estritamente campos não revelados e apresentando o lore com tipografia e diagramação dark fantasy imersiva.

---

## 🏗️ 2. Modelo de Dados & Arquitetura

### 2.1. Estrutura de Revelação por Campanha (`CampaignNPCDisclosure`)
```typescript
export interface CampaignNPCDisclosure {
  entityId: string; // ID do WorldEntity (NPC)
  isShared: boolean; // Se o NPC foi transmitido para a campanha
  revealedFields: {
    image: boolean;
    name: boolean;
    alias?: string; // Nome alternativo enquanto o real estiver oculto (ex: "O Alquimista Cego")
    raceClass: boolean;
    shortDesc: boolean;
    fullContent: boolean;
    secrets: boolean;
    connections: boolean;
    statSheet: boolean;
    tags: boolean;
  };
  sharedAt: string;
  updatedAt: string;
}
```

### 2.2. Armazenamento
- Campo `npcDisclosures: Record<string, CampaignNPCDisclosure>` dentro do objeto da Campanha (`activeCampaign.npcDisclosures` ou sincronizado via `campaignService`).

---

## 📋 3. Divisão de Tarefas

### Fase 1: Camada de Dados & Tipos
- [ ] Adicionar a tipagem `CampaignNPCDisclosure` em `lib/types.ts`.
- [ ] Atualizar `campaignService.ts` e `useCampaign` com funções para compartilhar NPC, atualizar permissões de campos e emitir broadcast realtime para os jogadores.

### Fase 2: Painel do Mestre - Gerenciador de Transmissão de NPCs
- [ ] Criar modal/painel do Mestre: **"Transmitir NPCs para a Campanha"** com busca, listagem dos NPCs do Mundo e interruptores rápidos (`👁️ Imagem`, `👁️ Nome`, `👁️ Biografia`, `👁️ Segredos`, `👁️ Ficha`, etc.).
- [ ] Adicionar botão de fácil acesso no `CampaignSettingsStudio.tsx` (na aba de Elenco / NPCs ou no Feed da Campanha).

### Fase 3: Modal de Visualização do Jogador & Notificações Realtime
- [ ] Criar o componente `PlayerNPCModal.tsx` que renderiza o NPC com visual dark fantasy idêntico ao World Building, aplicando a máscara de silhueta caso a imagem esteja oculta e ocultando campos não revelados.
- [ ] Conectar o modal à aba de **NPCs** do modal `CampaignFeedModal.tsx` e permitir que os jogadores cliquem para inspecionar os NPCs que o grupo já conhece.
- [ ] Integrar broadcast `NPC_KNOWLEDGE_UPDATED` para disparar toast e indicador visual de novidade na tela dos jogadores.

---

## ❓ 4. Socratic Gate & Perguntas Estratégicas

1. **Quando o Nome do NPC estiver oculto**:
   - **Opção A (Recomendada)**: Permitir que o Mestre defina um "Codinome / Pseudônimo" (ex: *"O Cavaleiro Sem Rosto"* ou *"Estranho da Taverna"*) ou use por padrão *"NPC Desconhecido"*.
   - **Opção B**: Apenas mostrar *"Identidade Oculta"*.

2. **Silhueta de Imagem Oculta**:
   - Prefere uma silhueta sombria com runa/ponto de interrogação pulsante em tom âmbar/dourado quando a imagem estiver bloqueada?

3. **Acesso do Jogador**:
   - Os jogadores acessarão os NPCs compartilhados através da aba **"💬 NPCs"** no modal de Crônicas da Campanha (como visto na imagem enviada) e também poderão abrir ao clicar em menções no chat/feed?

---

## ✅ 5. Critérios de Verificação (Verification Checklist)
- [ ] O Mestre consegue escolher quais campos de cada NPC estão visíveis ou secretos em uma campanha específica.
- [ ] Duas campanhas diferentes vinculadas ao mesmo Mundo mantêm permissões de visibilidade totalmente independentes.
- [ ] O Jogador vê a silhueta misteriosa se a imagem estiver oculta e só vê os textos/campos autorizados.
- [ ] Ao alterar a visibilidade durante a sessão, o jogador conectado recebe a notificação em tempo real sem precisar recarregar a página.
- [ ] `npx tsc --noEmit` e `npx vitest run` 100% verdes.
