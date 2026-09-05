# PLAN: Modo Companion Mobile Dedicado (Player Pocket HUD)

## 📋 Resumo do Projeto
Criar uma rota mobile-first dedicada (`/companion`) focada 100% no jogador em mesa presencial ou remota. O Companion elimina o peso de renderização 3D/Canvas pesados e foca em ergonomia de polegar (Thumb Zone), latência zero, feedback tátil háptico (`navigator.vibrate`) e sincronização direta com o estado da sessão/combate.

---

## 🏗️ Arquitetura e Decisões Técnicas

```
app/
 └── companion/
      ├── page.tsx                    # Rota de entrada leve com seleção de personagem / sincronização
      └── layout.tsx                  # Meta viewport dedicado (viewport-fit=cover, no-zoom)
components/
 └── companion/
      ├── MobileCompanionView.tsx     # Container mestre com estado e abas inferiores
      ├── CompanionHeader.tsx         # HP Bar gigante, CA, Iniciativa, Condições ativas
      ├── CompanionBottomNav.tsx      # Barra de polegar com 4 modos (Ações, HP/Condições, Dados, Recursos)
      ├── CompanionActionPad.tsx      # Ações de combate (Ataques, Armas, Truques) em cards compactos
      ├── CompanionHpController.tsx   # Teclado numérico / botões rápidos de Dano, Cura e Temp HP
      ├── CompanionDiceRoller.tsx     # Quick Roller tátil 2D com Vantagem/Desvantagem e histórico
      ├── CompanionSpellsSlots.tsx    # Gerenciador de Spell Slots (pips táteis interativos)
      └── CompanionDeathSaves.tsx     # Modal/Overlay automático de Death Saves ao cair a 0 HP
lib/
 └── haptics/
      └── hapticFeedback.ts           # Abstração de vibração com padrões predefinidos e detecção de suporte
```

### Decisões Arquiteturais Fundamentais:
1. **Rota Autônoma `/companion`**: Não carrega o Three.js, React Three Fiber ou shaders de iluminação. Bundle JavaScript minúsculo (< 60kb).
2. **Ergonomia Thumb Zone**: Todos os botões primários de rolagem e alteração de HP estão posicionados nos 40% inferiores da tela do celular.
3. **Padrões de Haptic Feedback (Web Vibration API)**:
   - `rollNormal`: `15ms` (leve toque de clique)
   - `rollCritical20`: `[30, 50, 60]` (vibração dupla comemorativa triunfante)
   - `rollCritical1`: `[150ms]` (vibração longa de choque/falha)
   - `hpDamage`: `[40, 30, 40]` (alerta tátil de perda de vida)
   - `hpZeroDeath`: `[80, 40, 80, 40, 120]` (vibração pulsante de emergência)
   - `actionSuccess`: `25ms` (confirmação de gasto de slot ou aplicação de cura)
4. **Sincronização de Estado**: Reutiliza os contextos globais de Personagem e Sessão do projeto, mantendo persistência reativa e sincronização com o mestre.

---

## 📋 Divisão de Tarefas (Task Breakdown)

### Fase 1: Módulo de Feedback Tátil (Haptics Engine)
- [x] Criar [`lib/haptics/hapticFeedback.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/haptics/hapticFeedback.ts) com suporte a detecção de `navigator.vibrate` e fallback silencioso para desktop/iOS sem permissão.
- [x] Implementar presets nomeados: `vibrateRoll()`, `vibrateCritSuccess()`, `vibrateCritFail()`, `vibrateDamage()`, `vibrateDeathSave()`.

### Fase 2: Rota Dedicada e Layout Mobile PWA
- [x] Criar [`app/companion/layout.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/app/companion/layout.tsx) com estilos de viewport mobile, suporte a notch/safe-areas (`env(safe-area-inset-*)`) e fundo escuro OLED (`#0b0f19`).
- [x] Criar [`app/companion/page.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/app/companion/page.tsx) com conexão à sessão ativa e seletor rápido de personagem.

### Fase 3: HUD Superior de Status Vital (CompanionHeader)
- [x] Implementar visualização de HP Dinâmico com barra gradiente de status (Verde -> Amarelo -> Vermelho -> Cinza 0 HP).
- [x] Badges rápidos de CA, Iniciativa, Percepção Passiva e Velocidade.
- [x] Pill horizontal de Condições ativas (rolagem horizontal suave para adicionar/remover condições como *Cego*, *Envenenado*, *Caído*).

### Fase 4: Quick Roller 2D & Testes de Perícias (CompanionDiceRoller)
- [x] Implementar botões de dados táteis (d20, d4, d6, d8, d10, d12, d100).
- [x] Seletor rápido de rolagem: **Normal**, **Vantagem (+)**, **Desvantagem (-)**.
- [x] Display do resultado com animação CSS Spring leve, indicação visual de Crítico (Dourado para 20 / Carmesim para 1) e acionamento instantâneo do Haptics correspondente.
- [x] Mini-log dos últimos 5 resultados expansível.

### Fase 5: Controlador de HP Express e Death Saves
- [x] [`CompanionHpController.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/companion/CompanionHpController.tsx):
  - Botões rápidos `[-1]`, `[-5]`, `[-10]`, `[+1]`, `[+5]`, `[+10]` e teclado numérico direto para dano/cura express.
  - Controle de HP Temporário.
- [x] [`CompanionDeathSaves.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/companion/CompanionDeathSaves.tsx):
  - Ativação automática ao atingir 0 HP.
  - 3 círculos de Sucesso / 3 círculos de Falha com botão grande de "Rolar Teste contra a Morte" que já calcula estabilização ou morte com haptic feedback intenso.

### Fase 6: Gerenciador de Ações, Ataques e Slots de Magia
- [x] [`CompanionActionPad.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/companion/CompanionActionPad.tsx):
  - Lista de armas equipadas com botão de rolar Ataque e rolar Dano a 1 toque.
  - Magias preparadas agrupadas por nível de círculo.
- [x] [`CompanionSpellsSlots.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/companion/CompanionSpellsSlots.tsx):
  - Pips de slots de magia do 1º ao 9º nível com toggle tátil imediato e botões de Descanso Curto/Longo para recuperação.

### Fase 7: Navegação de Polegar (CompanionBottomNav) & Transições
- [x] Dock inferior fixo com ícones ergonômicos:
  1. ⚔️ **Ações** (Armas e Magias)
  2. 💖 **Vida** (HP Express, Condições e Death Saves)
  3. 🎲 **Dados** (Rolador rápido e Perícias)
  4. 📜 **Recursos** (Slots de magia, Itens rápidos e Descansos)
- [x] Botão de Atalho no Header do Desktop/Cockpit para abrir a rota `/companion`.
- [x] Modal/Gerador de QR Code para pareamento instantâneo via câmera do celular ([`CompanionQrModal.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/companion/CompanionQrModal.tsx)).

---

## 🧪 Plano de Verificação (Verification Checklist)

### 1. Testes de Responsividade e Ergonomia (Mobile Viewport)
- [x] Testar em viewports de 360px a 430px de largura (iPhone SE até Pro Max, Galaxy S series).
- [x] Garantir que nenhum elemento estoure o scroll horizontal (`overflow-x: hidden`).
- [x] Verificar padding com Safe Area (`env(safe-area-inset-bottom)`).

### 2. Testes de Haptics e Rolagens
- [x] Validar disparo da Vibration API em dispositivos móveis compatíveis (Android Chrome / Safari com suporte PWA).
- [x] Confirmar vibração diferenciada para 20 natural e 1 natural.
- [x] Testar que em ambientes sem suporte à vibração a aplicação não lança erros (`navigator.vibrate` protegido com optional chaining/try-catch).

### 3. Teste de Fluxo de Vida e Combate
- [x] Aplicar dano até 0 HP e verificar transição imediata para o modo Death Saves com vibração de perigo.
- [x] Realizar rolagens de ataque e verificar se os modificadores de Força/Destreza/Proficiência são adicionados corretamente.
- [x] Gastar e recuperar slots de magia e verificar sincronização de estado.
