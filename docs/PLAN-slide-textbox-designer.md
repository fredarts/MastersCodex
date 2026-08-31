# Plano de Implementação Aprimorado: Designer de Caixas de Texto & Overlays RPG para Slideshow

## 🎯 Objetivo & Visão Geral
Permitir que o Mestre crie e personalize **múltiplas caixas de texto e legendas sobrepostas (Text Overlays)** por slide, com controle total de **título customizado, posição na tela (ancoragem), largura, tipografia e presets estilizados de RPG** (Pergaminho, Arcano, Grimdark, Imperial, Taverna Rústica, Cinemático).

---

## 🛡️ Análise de Pontos Cegos & Medidas Preventivas

| Ponto Cego / Risco Potencial | Impacto | Medida Preventiva Implementada |
|---|---|---|
| **1. Cenas Legadas com `overlayText` simples** | Cenas antigas poderiam não exibir suas legendas se o código esperar apenas `textOverlays[]`. | **Normalizador Unificado (`getEffectiveSlideOverlays`)**: Se `textOverlays` for vazio mas existir `overlayText`, cria dinamicamente 1 overlay padrão mantendo 100% de retrocompatibilidade. |
| **2. Conflito de Z-Index & Transições WebGL** | O canvas WebGL poderia sobrepor o texto ou causar corte de renderização. | Camada de overlay com `z-10 absolute inset-0 pointer-events-none` e animação CSS suave `animate-fade-in` sincronizada na troca de slides. |
| **3. Múltiplas Caixas na Mesma Posição** | Se o usuário criar 2 caixas em `bottom-center`, elas poderiam se sobrepor uma em cima da outra. | **Agrupador por Zonas de Ancoragem**: O renderizador agrupa as caixas por zona (`top`, `center`, `bottom` / `left`, `center`, `right`) e as empilha em `flex flex-col gap-2`. |
| **4. Responsividade & Proporções de Tela (`16:9`, `4:3`, `1:1`, `9:16`, TV)** | Textos grandes poderiam estourar a altura do slide em telas mobile ou na TV. | Tipografia responsiva (`text-xs sm:text-sm md:text-base`) com `max-h-[35%]` e `line-clamp` adaptativo com barra de rolagem sutil se necessário. |
| **5. Ergonomia de Edição Rápida vs Avançada** | Abrir modal complexo para uma legenda simples seria cansativo para o Mestre. | **Edição em Dois Níveis**: Edição inline rápida no card do slide + botão com ícone de paleta **"🎨 Designer Visual de Legendas"** para edição detalhada com presets. |
| **6. Persistência em JSONB no Supabase & LocalStorage** | Propriedades novas poderiam ser filtradas se não mapeadas. | Tipagem estrita de `SlideTextOverlay` na interface `SceneImage` e validação nos mappers. |

---

## 🎨 Especificação dos Presets Visuais RPG

1. **📜 Pergaminho Antigo & Grimório**:
   - *Aparência*: Fundo pergaminho escurecido (`#1c160f/90`), borda dupla em ouro envelhecido (`border-amber-600/50`), texto em tom papiro claro (`text-amber-100`), fonte serifada clássica.
2. **🔮 Éter Arcano & Místico**:
   - *Aparência*: Fundo translúcido azul-índigo profundo (`#0b0d1b/85`), borda com brilho ciano suave (`border-cyan-500/40`), brilho neon arcano, texto com aura luminosa.
3. **⚔️ Dark Fantasy & Grimdark**:
   - *Aparência*: Fundo preto fosco de ferro (`#0c0d10/95`), borda afiada de aço escuro (`border-slate-600`), texto cinza-prateado gótico com toques de rubi/sangue seco.
4. **👑 Nobreza Imperial & Épico**:
   - *Aparência*: Fundo aveludado régio (`#15121e/90`), moldura dourada polida com cantos chanfrados (`border-amber-400/60`), tipografia serifada imponente com título dourado em caixa alta.
5. **🪓 Rústico Nórdico / Taverna**:
   - *Aparência*: Fundo tom carvalho escuro (`#1a140e/90`), borda de bronze forjado (`border-amber-700/60`), tipografia robusta e acolhedora.
6. **🎬 Cinemático Minimalista**:
   - *Aparência*: Faixa preta semi-transparente fosca elegante sem bordas (`bg-black/75 backdrop-blur-md`), tipografia limpa e moderna para foco total na imagem.

---

## 📐 Modelagem de Dados (`lib/types.ts`)

```typescript
export type OverlayBoxStylePreset = 
  | 'cinematic' 
  | 'scroll_parchment' 
  | 'arcane_ether' 
  | 'dark_fantasy' 
  | 'imperial_gold' 
  | 'rustic_tavern';

export type OverlayBoxPosition = 
  | 'bottom-center' 
  | 'bottom-left' 
  | 'bottom-right' 
  | 'top-center' 
  | 'top-left' 
  | 'top-right' 
  | 'center';

export type OverlayBoxWidth = 'compact' | 'medium' | 'wide' | 'full';

export interface SlideTextOverlay {
  id: string;
  title?: string; // Título customizado ou nome do orador
  text: string;   // Conteúdo / fala / descrição
  position?: OverlayBoxPosition;
  width?: OverlayBoxWidth;
  stylePreset?: OverlayBoxStylePreset;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  textAlign?: 'left' | 'center' | 'right';
  showTitle?: boolean;
}

export interface SceneImage {
  id: string;
  imageUrl: string;
  overlayText?: string; // Legado mantido para compatibilidade
  secretNotes?: string;
  mediaType?: 'image' | 'video';
  aspectRatio?: SlideAspectRatio;
  textOverlays?: SlideTextOverlay[]; // Nova lista de overlays customizáveis
}
```

---

## 🏗️ Estrutura de Componentes

1. **`components/session/SlideTextOverlayRenderer.tsx` [NOVO]**:
   - Renderizador universal e reutilizável.
   - Agrupa as caixas por 7 zonas de posicionamento:
     - `top-left`, `top-center`, `top-right`
     - `center`
     - `bottom-left`, `bottom-center`, `bottom-right`
   - Aplica os presets CSS estilizados e garante que `pointer-events-none` não atrapalhe a interação do preview.
2. **`components/session/SlideOverlayEditorModal.tsx` [NOVO]**:
   - Modal interativo WYSIWYG com abas de cada caixa de texto do slide ativo.
   - Adicionar nova caixa (`+ Adicionar Caixa`), remover caixa, alterar título, texto, posição, largura, tamanho da fonte e preset visual com miniatura de preview.
3. **`components/session/SceneSlideshowStudio.tsx` [ATUALIZAÇÃO]**:
   - Renderiza o `SlideTextOverlayRenderer` no Live Preview do lado esquerdo.
   - Adiciona o botão **"🎨 Estilizar Legendas & Caixas"** no card do slide à direita.
4. **`components/live-cockpit/LiveVisualMirror.tsx` & `components/PlayerViewModal.tsx` [ATUALIZAÇÃO]**:
   - Substituição do bloco estático de legenda pelo `SlideTextOverlayRenderer`, garantindo sincronia pixel-perfect entre o DM e os Jogadores.

---

## 🧪 Roteiro de Testes e Validação
1. **Multi-caixa**: Criar 1 caixa no topo (Título) e 1 caixa na base (Fala) no mesmo slide.
2. **Presets**: Alternar entre os 6 presets visuais e checar a estilização em tempo real.
3. **Posicionamento**: Testar `top-left`, `center`, `bottom-right` e larguras `compact`, `medium`, `wide`, `full`.
4. **Retrocompatibilidade**: Verificar que slides com `overlayText` antigo continuam aparecendo normalmente.
5. **Persistência**: Salvar a cena, recarregar a página com `F5` e validar que as caixas permanecem salvas.
6. **Compilação**: Executar `npx tsc --noEmit` garantindo **0 erros**.
