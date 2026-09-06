# PLAN: Unificação das Telas de Elenco & Party (Campaign Forge Studio)

## 📌 Contexto & Diagnóstico
Atualmente no `CampaignSettingsStudio.tsx`, a gestão de participantes de uma campanha está dividida em duas abas separadas na barra lateral:
1. **`Elenco & Jogadores` (`roster`)**: Exibe o código de convite da mesa, botões de ação ("Transmitir Worldbuilding", "+ Jogador Manual", "Atualizar Lista"), e a lista de jogadores/DM conectados com botão de exclusão.
2. **`Party` (`party`)**: Exibe a lista de membros ativos da party de batalha/recompensas (PCs + NPCs aliados) e uma coluna lateral para adicionar jogadores do elenco ou NPCs do mundo à party.

### 🎯 Por que a Mesclagem Faz Total Sentido?
- **Redução de Fricção e Cliques**: O DM não precisa mais alternar entre duas abas para verificar quem entrou pelo código de convite e depois ir na aba ao lado para colocá-lo na Party.
- **Fim da Redundância**: Ambas as telas renderizam essencialmente os mesmos personagens com pequenas variações de estado (estar conectado vs estar no grupo ativo).
- **Otimização de Espaço de Tela (Layout 2 Colunas)**: A tela de elenco usava uma coluna estreita com muito espaço vazio, enquanto uma tela unificada aproveita o layout profissional widescreen com barra de ações de topo + 2 colunas integradas.

---

## 🏗️ Proposta de Arquitetura da Tela Unificada: "Elenco & Party da Mesa"

### 1. Header de Ações Rápido (Topo)
- **Código de Convite da Mesa** com botão "Copiar Convite" integrado e badge estilizado.
- **Botões Globais**:
  - `Transmitir Worldbuilding` (abre o modal de revelações)
  - `+ Conectar Jogador Manual` (abre o modal manual)
  - `Atualizar Lista` (revalidação em tempo real Supabase)
- **Badges de Contadores**: Ex.: `4 no Elenco` | `4 na Party Ativa` | `3 NPCs Aliados Disponíveis`.

### 2. Coluna Esquerda: "Elenco & Aventureiros da Campanha" (Full Hub)
Lista unificada de todos os membros da mesa (DM, Jogadores e NPCs recrutados):
- **Avatar & Nome**: Foto/ícone, Nome do Personagem, Nome do Jogador e papel (`DM`, `Jogador`, `NPC Aliado`).
- **Acesso à Ficha**: Clicar no nome abre a ficha detalhada (`openSheet`).
- **Toggle / Badge de Status da Party**:
  - Botão toggle direto: `[⚔️ Na Party]` (Ativo) vs `[🛡️ No Banco/Reserva]`. Clicar alterna instantaneamente se o jogador/NPC faz parte da distribuição de XP e combate.
- **Badge de Conexão**: `🟢 CONECTADO` / `🟡 MANUAL`.
- **Ações**: Remover/Expulsar do Elenco (com modal de confirmação).

### 3. Coluna Direita: "Adicionar NPCs Aliados do Mundo"
- Campo de busca em tempo real de NPCs por nome, papel ou tags do Worldbuilding.
- Lista de NPCs do mundo disponíveis para recrutar como companheiros com 1 clique (`+ Recrutar para Party`).
- Botão rápido para criar novo NPC no compêndio/mundo sem sair da tela.

---

## 📋 Plano de Execução em Fases

### Fase 1: Atualização da Sidebar e Estrutura de Rotas
- Mesclar os botões da sidebar `Elenco & Jogadores` e `Party` em uma única aba: `Elenco & Party` (ícone `Users` ou `Shield`).
- Remover a aba redundante `party` do estado `activeTab` mantendo retrocompatibilidade.

### Fase 2: Unificação dos Estados e Handlers
- Combinar os estados de `rosterMembers`, `partyMembers` e `worldEntities`.
- Criar a função reativa `togglePartyMember(member)` para colocar/tirar um membro do elenco da party com apenas 1 clique e feedback via `toast`.

### Fase 3: Layout Visual Premium & Responsivo
- Aplicar o layout em 2 colunas com o design system do Master's Codex (tons escuros `#0a0d14`, acentos em âmbar e ciano para PCs, ouro para NPCs, sem violeta/roxo).
- Adicionar transições suaves e estados vazios informativos.

### Fase 4: Verificação & Testes
- Testar adição de jogador manual, cópia do código de convite, toggle de party, recrutamento de NPCs aliados e remoção.
- Executar `npm run build` para garantir integridade de tipagem.

---

## ❓ Questões do Socratic Gate (Alinhamento com o Usuário)
1. **Comportamento do DM**: O Mestre (DM) deve poder ser adicionado à Party de batalha/XP ou deve ser sempre fixo apenas como organizador do Elenco?
2. **Nomenclatura da Aba**: Você prefere o nome **"Elenco & Party"**, **"Grupo & Aventureiros"** ou **"Personagens & Party"** na barra lateral?
3. **Persistência ao Remover**: Quando um jogador for removido do Elenco, ele deve ser automaticamente removido da Party também? (Recomendado: Sim).
