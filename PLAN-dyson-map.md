# Projeto: Refatoração do Mapa Tático (Estilo Dyson Logos Premium)

**Tipo de Projeto:** WEB
**Agente Principal:** `frontend-specialist`

## Visão Geral
Substituir o grid CSS de `MapMaker.tsx` por um sistema de renderização em HTML5 Canvas interativo e procedural de alta fidelidade visual. O novo mapa trará uma estética de desenho à mão livre (Estilo Dyson Logos), incorporando névoa de guerra dinâmica baseada no campo de visão (Line of Sight/Fog) dos personagens e ferramentas profissionais para mestres de RPG, como calibração de grid para mapas externos.

---

## Recursos Premium Planejados

### 1. Sistema Dinâmico de Névoa & Visão (Fog of War)
- **Névoa Dinâmica:** A tela será coberta por uma névoa preta texturizada (estilo nanquim envelhecido ou sépia escura).
- **Círculos de Visão:** Cada token de personagem ativo projetará um círculo de luz com bordas suavizadas por gradiente radial (`globalCompositeOperation = 'destination-out'`).
- **Persistência de Exploração:** 
  - *Áreas Não Exploradas (Preto Total):* Terreno e hachuras totalmente ocultos.
  - *Áreas na Visão do Personagem (Revelado):* Visão clara com as cores e hachuras originais.
  - *Áreas Exploradas, mas Fora da Visão (Névoa de Memória - Opcional/Premium):* Renderizadas em tons de cinza ou com 50% de opacidade para simular que o personagem sabe o que tem lá, mas não vê em tempo real.
- **Movimentação do Grupo:** Seletor para mover o grupo inteiro unido ou tokens individualmente, atualizando o campo de visão dinamicamente.

### 2. Estilos Procedurais de Terreno (Caneta Dyson)
Todas as texturas serão geradas via código no Canvas usando funções estáticas de tremulação (wobble) para simular caneta nanquim clássica de D&D:
- **Paredes (`wall`):** Contornos grossos e hachuras densas de sombreamento (Dyson Crosshatching) que se espalham de forma degradê para fora das salas.
- **Água (`water`):** Hachuras onduladas horizontais e paralelas (linhas onduladas imitando ondas clássicas de cartografia antiga).
- **Grama (`grass`):** Pequenos tufos dispersos de 3-4 traços finos e levemente inclinados desenhados proceduralmente.
- **Armadilhas (`trap`):** Textura de rachaduras finas no chão ou pequenas runas desenhadas no estilo Dyson.
- **Portas (`door`):** Representação cartográfica de porta com linhas duplas e dobradiças simples desenhadas à mão.

### 3. Ferramenta de Sincronização de Grid (Grid Calibration)
Para mapas importados (upload de imagens JPG/PNG):
- **Calibrador Visual:** Ferramenta na toolbar que permite ao mestre desenhar um segmento de linha sobre o mapa correspondente a 1 quadrado (1,5m / 5ft). O sistema calcula automaticamente o tamanho ideal do grid (`CELL_SIZE`) para coincidir com a imagem de fundo.
- **Ajuste Fino:** Controles de offset (X e Y) e escala (Zoom do Grid) para alinhar perfeitamente as linhas com o mapa desenhado.

---

## Critérios de Sucesso
- Renderização procedural fluida a 60 FPS durante panning e zoom.
- Alinhamento de grid perfeito com erro de calibração inferior a 2 pixels.
- Persistência e sincronização de dados de névoa (`fog` e `explored` por célula) no banco de dados através da API de cenas.

---

## Arquitetura de Componentes Proposta
```text
/components/
  └── map/
      ├── DysonMap.tsx          # Componente principal do mapa (Orquestrador Canvas)
      ├── DysonCanvas.tsx       # Subcomponente para o desenho do canvas base (terreno, hachuras)
      ├── InteractionOverlay.tsx# Captura de cliques, drag e régua de medição
      └── dysonCore.ts          # Algoritmos de renderização procedural e calibração de grid
```

---

## Divisão de Tarefas (Implementação)

### Tarefa 1: Desenvolver os Algoritmos Procedurais no `dysonCore.ts`
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Descrição:** Implementar os motores de hachura para todos os tipos de terreno em TypeScript:
  - Desenho de linhas wobbly com ruído estático determinístico (coordenada-base).
  - Hachura de parede, ondas de água, tufos de grama e símbolos de armadilha.
  - Função de calibração matemática baseada em dois cliques de mouse para definir o tamanho da célula.
- **INPUT:** Coordenadas e contexto canvas (`CanvasRenderingContext2D`).
- **OUTPUT:** Biblioteca de utilitários de desenho procedural isolada do React.
- **VERIFY:** Funções puras que desenham de forma idêntica para os mesmos inputs (sem animações flutuantes/cintilantes).

### Tarefa 2: Criar o Componente `DysonCanvas` com Camadas
- **Agente:** `frontend-specialist` | **Skill:** `react-best-practices`
- **Descrição:** Criar o componente de renderização em camadas para otimizar performance:
  - *Layer 1 (Background/Terreno):* Desenha o mapa procedural ou a imagem de fundo calibrada. Atualiza apenas ao editar o mapa.
  - *Layer 2 (Tokens & Régua):* Desenha os círculos dos personagens, caminhos de movimentação e régua de distância.
  - *Layer 3 (Névoa Dinâmica):* Desenha a máscara de névoa preta e recorta os círculos de luz usando a posição atual dos tokens.
- **INPUT:** Estado da cena, tokens e dados da grade.
- **OUTPUT:** Componente React que encapsula a lógica de múltiplas telas `<canvas>` sobrepostas e sincronizadas no zoom/pan.
- **VERIFY:** Testar performance com 30+ tokens na tela movendo-se ao mesmo tempo.

### Tarefa 3: Implementar a Interface do Calibrador de Grid
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Descrição:** Criar uma UI simples e intuitiva de calibração que abre ao carregar um mapa externo.
  - Instruções na tela: "Desenhe uma linha em cima de um quadrado do grid para sincronizar".
  - Slider para ajustar deslocamento horizontal/vertical e o tamanho da grade.
- **INPUT:** Upload do arquivo de imagem do usuário.
- **OUTPUT:** Grid sincronizado e escalado de forma inteligente sobre o mapa carregado.
- **VERIFY:** Subir uma imagem de mapa de D&D famosa e testar a precisão da régua de 1,5m em várias áreas dele.

### Tarefa 4: Integração de Estado no `MapMaker.tsx` e Sincronização
- **Agente:** `frontend-specialist` | **Skill:** `app-builder`
- **Descrição:** Substituir o grid HTML antigo pela nova solução. Ligar a movimentação de tokens ao estado da cena e persistência automática de revelação do mapa (névoa).
- **INPUT:** APIs de sincronização de cena do `useSession`.
- **OUTPUT:** Mapa tático integrado ao sistema principal.
- **VERIFY:** Atualizar a cena e verificar se a névoa limpa de forma persistente após reabrir a página.

---

## ✅ Fase X: Verificação Final
- [ ] Renderização procedural e suave em zoom e panning.
- [ ] Névoa de guerra gradiente revela o mapa em tempo real ao arrastar os tokens.
- [ ] Hachuras de grama, água, portas e armadilhas assemelham-se a mapas clássicos de D&D desenhados à mão.
- [ ] Calibração do grid de mapas externos permite que a régua funcione perfeitamente.
- [ ] Executar script de testes e UX: `python .agent/scripts/verify_all.py .`
