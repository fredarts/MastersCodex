# Implementation Plan - Compêndio de Monstros (113 Novas Criaturas)

Implementação e catalogação completa de 113 novas criaturas no Compêndio de Monstros do Master's Codex, integrando fichas oficiais traduzidas para PT-BR (com estatísticas D&D 5e / SRD e estatísticas customizadas fiéis para monstros especiais) com vínculo direto para as imagens 2D em `/assets/2d/Monstros/`.

## User Review Required

> [!IMPORTANT]
> A atividade contempla **113 monstros** mostrados na imagem da pasta de monstros. Para evitar estouro de limites de tokens e garantir fidelidade oficial em 100% dos dados, a implementação será dividida em **5 lotes temáticos modulares** (`lib/srd-monsters-batch-1.ts` até `batch-5.ts`).

> [!NOTE]
> Monstros que não constam na SRD aberta (por exemplo, Dragões de Gemas como Obsidiana/Safira/Ametista, Dragão Astral, Vampírico, Autômato de Batalha, Neotelídeo, etc.) receberão fichas oficiais fiéis baseadas nos livros canônicos de D&D 5e (*Fizban's Treasury of Dragons*, *Monster Manual*, *Volo's Guide to Monsters*, *Mordenkainen's Tome of Foes*), traduzidos integralmente para Português Brasileiro (PT-BR).

## Proposed Changes

### Estrutura de Arquivos e Modularização

Para manter a arquitetura limpa e escalável (idêntico ao padrão adotado para magias em `lib/srd-spells-data.ts`), criaremos arquivos de lote dedicados:

- `lib/srd-monsters-batch-1.ts` (Lote 1: 25 Criaturas - Dragões & Draconianos)
- `lib/srd-monsters-batch-2.ts` (Lote 2: 25 Criaturas - Ínferos, Celestiais & Construtos)
- `lib/srd-monsters-batch-3.ts` (Lote 3: 20 Criaturas - Licantropos, Feras & Terrores Subterrâneos)
- `lib/srd-monsters-batch-4.ts` (Lote 4: 22 Criaturas - Fadas, Aberrações & Limes)
- `lib/srd-monsters-batch-5.ts` (Lote 5: 21 Criaturas - Elementais, Clássicos & Feéricos)
- `lib/srd-monsters-data.ts` (Agregador central que combina `INITIAL_MONSTERS` com todos os lotes)
- `lib/srd-data.ts` (Importa de `lib/srd-monsters-data.ts` mantendo retrocompatibilidade)
- `scripts/populate-new-monsters.ts` (Script para sincronização no banco Supabase)

---

## Segmentação dos Lotes (Batches)

### Lote 1: Dragões & Draconianos (25 Monstros)
1. Dragão Vermelho
2. Dragão Verde
3. Dragão Vampírico
4. Dragão Radiante
5. Dragão Negro
6. Dragão Fantasma
7. Dragão Etéreo
8. Dragão de Topázio
9. Dragão de Safira
10. Dragão de Prata
11. Dragão de Ouro
12. Dragão de Ossos
13. Dragão de Obsidiana
14. Dragão de Mercúrio
15. Dragão de Latão
16. Dragão de Ferro
17. Dragão de Esmeralda
18. Dragão de Cristal
19. Dragão de Bronze
20. Dragão de Aço
21. Dragão de Ametista
22. Dragão de Adamante
23. Dragão das Sombras
24. Dragão das Profundezas
25. Dragão da Pedra da Lua

### Lote 2: Ínferos, Celestiais, Draconianos Adicionais & Construtos (25 Monstros)
26. Dragão Cobre
27. Dragão Branco
28. Dragão Azul
29. Dragão Astral
30. Dracolich
31. Dragão Tartaruga
32. Dragão Fada
33. Diabo de Ossos
34. Diabo Barbudo
35. Diabo Espinhoso
36. Diabo do Gelo
37. Diabo das Correntes
38. Demônio das Sombras
39. Demilich
40. Devorador de Almas
41. Cão Infernal
42. Dao
43. Couatl
44. Autômato de Batalha
45. Chuul
46. Deva
47. Planetar
48. Solar
49. Guardião do Escudo
50. Azer

### Lote 3: Licantropos, Feras Gigantes & Terrores Subterrâneos (20 Monstros)
51. Urso-Homem
52. Tigre-Homem
53. Javali-Homem
54. Rato-Homem
55. Lobisomem
56. Tarrasque
57. Símio Gigante
58. Pássaro Roca
59. Morcego Gigante
60. Escorpião Gigante
61. Lobo do Inverno
62. Yeti
63. Troglodita
64. Naga de Ossos
65. Beholder Zumbi
66. Thri-kreen
67. Svirfneblin - Gnomo das Profundezas
68. Neotelídeo
69. Garra Rastejante
70. Verme da Morte

### Lote 4: Fadas, Aberrações, Limes & Humanoides (22 Monstros)
71. Barrete Vermelho
72. Pixie
73. Ettercap
74. Espana Animada
75. Armadura Animada
76. Yuan-ti
77. Worg
78. Fogo Fátuo
79. Unicórnio
80. Amontoado Trêmulo
81. Sombra
82. Bruxa do Mar
83. Sátiro
84. Salamandra
85. Remorhaz
86. Pseudo dragão
87. Aranha Fásica
88. Geleia Ocre
89. Pudim Negro
90. Mantor
91. Nothic
92. Bruxa da Noite

### Lote 5: Elementais, Fiends & Clássicos do Bestiário (21 Monstros)
93. Formian
94. Glabrezu
95. Grell
96. Hezrou
97. Miconídeo
98. Nalfeshnee
99. Vrock
100. Mephit
101. Magmin
102. Lamia
103. Kraken
104. Kenku
105. Horror de Elmo
106. Ettin
107. Duergar
108. Bullywug
109. Cão Pisca
110. Marid
111. Sahuagin
112. Erinyes
113. Elemental do Raio

---

## Verification Plan

### Automated Tests
- Validação TypeScript: `npx tsc --noEmit`
- Teste de integridade de links de imagens: verificar se todos os 113 monstros apontam para arquivos existentes em `public/assets/2d/Monstros/`
- Testes unitários do compêndio: `npx vitest run lib/__tests__/srdService.test.ts`

### Manual Verification
- Acessar a aba **Compêndio > Monstros** e pesquisar pelos novos monstros por nome, tipo, ND (CR) e tamanho.
- Visualizar o modal/card com a arte do token 2D, PV, CA, atributos traduzidos, ações e habilidades.
