# Plano de Redesign: Regras da Casa (House Rules) & Integração com Menu de Recursos

**Status:** Em Planejamento (Aguardando Aprovação)  
**Módulos:** `CampaignSettingsStudio`, `Header`, `PlayerView`, `HouseRulesModal`  
**Dispositivos-Alvo:** Desktop (1440px+), Tablet (Galaxy Tab S4 1138x712, iPads 1024x768) e Mobile.

---

## 🎯 1. Visão Geral & Objetivos

Transformar a tela básica de **Regras da Casa (House Rules)** em um **Centro de Governança de Regras Dinâmico e Cinematográfico**, permitindo ao Mestre gerenciar regras estruturadas, categorizadas e com presets de 1-clique, além de dar aos **Jogadores acesso instantâneo** a essas diretrizes diretamente no menu **Recursos da Mesa** (Header, Player View e Companion).

---

## 🎨 2. Design System & UI/UX (Pro Max)

### 2.1 Paleta & Estética (Tema Fantasy Dark Tech)
- **Fundo Principal & Cards:** `#0a0d14` (Fundo profundo), `#121824` / `#161c28` (Cards elevados), com bordas em `#2a3449` e brilho sutil `border-amber-500/30`.
- **Acentos & Categorias:**
  - ⚔️ **Combate & Tática:** Vermelho Carmesim / Âmbar (`text-rose-400`, `bg-rose-500/10`).
  - 🍷 **Poções & Consumíveis:** Esmeralda Mágica (`text-emerald-400`, `bg-emerald-500/10`).
  - 🌙 **Descanso & Sobrevivência:** Azul Estelar (`text-sky-400`, `bg-sky-500/10`).
  - 🎲 **Dados & Críticos:** Ouro Real (`text-amber-400`, `bg-amber-500/10`).
  - 🔮 **Magia & Conjuração:** Ciano / Índigo arcano (`text-cyan-400`, `bg-cyan-500/10`).
  - 📜 **Personalizadas & Gerais:** Slate refinado (`text-slate-300`, `bg-slate-800/40`).

### 2.2 Layout Adaptativo para Tablet (1138x712 & 1024x768)
- **Grid Responsivo 2 Colunas / Split View:**
  - **Desktop (>=1200px):** Layout side-by-side (Coluna Esquerda: Regras Ativas com Filtros & Coluna Direita: Biblioteca de Presets Populares + Termômetro de Estilo da Mesa).
  - **Tablet (768px - 1199px):** Split-view adaptativo ou Navegação por Sub-abas tátil ("📜 Regras Ativas (N)" | "📦 Biblioteca de Presets").
  - **Touch Ergonomics:** Botões com altura mínima de `44px`, toggles táteis de fácil acionamento sem clique acidental, scroll suave desacoplado da sidebar.

---

## 🏗️ 3. Estrutura de Dados & Funcionalidades

### 3.1 Modelo de Dados (`HouseRuleItem`)
```typescript
export type HouseRuleCategory = 'combat' | 'potions' | 'rest' | 'dice' | 'magic' | 'custom';
export type HouseRuleImpact = 'buff' | 'nerf' | 'tactical' | 'gritty' | 'comfort';

export interface HouseRuleItem {
  id: string;
  title: string;
  description: string;
  category: HouseRuleCategory;
  icon?: string;
  impact?: HouseRuleImpact;
  isActive: boolean;
  isPreset?: boolean;
  source?: string; // ex: 'D&D 5e Popular', 'One D&D', 'Mestre'
  createdAt: string;
}
```

### 3.2 Catálogo Integrado de Presets Famosos (1-Click Add)
1. **🍷 Poção de Cura como Ação Bônus:** Permite beber poção de cura com Ação Bônus (dar a um aliado ainda custa Ação normal).
2. **⚔️ Acerto Crítico Brutal:** Causa dano máximo dos dados normais + rolagem dos dados extras.
3. **🌙 Descanso Realista (Gritty Realism):** Descanso Curto = 8h; Descanso Longo = 7 dias em segurança.
4. **🛡️ Flanking Tático (+2 em vez de Vantagem):** Flanquear concede bônus estático de +2 no ataque ao invés de Vantagem total.
5. **💀 Testes de Resistência contra a Morte Secretos:** Apenas o Mestre vê os resultados dos testes de morte para aumentar a tensão.
6. **✨ Inspiração Cumulativa:** Jogadores podem acumular até 3 pontos de Inspiração e usá-los para rerolar ou somar 1d6.
7. **🔮 Conjuração de Múltiplas Magias:** Regra simplificada para conjurar magia de ação e magia bônus no mesmo turno.
8. **🩹 Cura Máxima fora de Combate:** Poções e descanso fora de perigo concedem o valor máximo dos dados sem necessidade de rolagem.

---

## 🚀 4. Acesso dos Jogadores no Menu de Recursos

### 4.1 Header Dropdown (`Header.tsx`)
- Adicionar opção **"📜 Regras da Casa & Diretrizes"** no menu **Recursos da Mesa**.
- Exibir badge com o número de regras ativas.
- Abrir o novo componente `HouseRulesModal` com busca, filtros por categoria e explicação clara para os jogadores.

### 4.2 Telas de Jogador (Player Lobby & Player View)
- Acesso fácil em um clique tanto na visão de Projeção quanto no Pocket Companion Mobile.

---

## 📋 5. Etapas de Execução

1. **Definição de Tipos & Helpers (`lib/types/campaign.ts` ou `lib/types.ts`):**
   - Criar interfaces estruturadas e catálogo padrão de presets.
2. **Criação do Componente Especializado `CampaignHouseRulesStudio.tsx`:**
   - Barra de busca, filtros de tags e contadores.
   - Lista de regras ativas com cards visuais ricos, edição inline e toggle liga/desliga.
   - Painel lateral de Presets da Comunidade com adição rápida.
   - Otimizações de layout para Tablet (Galaxy Tab S4 e similares).
3. **Criação do Modal de Consulta para Jogadores (`components/campaign/HouseRulesModal.tsx`):**
   - Visualização limpa, moderna e amigável para leitura durante a sessão.
4. **Integração no `Header.tsx` e `CampaignSettingsStudio.tsx`:**
   - Conectar estado e persistência no banco / estado local.
5. **Verificação & Testes de Responsividade.**
