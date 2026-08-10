# Plano de Implementação: Compêndio Completo de Magias D&D 5e (Livro do Jogador / SRD)

> **Objetivo:** Reformular o esquema de dados de magias para capturar todas as propriedades essenciais de 5ª Edição (escola, componentes V/S/M com materiais e consumo, ritual, concentração, forma da área de efeito - leque, cone, baforada, esfera, cubo, linha - dano, TR, classes), popular **todas as 319 magias do SRD 5e / Livro do Jogador** no banco de dados Supabase e compêndio local, e atualizar as interfaces visuais (`CompendiumView`, `SpellCompendiumModal`, `CompendiumModal`).

---

## 1. Mapeamento da Nova Estrutura da Magia (`SRDSpell`)

### 1.1 Tipos e Interfaces TypeScript (`lib/types.ts` & `lib/srd-compendium.ts`)

```typescript
export type SpellSchool =
  | 'Abjuração'
  | 'Adivinhação'
  | 'Conjuração'
  | 'Encantamento'
  | 'Evocação'
  | 'Ilusão'
  | 'Necromancia'
  | 'Transmutação';

export type SpellAreaShape =
  | 'cone'             // Cone / Leque (ex: Mãos Flamejantes, Cone de Frio)
  | 'cube'             // Cubo (ex: Névoa Assassina, Escuridão)
  | 'cylinder'         // Cilindro (ex: Coluna de Chamas)
  | 'line'             // Linha (ex: Relâmpago)
  | 'sphere'           // Esfera / Baforada (ex: Bola de Fogo)
  | 'square'           // Quadrado
  | 'wall'             // Parede (ex: Muralha de Fogo)
  | 'single_target'    // Alvo Único (ex: Míssil Mágico, Imobilizar Pessoa)
  | 'multiple_targets' // Múltiplos Alvos (ex: Raio de Ruína)
  | 'self'             // Pessoal / Em Si Mesmo (ex: Escudo Mágico, Passo Nebuloso)
  | 'touch'            // Toque (ex: Curar Ferimentos, Voo)
  | 'special';         // Especial

export interface SpellComponents {
  verbal: boolean;               // V (Verbal)
  somatic: boolean;              // S (Somático / Gestual)
  material: boolean;             // M (Material / Ingredientes)
  materialsDescription?: string; // Descrição dos materiais (ex: "uma bolinha de guano de morcego e enxofre")
  costly?: boolean;              // O ingrediente possui custo em PO? (ex: diamante de 300 PO)
  consumed?: boolean;            // O ingrediente é consumido ao conjurar?
  raw: string;                   // Texto formatado (ex: "V, S, M (guano de morcego e enxofre)")
}

export interface SpellTargetArea {
  type: 'target' | 'area' | 'self' | 'touch' | 'special';
  shape?: SpellAreaShape;
  sizeValue?: number;            // ex: 6 (metros)
  sizeUnit?: 'm' | 'ft';          // 'm' ou 'ft'
  formatted?: string;            // ex: "Esfera de 6m (20ft) de raio", "Leque/Cone de 4.5m", "Linha de 30m"
}

export interface SpellDamageSave {
  damageDice?: string;           // ex: "8d6", "1d8 + mod", "1d10"
  damageType?: string;           // ex: "Fogo", "Força", "Radiante", "Necrótico", "Cura", "Gelo", "Elétrico"
  saveStat?: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'; // Teste de Resistência
  saveEffect?: 'none' | 'half' | 'negate' | 'special';      // Sucesso reduz pela metade, anula, etc.
  attackType?: 'melee_spell' | 'ranged_spell' | 'save' | 'utility' | 'none';
}

export interface SRDSpell {
  id: string;
  name: string;                  // Nome em PT (ex: "Bola de Fogo (Fireball)")
  englishName?: string;           // Nome original em EN (ex: "Fireball")
  level: number;                 // 0 (Truque) até 9 (9º Nível)
  school: SpellSchool;
  castingTime: string;           // ex: "1 ação", "1 ação bônus", "1 reação", "10 minutos"
  range: string;                 // ex: "45 metros (150 pés)", "Toque", "Pessoal"
  duration: string;              // ex: "Instantânea", "Concentração, até 1 hora"
  concentration: boolean;        // Requer Concentração? (true/false)
  ritual: boolean;               // Pode ser conjurada como Ritual? (true/false)
  components: SpellComponents;   // Estrutura detalhada de ingredientes e gestos
  targetArea: SpellTargetArea;   // Forma da magia (alvo, leque, cone, esfera, linha, etc.)
  damageSave?: SpellDamageSave;  // Dados de dano, salvaguarda e tipo de ataque
  description: string;           // Descrição completa dos efeitos da magia
  higherLevels?: string;         // Efeito quando conjurada em níveis superiores ("Em Níveis Superiores")
  classes: string[];             // Classes que têm acesso ("Bardo", "Clérigo", "Druida", "Feiticeiro", "Bruxo", "Mago", "Paladino", "Patrulheiro")
}
```

---

## 2. Alterações no Banco de Dados (Supabase Migration)

### Migration SQL: `supabase/migrations/20260810_enhance_srd_spells_schema.sql`

```sql
-- Migration: Enhance SRD Spells Schema with Detailed Components, Areas, Concentration, Rituals & Damage
ALTER TABLE public.srd_spells
  ADD COLUMN IF NOT EXISTS english_name TEXT,
  ADD COLUMN IF NOT EXISTS concentration BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ritual BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS components_detail JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_area JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS damage_save JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS higher_levels TEXT;

-- Indexes for lightning fast filtering
CREATE INDEX IF NOT EXISTS idx_srd_spells_concentration ON public.srd_spells (concentration);
CREATE INDEX IF NOT EXISTS idx_srd_spells_ritual ON public.srd_spells (ritual);
```

---

## 3. Dataset Completo de Magias (319 Magias do Livro do Jogador / SRD)

### Criar `lib/srd-spells-data.ts`
- Mapear **todas as 319 magias** oficiais do SRD 5e em português/inglês com todos os metadados estruturados.
- Categorização completa por Nível (0 a 9) e Escola.
- Inclusão dos parâmetros de área/alvo, componentes V/S/M, custo de material, ritual e concentração.

---

## 4. Scripts de Povoamento e Automação

1. `scripts/populate-srd-spells.ts`: Script TypeScript para upsert em lote da tabela `srd_spells` via cliente Supabase Admin/Service Role.
2. `scripts/populate-srd-spells.js`: Script de execução direta via Node/Postgres (`pg`) para ambientes CI/CD ou locais.

---

## 5. Atualização da Camada de Repositório e Serviços (`srdService.ts`)

- Atualizar `SpellQueryFilter` para permitir filtros avançados:
  - `class`: Filtrar por classe de conjurador.
  - `concentration`: Somente com/sem concentração.
  - `ritual`: Somente rituais.
  - `shape`: Filtrar por formato de área (cone/leque, esfera, linha, etc.).
- Normalizar o retorno da consulta do Supabase mapeando as colunas JSONB para a interface `SRDSpell`.

---

## 6. Atualização dos Componentes de Interface (UI/UX)

### 6.1 `components/CompendiumView.tsx` (Compêndio Principal)
- **Barra de Filtros Expandida**:
  - Filtro por Nível (Truques a 9º Nível)
  - Filtro por Escola (Evocação, Conjuração, etc.)
  - Filtro por Classe (Mago, Clérigo, Bruxo, Bardo, Druida, Paladino, Patrulheiro, Feiticeiro)
  - Toggle de Filtro: **Apenas Rituais** (📜) e **Apenas Concentração** (🧘)
  - Filtro por Formato/Área (📐 Cone/Leque, 🟢 Esfera, ⚡ Linha, 🎯 Alvo Único, 🖐️ Toque, etc.)
- **Painel de Detalhes da Magia (Card Estilizado BG3/D&D 5e Premium)**:
  - Cabeçalho com Nome PT/EN, Nível, Escola e Badges de Classes.
  - Grade de Badges de Metadados:
    - ⏳ **Tempo de Conjuração**
    - 📏 **Alcance**
    - ⏱️ **Duração**
    - 🧘 **Concentração** (Sim/Não)
    - 📜 **Ritual** (Sim/Não)
    - 🧪 **Componentes**: Badges visuais [V] [S] [M] + destaque da caixa de materiais e consumo.
    - 📐 **Alvo / Área de Efeito**: Badge com ícone do formato da magia (Leque/Cone, Esfera, Linha, Alvo Único, etc.).
    - ⚔️ **Dano & Salvaguarda**: Destaque de TR (DEX, CON, WIS...), Tipo de Dano e Dado de Dano com botão de **Rolagem de Dano Interativa** conectada ao Live Cockpit.
  - Seção de Descrição com tipografia de alta legibilidade.
  - Caixa em destaque para "Em Níveis Superiores".

### 6.2 `components/character-sheet/Modals/SpellCompendiumModal.tsx`
- Atualizar o modal de seleção de magias da Ficha de Personagem para exibir os novos atributos (V, S, M, Ritual, Concentração, Área) ao adicionar magias ao grimório/conhecidas do personagem.

---

## 7. Plano de Verificação e Testes

- **Testes Unitários**: Executar `npm test lib/__tests__/srdService.test.ts` garantindo parsing correto da nova estrutura.
- **Teste de Carga / Povoamento**: Rodar o script de população e verificar no Supabase se 319 magias estão registradas com sucesso.
- **Testes E2E com Playwright**: Executar `npx playwright test` para validar a navegação e os filtros da aba de magias no Compêndio.
