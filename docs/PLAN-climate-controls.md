# PLAN: Controle de Clima e Iluminação Completo (Estilo Unreal Engine)

Este plano descreve o design e a implementação de controles avançados de clima, iluminação e atmosfera para o Combat Grid 3D do Masters Codex, inspirados nas opções presentes em motores gráficos modernos (como Unreal Engine).

## 1. Overview
O Combat Grid atual possui um sistema básico de clima (presets de hora do dia, liga/desliga para neblina e chuva). Desenvolvedores e DMs precisam de controle refinado sobre a atmosfera para criar cenas cinemáticas (por exemplo: um sol gigantesco no horizonte em um deserto com vento forte de areia, ou uma chuva leve com névoa baixa e densa de pântano à noite).
Este upgrade transformará o modal atual em um painel completo dividido por categorias (Sol & Iluminação, Céu & Atmosfera, Nevoeiro, Chuva & Vento).

## 2. Project Type
**WEB** (Next.js, Three.js, React).

## Success Criteria
- O painel DM do Combat Grid exibe controles deslizantes (sliders) precisos para Sol, Céu, Nevoeiro e Chuva.
- O Sol pode ser escalado visualmente (tamanho do disco e do lens flare).
- As intensidades de iluminação (sol e ambiente) podem ser reguladas livremente.
- O nevoeiro de chão pode ter sua densidade, altura de cobertura e velocidade de movimento controladas.
- A chuva pode ter sua quantidade, velocidade de queda, tamanho das gotas e direção do vento (ângulo) alterados dinamicamente.
- Todas as alterações são renderizadas em tempo real sem travamentos no canvas 3D.
- Compilação limpa com TypeScript check passando de primeira.

## 3. Tech Stack
- **Visual/3D:** Three.js, WebGL, custom GLSL shaders (já existentes e aprimorados).
- **Interface:** React, TailwindCSS, Lucide React (ícones), Radix UI (Popover/Collapsible).

## 4. Open Questions & Socratic Gate

### Questões Críticas para o Usuário:
1. **Direção do Vento/Chuva:** Você prefere controlar a inclinação da chuva usando dois sliders separados para Eixo X e Eixo Z, ou um controle de **Direção do Vento (Azimute 0-360°)** + **Força do Vento**? A segunda opção é mais dinâmica e realista.
2. **Cores Customizadas:** Devemos expor seletores de cor para o Sol e para o Nevoeiro, ou as cores devem continuar sendo calculadas automaticamente com base no horário do dia (Dia, Pôr do Sol, Noite)?
3. **Persistência de Dados:** Essas configurações avançadas de clima devem ser salvas permanentemente na campanha (Supabase) ou apenas mantidas em memória para a sessão ativa de combate do DM?

---

## 5. Proposed Changes & File Structure

### Components & Modules to Edit
- [MODIFY] [BattleSkyDome.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/battle-3d/BattleSkyDome.ts):
  - Adicionar suporte a `sunScale` para dimensionar o Lens Flare e posicionar a malha do sol de forma a cobrir/substituir o sol fixo do shader.
- [MODIFY] [WeatherEffects.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/battle-3d/WeatherEffects.tsx):
  - Atualizar `createRainParticleSystem` para aceitar `rainIntensity`, `rainSpeed`, `rainDropSize` e `windDirection` (inclinação horizontal).
  - Atualizar `createGroundFogSystem` para aceitar `fogDensity` (contagem de puffs), `fogHeight` (alcance em Y) e `fogSpeed` (drift speed).
- [MODIFY] [BattleEnvironment.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/battle-3d/BattleEnvironment.tsx):
  - Integrar os novos parâmetros na calculadora de iluminação e na inicialização da cena.
- [MODIFY] [BattleControlsToolbar.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/battle-3d/BattleControlsToolbar.tsx):
  - Redesenhar a interface do popover "Clima & Luz" transformando-a em abas ou seções retráteis organizadas, com todos os sliders expostos.
- [MODIFY] [BattleGrid3D.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/BattleGrid3D.tsx):
  - Atualizar o estado reativo `internalEnv`, as referências de frame do loop `animate()` e as instâncias de atualização dos sistemas de chuva e névoa.

---

## 6. Task Breakdown

| Task ID | Componente | Descrição do Trabalho | Responsável |
| :--- | :--- | :--- | :--- |
| **TSK-01** | `WeatherEffects.tsx` | Parametrizar a física e o tamanho das gotas na chuva, e a densidade/altura no nevoeiro rasteiro. | `game-developer` |
| **TSK-02** | `BattleSkyDome.ts` | Adicionar suporte ao redimensionamento do sol e lens flare no Sky Dome. | `game-developer` |
| **TSK-03** | `BattleEnvironment.tsx` | Atualizar os modelos de cálculo de luz total (sun e ambient) dinamicamente. | `game-developer` |
| **TSK-04** | `BattleGrid3D.tsx` | Propagar e sincronizar o estado expandido do clima no loop do Three.js. | `frontend-specialist` |
| **TSK-05** | `BattleControlsToolbar.tsx` | Criar o painel UI expandido com categorias separadas estilo Unreal Engine. | `frontend-specialist` |

---

## Phase X: Verification

- [ ] Executar `npx tsc --noEmit` para garantir ausência de erros de tipagem.
- [ ] Testar modificação manual do tamanho do sol e brilho das luzes.
- [ ] Mudar a direção do vento e ver as gotas de chuva inclinando-se na direção correta.
- [ ] Alterar a altura do Ground Fog e verificar se cobre adequadamente a base das miniaturas.
- [ ] Checagem contra regras do projeto: Sem cores proibidas, layout limpo e responsivo.
