# PLAN: Redesign do Hub de Campanhas do Jogador (PC & Tablet)

## 📌 Contexto & Objetivo
Modernizar e aprimorar a interface da tela inicial de **"Minhas Campanhas & Mesas de Jogo"** no Modo Jogador (`PlayerLobby.tsx`), alinhando-a aos mais altos padrões de design do Master's Codex:
1. **Banner Hero Ilustrado:** Adicionar banner cinematográfico imersivo (`/assets/player-hub-banner.jpg`) com iluminação âmbar, gradientes atmosféricos e botões de ação rápidos.
2. **Cards de Campanha com Arte de Capa:** Exibir a arte de capa panorâmica (`coverImageUrl`) criada pelo Mestre em cada card de campanha, com fallback temático para mesas sem imagem.
3. **Identidade da Mesa & Personagens:** Exibir informações ricas nos cards:
   - Identificação do Mestre (DM).
   - Personagem vinculado do jogador com avatar/retrato e classe/nível.
   - Avatares dos outros jogadores / aventureiros da party.
   - Tom da campanha (Theme Tone) e status de atividade.
4. **Otimização de Espaço para PC & Tablet:**
   - Para **até 3 campanhas**, a interface deve preencher harmonicamente a tela sem exigir rolagem vertical no PC e Tablet (Galaxy Tab S4 1138x712, iPad, laptops).
   - Para **mais de 3 campanhas**, ativa scroll suave e responsivo estilizado com scrollbar customizada.

---

## 🎨 Especificação de UI/UX (Design System Master's Codex)

### 1. Banner Superior (Hero Header)
- **Arte de Fundo:** `/assets/player-hub-banner.jpg` (mesa de aventureiros ao redor de mapa rúnico brilhante).
- **Gradiente Atmosférico:** `from-[#07090e] via-[#0a0d14]/85 to-transparent` para legibilidade cristalina do texto.
- **Ícone Dourado:** Escudo/Espadas em container com borda âmbar e `backdrop-blur-md`.
- **Badge:** `MODO JOGADOR` com destaque âmbar-ouro.
- **Ações Rápidas:**
  - Botão *"Minhas Fichas ({count})"* com visual dark slate e borda âmbar.
  - Botão *"Entrar em Mesa (Código)"* com gradiente âmbar dourado e feedback de clique.

### 2. Grid de Cards Otimizado (Layout Inteligente)
- **Comportamento 1 a 3 itens:** Grid dinâmico (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), ocupando o espaço vertical disponível no viewport (`min-h-0 flex-1`), eliminando a necessidade de barra de rolagem em tablets paisagem (ex: 1138x712) e monitores desktop.
- **Comportamento > 3 itens:** Scroll container otimizado com `overflow-y-auto pr-1 custom-scrollbar`.

### 3. Anatomia do Card de Campanha
- **Cabeçalho Visual (Cover Art):**
  - Proporção panorâmica com imagem da campanha ou arte mística.
  - Efeito de zoom suave ao passar o cursor (`group-hover:scale-105 transition-transform duration-500`).
  - Badge de "MESA DE JOGO" e badge pulsante "ATIVA" quando selecionada.
  - Botão sutil de saída da campanha no canto superior direito com confirmação segura.
- **Corpo do Card:**
  - Título da Campanha com tipografia imersiva e transição de cor em hover.
  - Sinopse com truncamento inteligente (`line-clamp-2`).
  - Linha do Mestre (DM) com ícone de coroa dourada e nome.
  - Linha do Personagem: Nome do herói, classe/nível e avatar redondo.
  - Stack de Avatares da Party (Aliados conectados na mesa).
- **Rodapé do Card:**
  - Pílula com código da mesa clicável para cópia rápida.
  - Botão interativo *"Acessar Feed & Diário da Aventura →"* com microanimação de seta.

---

## 🛠️ Plano de Implementação em Fases

### Fase 1: Ativos Visuais
- [x] Gerar e disponibilizar `/public/assets/player-hub-banner.jpg`.

### Fase 2: Componente e Lógica de Dados em `PlayerLobby.tsx`
- Enriquecer a resolução de dados da campanha no loop de renderização (obter DM, personagens da party e ficha do jogador).
- Redesenhar a seção `{!selectedCampaignId ? ...}` para usar o novo layout de banner e cards.

### Fase 3: Responsividade & Ajuste de Viewport
- Ajustar contêineres e classes Tailwind para visualização impecável em Galaxy Tab S4 (1138x712), iPads e telas desktop (1080p).
- Testar transição com 1, 2, 3 e 4+ campanhas.

### Fase 4: Verificação & Testes
- Executar build / lint runner para garantir zero quebras de tipagem e integridade do código.
