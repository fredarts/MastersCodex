# PLAN: Redesign do Estúdio de Áudio da Cena (50% Músicas / 50% SFX)

> **Contexto:** Aprimoramento da tela de seleção de músicas e efeitos sonoros das cenas no Studio de Sessões.

---

## 🎯 Proposta Arquitetural e de Design

### 1. Divisão Balanceada em 50% / 50% (Split-View)
- **Deck Esquerdo (50%)**: Músicas de Fundo (BGM) & Ambientes.
- **Deck Direito (50%)**: Efeitos Sonoros (SFX) & Soundboard Tátil.

### 2. Hierarquia e Funcionalidades do Deck de Músicas (BGM)
- **Painel de Trilhas Ativas**: Músicas associadas à cena com remoção em 1 clique.
- **Barra de Busca e Filtros Narrativos**: *Todas*, *Combate*, *Taverna & Cidade*, *Exploração & Natureza*, *Dungeon & Mistério*, *Nobreza & Templos*, *Uploads Custom*.
- **Player de Preview Integrado**: Botão de Play/Pause rápido para ouvir antes de adicionar.

### 3. Hierarquia e Funcionalidades do Deck de SFX
- **Painel de Atalhos Rápidos**: Grid dos efeitos que ficarão no Cockpit do Mestre.
- **Filtros por Categoria de SFX**: *Ataques & Armas*, *Magias & Feitiços*, *Monstros & Feras*, *Ambientes & Objetos*, *Rolagens*.
- **Soundboard Interativo**: Grid com botão de disparo/teste com animação de pulso sonoro.

---

## 📋 Arquivos Afetados
- `components/session/SceneAudioStudio.tsx` [NOVO]
- `components/SessionStudio.tsx` [MODIFICAR]
