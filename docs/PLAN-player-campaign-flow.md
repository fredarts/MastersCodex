# PLAN: Reformulação da Tela de Jogador e Feed por Campanha

## Contexto & Objetivos
Atualmente, o `PlayerLobby.tsx` exibe o formulário de entrada, a lista de campanhas e o feed público juntos na mesma tela de forma estática. 
O objetivo deste plano é reorganizar a interface do jogador para uma estrutura em 2 camadas mais fluida e intuitiva:
1. **Hub de Campanhas**: Botão de adicionar campanha via modal + Grid de Cards das campanhas em que o jogador participa.
2. **Visão da Campanha**: Ao clicar no card, abre a tela focada naquela campanha com o Feed da Aventura, resumos e diário de bordo.

---

## Fases da Implementação

### Fase 1: Arquitetura da UI no `PlayerLobby.tsx`
- Criar estados de controle de visualização:
  - `selectedCampaignId`: ID da campanha selecionada para ver o feed (null = exibindo Hub).
  - `isJoinModalOpen`: modal para entrada com código do mestre.
- Ajustar integração com `useAuth()` para persistência e reatividade ao entrar em novas mesas.

### Fase 2: Componente Modal "Adicionar Campanha"
- Overlay modal responsivo com design escuro/dourado medieval.
- Inputs para Código de Convite (com formatação mono/maiúsculo) e Nome do Personagem.
- Botão "Conectar à Mesa" com estados de carregamento e mensagem de sucesso.

### Fase 3: Grid de Cards de Campanha (Hub)
- Layout em Grid (1 a 3 colunas) com cards estilizados para cada campanha do jogador (`role === 'player'`).
- Exibição de título, mestre, personagem vinculado, código da mesa e tag de "Mesa Ativa".
- Efeito hover e clique para selecionar a campanha e abrir seu feed.

### Fase 4: Tela de Feed da Campanha Selecionada
- Cabeçalho de navegação com botão "← Voltar para Minhas Campanhas".
- Seção principal com a linha do tempo do Feed da Aventura (batalhas, encontros, notas públicas do Mestre).
- Painel de informações do personagem e atalho para a Tela de Exibição (Discord/TV).

---

## Verificação & Validação
- Testar adição de campanha via código demo (`O RE-172`).
- Validar transição de telas (Hub <-> Feed da Campanha).
- Testar inclusão de múltiplas campanhas e navegação entre elas.
