# 📜 PLAN: Ficha de Personagem D&D 5e Inteligente (Automação & Integração Completa)

Este plano detalha a implementação completa e automação de todos os 8 módulos da **Ficha de Personagem D&D 5e** no *Masters Codex - The Campaign Forge Tool*, dividida em 4 Fases estratégicas.

---

## 📢 Decisões Arquiteturais Principais

1. **Esquema de Banco de Dados (Supabase)**: Tabela `public.character_sheets` com a estrutura flexível `data JSONB`. Garante salvamento instantâneo, compatibilidade total com a interface `CharacterSheet` de TypeScript e baixa latência de migração.
2. **Base de Dados SRD (Magias e Equipamentos)**: Empacotamento da base oficial SRD 5.1 localmente em `lib/dnd5e-spells-srd.ts` e `lib/dnd5e-items-srd.ts`. Permite funcionamento 100% offline e buscas instantâneas.
3. **Dice Roller & Animação 3D**: Rolagens acionadas pela ficha emitem eventos realtime para o Chat da Campanha e acionam os dados visuais.

---

## 🏗️ Fases de Implementação

### 🚀 FASE 1: Persistência Supabase & Motor de Rolagem Realtime (Urgente)
- `supabase/schema.sql`: Criar a tabela `public.character_sheets` com RLS e publicação `supabase_realtime`.
- `lib/types.ts`: Adicionar tipos `DiceRollEvent` e `AdvantageMode`.
- `lib/hooks/useCharacterSync.ts`: Hook customizado para sincronização realtime DM ↔ Jogador.
- `CharacterSheetModal.tsx`: Adicionar seletor de Vantagem / Normal / Desvantagem.
- `Sections/CombatSection.tsx` & `Sections/SkillsSection.tsx`: Adicionar botões acionáveis (Click-to-Roll).
- `LiveCockpitStudio.tsx`: Permitir visualização e alteração remota da ficha pelo DM.

### 🛡️ FASE 2: Auto-Cálculos de CA, Armas e Descanso (Essencial)
- `dnd5e-calculator.ts`: Implementar `calculateArmorClass()`, `calculateWeaponAttack()`, `applyShortRest()` e `applyLongRest()`.
- `RestModal.tsx`: Modal interativo para gerenciar Descanso Curto e Descanso Longo.
- `QuickCombatBar.tsx`: Atalhos diretos de descanso e gestão de dados de vida.

### ✨ FASE 3: Compêndio de Magias SRD, Inventário & Carga (Expansão)
- `dnd5e-spells-srd.ts` & `dnd5e-items-srd.ts`: Banco de dados completo SRD 5.1.
- `Sections/SpellsSection.tsx`: Modal de Busca de Magias, gasto dinâmico de Slots e indicador de Concentração.
- `Sections/EquipmentSection.tsx`: Barra de Carga ($\text{FOR} \times 15\text{ lbs}$), conversor de moedas e toggle de itens equipados.

### 🧙 FASE 4: Character Builder Wizard & Exportação PDF/JSON (Avançado)
- `CharacterBuilderWizard.tsx`: Assistente com **Point Buy**, **Standard Array** e **Rolagem 4d6**. Subclasses (Lvl 3+) e ASI/Feats.
- `pdf-exporter.ts`: Exportador para o PDF oficial de 3 páginas de D&D 5e via `pdf-lib`.
- `json-importer.ts`: Backup em JSON e importador para D&D Beyond.

---

## 📊 Plano de Verificação

- **Testes Automatizados**: `npm run build` e testes unitários em `lib/__tests__/dnd5e-calculator.test.ts`.
- **Verificação Manual**: Teste de sincronização Realtime com dois navegadores simultâneos, validação de rolagem de dados no chat e cálculo de descanso curto/longo.
