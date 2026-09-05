# PLAN: Sistema de Fog Volumétrico & Atmosférico Avançado (Padrão Unreal Engine 5 & Godot 4)

Este documento detalha o plano de reformulação e aprimoramento do sistema de **Fog / Nevoeiro** no motor 3D do *Masters Codex*, elevando o realismo e a flexibilidade estética para padrões de engines profissionais (Unreal Engine Exponential Height Fog, Godot 4 Volumetric Fog, Unity HDRP).

---

## 🔬 Pesquisa & Estado da Arte em Engines de Jogos

### 1. Unreal Engine 5 - *Exponential Height Fog (EHF)*
- **Decaimento Exponencial por Altura ($e^{-\text{heightFalloff} \times Y}$)**: O nevoeiro se acumula densamente nos vales, masmorras e rente ao chão, afinando suavemente conforme a altitude sobe.
- **Directional Inscattering (Espalhamento Solar)**: O nevoeiro ganha um halo incandescente e volumétrico na direção do Sol/Lua (efeito de raios solares através da névoa).
- **Volumetric Fog Turbulence (3D/2D Noise FBM)**: A névoa rasteira não é uma sopa uniforme, mas sim mechas e fios de névoa ondulantes que se deslocam com o vento.

### 2. Godot 4 & Unity HDRP
- **Start Distance (Distância de Segurança)**: Garante que os personagens imediatos e a área de combate em primeiro plano permaneçam nítidos e legíveis, enquanto as bordas do mapa e o horizonte mergulham no mistério.
- **Color Inscattering & Paletas de Ambiente**: Névoa matinal dourada, névoa noturna de cemitério (azul luar), miasma venenoso de pântano (verde esmeralda), névoa abissal/sangue (carmesim).

---

## 🎯 Objetivos do Aprimoramento

1. **Substituir o Sistema de Pontos Simples por um Shader de Chão Volumétrico em Tempo Real**:
   - Shader procedural de alta performance com Ruído Fractal (Simplex / FBM Noise) de 3 camadas.
   - Tendrils (mechas) e redemoinhos de névoa que rastejam e ondulam sobre o grid 3D em sincronia com o vetor de vento.
2. **Integração do Exponential Height Fog no Three.js**:
   - Controle de altura máxima de névoa e densidade rasteira.
   - Decaimento suave vertical sem cortes secos contra tokens ou construções.
3. **Controles Expandidos na Aba "Nevoeiro" (`BattleControlsToolbar.tsx`)**:
   - **Presets Rápidos de Estilo de Névoa**: *Natural / Matinal*, *Sombrio / Cemitério*, *Pântano Venenoso*, *Carmesim / Abissal*, *Masmorra / Gelo*.
   - **Densidade Global & Distância de Início (Start Distance)**: Ajuste para manter os combatentes nítidos e o fundo atmosférico.
   - **Altura do Cobertor de Névoa (Y-Height)**: De névoa rente aos pés (0.3m) a nevoeiro denso cobrindo personagens (2.5m).
   - **Turbulência & Escala do Ruído (Noise Scale)**: Névoa suave e difusa vs. mechas densas e recortadas.
   - **Velocidade e Ângulo de Derivação (Vento)**: Controle de fluxo do vento direcionando a névoa.
   - **Cor da Névoa & Brilho Solar**: Tintura customizável e intensidade de iluminação solar na névoa.
4. **Desempenho Extremo (Zero Lag)**:
   - 1 única draw call GPU para a névoa rasteira volumétrica + integração nativa no pipeline de iluminação do Three.js.

---

## 🏗️ Estrutura de Mudanças Proposta

### 1. Novo Shader de Névoa Rasteira (`components/battle-3d/BattleVolumetricFog.ts`)
- Módulo dedicado encapsulando o mesh horizontal com ShaderMaterial volumétrico.
- Uniforms: `uTime`, `uNoiseScale`, `uDensity`, `uHeight`, `uFalloff`, `uFogColor`, `uSunColor`, `uSunPosition`, `uWindDir`, `uWindSpeed`.

### 2. Aprimoramento de Iluminação e Fog Global (`components/battle-3d/BattleEnvironment.tsx` e `BattleGrid3D.tsx`)
- Sincronização do `scene.fog` com as cores do domo celeste e inscattering do sol.
- Atualização em tempo real dos parâmetros no loop de animação.

### 3. Reformulação Visual da Aba "Nevoeiro" (`components/battle-3d/BattleControlsToolbar.tsx`)
- Adição dos novos seletores de estilo atmosférico.
- Sliders com feedback visual refinado e valores calibrados para uso intuitivo no VTT.

---

## 📋 Divisão de Tarefas (Task Breakdown)

| ID | Arquivo / Módulo | Descrição | Especialista |
|---|---|---|---|
| **TSK-01** | `components/battle-3d/BattleVolumetricFog.ts` | Criar shader procedural GPU de névoa rasteira com FBM noise, decaimento de altura e inscattering de sol/lua. | `game-developer` |
| **TSK-02** | `components/battle-3d/BattleEnvironment.tsx` | Integrar cálculo de cores de névoa dinâmicas e decaimento exponencial com presets de iluminação. | `game-developer` |
| **TSK-03** | `components/battle-3d/BattleControlsToolbar.tsx` | Reformular a aba "Nevoeiro" com seletores de presets de névoa, sliders de ruído/turbulência, altura, vento e inscattering. | `frontend-specialist` |
| **TSK-04** | `components/BattleGrid3D.tsx` | Conectar o ciclo de vida do novo sistema de névoa volumétrica no loop de render e referências da cena. | `game-developer` |
| **TSK-05** | `lib/types.ts` & Sincronização | Garantir persistência dos parâmetros de névoa refinados no estado da cena e transmissão em tempo real. | `backend-specialist` |

---

## 🚦 Portão Socrático (Perguntas Estratégicas para o Usuário)

Antes de iniciarmos a implementação do código, confirme suas preferências:

1. **Estilos e Paletas Pré-definidas**: Gostaria que a aba trouxesse botões de 1 clique para estilos temáticos como *Névoa Matinal (Branca/Dourada)*, *Cemitério Noturno (Azulada)*, *Miasma Tóxico (Verde Pântano)* e *Abissal (Carmesim/Escura)* além do controle manual de cor?
2. **Névoa de Chão vs. Névoa de Profundidade Total**: Deseja poder usar tanto o cobertor rasteiro com mechas de ruído quanto a névoa global de distância simultaneamente?
