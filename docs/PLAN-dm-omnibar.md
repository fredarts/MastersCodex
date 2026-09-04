# PLAN: Omnibar & Command Palette de Mestre (Ctrl+K / Cmd+K)

> **Task Slug:** `dm-omnibar-palette`  
> **Status:** Proposto / Em Planejamento  
> **Arquivos Alvo:**  
> - `components/omnibar/DmCommandPalette.tsx` [NOVO]  
> - `components/omnibar/OmnibarItem.tsx` [NOVO]  
> - `lib/hooks/useOmnibarShortcuts.ts` [NOVO]  
> - `lib/omnibar-engine.ts` [NOVO]  
> - `components/AppProviders.tsx` [MODIFICAR]  
> - `components/Header.tsx` [MODIFICAR]

---

## 🎯 Objetivo

Criar uma **Omnibar / Command Palette global de alta performance (`Ctrl+K` / `Cmd+K`)** inspirada no Raycast, Spotlight e VS Code, permitindo que o Mestre de Jogo execute comandos críticos em menos de 2 segundos sem precisar abrir múltiplos menus ou tirar as mãos do teclado durante a sessão.

---

## ⚡ Capacidades Principais da Omnibar

### 1. 🎲 Rolagens Rápidas & Macros
- **Execução Instantânea:** Digitar `1d20+5`, `/r 2d6+3`, `/gmr 1d20+8` (rolagem secreta do DM) e pressionar `Enter` rola o dado imediatamente com física 3D, alimenta o log de combate e notifica a mesa.
- **Modificadores com 1 Toque:** Suporte a sufixos rápidos `adv` (vantagem), `desv` (desvantagem), `crit` e `kh1`.
- **Predefinições do Mestre:** Acesso rápido a `d20`, `d100`, `Teste de Percepção Passiva do Grupo`, `Iniciativa de Monstros`.

### 2. 🛡️ Gestão Rápida de Combate & Condições
- **Filtro de Combatentes:** Digitar `@goblin` ou `@kirion` lista ações imediatas para aquele alvo:
  - Aplicar/Remover Condições (ex: *Cego, Envenenado, Paralisado, Concentração*).
  - Aplicar Dano / Cura rápida (ex: `-12` ou `+8`).
- **Controle de Turno:** Comandos rápidos `Próximo Turno` (`/next`), `Turno Anterior` (`/prev`), `Reiniciar Iniciativa`.

### 3. 🎵 Controle Global de Áudio & Soundscapes
- **Mídia em 1 Tecla:** Pausar/Retomar BGM (`Espaço` ou `/pause`, `/play`), Silenciar Tudo (`/mute`), Trocar Trilha Sonora para *Batalha, Caverna, Cidade, Mistério*.
- **Disparar SFX Imediatos:** `/sfx trovao`, `/sfx espada`, `/sfx vitoria`.

### 4. 📖 Busca Instantânea na SRD (Compêndio & Regras)
- **Filtro Inteligente por Prefixo:**
  - `!magia bola de fogo` ou `!m raio` → Busca instantânea no catálogo de magias com CD, alcance, dano e componentes.
  - `!monstro goblin` → Exibe CA, PV, Ataques e Ações.
  - `!item pocao` → Peso, custo e propriedades mágicas.
  - `!regra cobertura` ou `!regra concentracao` → Resumo da regra oficial D&D 5e em 1 parágrafo.
- **Ações de Resultado:** `Enter` para abrir o card completo, `Shift+Enter` para enviar a descrição no chat dos jogadores.

### 5. 🚀 Navegação Instantânea & Ações de Sessão
- Pular direto para qualquer módulo da aplicação: `Live Cockpit`, `Session Studio`, `Worldbuilder`, `Mural de Pistas`, `Loja do Mercador`, `Modo TV`, `Overlay de Streaming`.
- Avançar tempo no Calendário: `+1h`, `Descanso Curto (1h)`, `Descanso Longo (8h)`.
- Disparar `X-Card` de Segurança com 1 clique.

---

## 🏗️ Arquitetura e Estrutura dos Arquivos

```
components/omnibar/
├── DmCommandPalette.tsx          # Modal principal com backdrop blur, input e lista navegável por setas (↑ / ↓ / Enter / Esc)
├── OmnibarItem.tsx               # Renderizador de itens por categoria (Dado, Condição, Áudio, Magia, Monstro, Ação)
└── OmnibarQuickShortcuts.tsx     # Barra inferior com dicas visuais de atalhos (Tab para filtrar, Esc para fechar)

lib/
├── omnibar-engine.ts             # Parser de comandos, fuzzy search na SRD e gerador de sugestões contextuais
└── hooks/
    └── useOmnibarShortcuts.ts    # Listener global de teclado (Ctrl+K, Cmd+K, /, Esc)
```

---

## 🧪 Plano de Verificação e Testes

| Teste | Critério de Aceitação |
| :--- | :--- |
| **Atalho Global** | Pressionar `Ctrl+K` ou `Cmd+K` em qualquer tela abre a Omnibar em < 50ms com foco automático no input. |
| **Rolagem de Dados** | Digitar `/r 1d20+5` e pressionar `Enter` fecha a Omnibar, rola o dado no `LiveCockpitContext` e exibe o toast/log. |
| **Controle de Áudio** | Executar `/pause` ou clicar no toggle de música pausa o áudio no `AudioContext` instantaneamente. |
| **Busca de Magia** | Buscar `bola de fogo` retorna a magia da SRD com tempo de resposta imperceptível e preview correto. |
| **Aplicação de Condição** | Selecionar um combatente ativo e aplicar `Envenenado` reflete imediatamente na barra de iniciativa. |
| **Build & Tipagem** | Executar `npm run build` ou `npx vitest` garantindo zero erros de TypeScript. |
