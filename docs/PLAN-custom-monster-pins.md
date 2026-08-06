# Plano de Implementação: Pinos Customizados de Monstros (Billboard 3D) com IA e Storage

Este documento detalha o plano de implementação para a criação de novos pinos de monstros para o **Battle Grid 3D**, permitindo utilizar imagens PNG sem fundo que funcionam como **Pinos Billboard** (sempre voltados para o jogador/câmera em 360°). 

Estes novos pinos são uma **opção complementar aos pinos 3D GLB já existentes**, permitindo ao Mestre e aos Jogadores escolherem na própria ficha do monstro o estilo de representação visual desejado (**Pino Billboard 2D PNG** vs **Modelo 3D GLB**).

## 🤖 Informações de Roteamento de Agentes
🤖 **Applying knowledge of `@[game-developer]` & `@[frontend-specialist]`...**

---

## 🎯 Requisitos Principais

1. **Opção de Estilo de Pino na Ficha do Monstro**:
   - Chaveador visual na ficha / modal de criação: **"Pino Billboard 2D (PNG)"** vs **"Modelo 3D (GLB)"**.
   - Permite que o usuário use a facilidade da IA para gerar imagens 2D ou use arquivos 3D GLB existentes.

2. **Renderização Híbrida no Battle Grid 3D (`Token3DMesh.tsx`)**:
   - Quando configurado como `billboard`, utiliza `THREE.Sprite` de modo que a imagem transparente **sempre aponte para a câmera do jogador**, acompanhando todas as rotações do mapa 3D em 360°.
   - Quando configurado como `3d`, renderiza o modelo 3D GLB convencional.
   - Sombra e anel de seleção mantidos no plano do chão (`y=0.02`).

3. **Modal Completo de Criação de Monstro (`CreateMonsterModal`)**:
   - Estatísticas vitais: Nome, Tipo, Tamanho, Alinhamento, ND (CR), XP, PV (HP), CA (AC), Deslocamento.
   - Atributos de Habilidade: FOR, DES, CON, INT, SAB, CAR (com modificadores calculados).
   - Lista dinâmica de Habilidades Passivas, Ações/Ataques e Magias.
   - Lore, descrição física e notas do mestre.

4. **Assistente de IA Integrado**:
   - **"Preencher com IA"**: Preenche a ficha inteira a partir de um prompt livre.
   - **"Gerar Imagem com IA"**: Gera imagem de monstro via Gemini Imagen 3 / Nano Banana.

5. **Persistência & Bucket**:
   - Upload de imagens para o bucket `campaign-assets` no Supabase Storage via `storageService`.
   - Salvar monstros na tabela `custom_monsters` (Supabase DB) com fallback para `localStorage`.
   - Aba "Meus Monstros" no `AddCombatantModal` para colocar o pino no mapa instantaneamente.
