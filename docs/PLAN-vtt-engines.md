# PLAN-vtt-engines: Evolução de Motores VTT (Grid 3D, Map Maker 2D e Grafo de Lore)

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Next.js 15, Three.js, Canvas 2D)

---

## 📖 Visão Geral (Overview)

A **Fase 4** foca na expansão dos motores visuais do **Masters Codex** para oferecer uma experiência completa de VTT (Virtual Tabletop):

1. **MapMaker 2D (`components/MapMaker.tsx`)**: Upload de imagens de mapas customizados, ferramenta de régua/medição de distâncias (em pés e metros) e exportação da imagem do mapa com grid.
2. **Motor de Física dos Dados 3D (`components/Dice3DCanvas.tsx`)**: Animação 3D com rotação orgânica e física realista ao rolar d4, d6, d8, d10, d12 e d20.
3. **Grafo de Lore Interativo (`components/LoreGraph.tsx`)**: Visualização visual de rede com nós arrastáveis conectando Entidades do Mundo (NPCs, Facções, Reinos, Religiões).

---

## 🎯 Critérios de Sucesso (Success Criteria)

- [x] Upload de mapa de fundo (JPG/PNG/WebP) no `MapMaker.tsx` via FileReader/Base64 ou URL.
- [x] Ferramenta de Régua Dinâmica (Medição em pés/metros com base nos quadrados do grid do MapMaker).
- [x] Suporte a exportação e visualização limpa de mapas customizados.
- [x] Animação física de rolagem 3D aprimorada no `Dice3DCanvas.tsx` com desaceleração e colisão simulada nas bordas da tela.
- [x] Visualizador de Grafo 2D interativo no `LoreGraph.tsx` conectando entidades do `WorldContext` com suporte a arrastar nós e conexões visuais por SVG.
- [x] Compilação de tipos TypeScript limpa (`npx tsc --noEmit`).
- [x] Build de produção aprovado (`npm run build`).

---

## 🛠️ Stack Tecnológica & Decisões

| Recurso | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **MapMaker 2D** | HTML5 Canvas + Web APIs | Alta velocidade para desenhar linhas, grid, upload de imagem e cálculo de distâncias entre 2 pontos. |
| **Dice 3D Physics** | Three.js / Canvas 3D | Animação procedural com torque, aceleração angular e sombras dinâmicas no impacto do dado. |
| **Grafo de Lore** | SVG / Canvas 2D Custom ou d3-force simulation | Leve, responsivo e interativo para arrastar nós e desenhar conexões dinâmicas de lore sem dependências pesadas. |

---

## 📁 Estrutura de Arquivos Afeita

```
Masters Codex/
├── components/
│   ├── MapMaker.tsx        # [MODIFY] Upload de imagem, régua de medição e export PNG
│   ├── Dice3DCanvas.tsx    # [MODIFY] Física avançada de dados 3D
│   └── LoreGraph.tsx       # [MODIFY] Grafo interativo 2D de entidades do mundo
```

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

### Task 1: Upload, Régua & Exportação no MapMaker 2D (`components/MapMaker.tsx`)
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Prioridade:** P0 | **Dependências:** Nenhuma
- **Input:** `components/MapMaker.tsx`.
- **Output:**
  - Botão para carregar arquivo local de imagem (upload JPG/PNG/WebP como background).
  - Modo Régua (clicar e arrastar para medir distância em pés: 1 quadrado = 5 pés = 1.5m).
  - Botão de exportação para baixar a imagem final em formato PNG (`canvas.toDataURL()`).
- **Verificação:** `npx tsc --noEmit`.

### Task 2: Animação e Física Procedural no Dice3DCanvas (`components/Dice3DCanvas.tsx`)
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P1 | **Dependências:** Nenhuma
- **Input:** `components/Dice3DCanvas.tsx`.
- **Output:** Efeitos de vetor de aceleração, impulso de lançamento, rotação tridimensional e amortecimento (damping) ao cair na mesa.
- **Verificação:** `npx tsc --noEmit`.

### Task 3: Grafo de Lore Interativo (`components/LoreGraph.tsx`)
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Prioridade:** P1 | **Dependências:** Nenhuma
- **Input:** `components/LoreGraph.tsx` e `WorldContext`.
- **Output:** Renderização interativa dos nós representando NPCs, Facções e Locais ativos do `WorldContext`, permitindo arrastar os nós com o cursor, zoom/pan e clicar para visualizar a ficha rápida da entidade.
- **Verificação:** `npx tsc --noEmit` & `npm run build`.

---

## 🧪 Fase X: Checklist de Verificação Final (Definition of Done)

- [ ] **Verificação de Tipagem:** `npx tsc --noEmit` sem erros.
- [ ] **Build de Produção:** `npm run build` gerado com sucesso.
- [ ] **Verificação Manual:** Testar upload de imagem no MapMaker, medidor de régua, lançamento de dados 3D e manipulação de nós no LoreGraph.
