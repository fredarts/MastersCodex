# Plano de Projeto: Ficha de Monstros e Feras do Worldbuilder

Este plano detalha o design técnico e as tarefas de implementação para permitir que o mestre crie fichas completas de "Monstros e Feras" no Worldbuilder e as insira diretamente em combates e encontros no Session Studio.

---

## Overview

### O Problema
Atualmente, o Session Studio permite apenas adicionar monstros padrão do compêndio SRD ou criar combatentes "vazios" manualmente. Por outro lado, as entidades criadas no Worldbuilder (como NPCs ou Bestas) são puramente narrativas e não possuem dados de combate estruturados (como CA, PV, atributos e ações), impedindo que o mestre monte combates personalizados usando as criaturas que ele mesmo criou no cenário de campanha.

### A Solução
1. **Adicionar Categoria 'monster' (Monstro)** no banco de dados e nos tipos do TypeScript.
2. **Criar Tabela `entity_stat_sheets`** no Supabase para armazenar fichas de combate detalhadas vinculadas a qualquer entidade (NPC, Fera ou Monstro).
3. **Formulário com Abas no Worldbuilder**: Modificar o modal de criação de entidades para incluir abas (Descrição Narrativa e Estatísticas de Combate) quando a entidade for do tipo NPC, Monstro ou Besta.
4. **Integração no Encontro**: Criar abas na tela de adicionar monstros do Session Studio, permitindo selecionar monstros oficiais da SRD ou monstros/feras customizados do Mundo do mestre (carregando seus atributos de combate reais da tabela/localStorage).

---

## Project Type
- **WEB** (Next.js / React / TypeScript / Supabase / LocalStorage)

---

## Success Criteria
- [ ] O Mestre consegue criar um Monstro no Worldbuilder e preencher sua ficha (CA, PV, Velocidade, CR, XP, Atributos de 1 a 20, Habilidades Especiais e Ações).
- [ ] A tela de Encontro do Session Studio exibe abas separadas: "Monstros SRD" e "Monstros do Mundo".
- [ ] Ao adicionar um monstro do mundo com uma quantidade X (ex: 2), as cópias são criadas com os dados corretos da ficha do Worldbuilder e nomes ordenados (ex: "Dragão Vermelho 1").
- [ ] O sistema funciona perfeitamente em modo Supabase e em modo offline (LocalStorage).

---

## Tech Stack
- **Database**: Supabase PostgreSQL (SQL Migrations + RLS)
- **Local Cache**: LocalStorage (para suporte offline em ambientes sem conexão)
- **Framework**: React / Tailwind CSS / Lucide Icons

---

## File Structure

Novos arquivos e arquivos afetados pelo plano:

```
├── supabase
│   └── migrations
│       └── 20260810_add_monster_category_and_stat_sheets.sql [NEW] (Banco de Dados)
├── lib
│   ├── types.ts                                            [MODIFY] (Tipos TypeScript)
│   ├── repositories
│   │   ├── contracts
│   │   │   └── IWorldRepository.ts                         [MODIFY] (Assinaturas do Repositório)
│   │   ├── offline
│   │   │   └── LocalStorageWorldRepository.ts              [MODIFY] (Armazenamento offline)
│   │   └── supabase
│   │       └── SupabaseWorldRepository.ts                  [MODIFY] (Querys Supabase)
│   └── services
│       └── worldService.ts                                 [MODIFY] (Serviço de Fachada)
└── components
    ├── WorldEntityModal.tsx                                [MODIFY] (Formulário do Worldbuilder com Abas)
    └── SessionStudio.tsx                                   [MODIFY] (Abas no Encontro e Combate)
```

---

## Task Breakdown

### Fase 1: Banco de Dados e Contratos de Tipo (Foundation - P0)

#### Task 1: Criar Migração do Supabase
- **Agente**: `database-architect`
- **Skills**: `database-design`
- **INPUT**: Schema existente em `supabase/schema.sql`.
- **OUTPUT**: Criar migration [20260810_add_monster_category_and_stat_sheets.sql](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/supabase/migrations/20260810_add_monster_category_and_stat_sheets.sql) contendo:
  - Adição de `'monster'` à constraint `world_entities_category_check`.
  - Tabela `entity_stat_sheets` (vínculo 1-para-1 com `world_entities`, campos de ficha D&D 5e: HP, CA, CR, habilidades, ações em formato JSONB).
  - Políticas de RLS habilitadas para usuários autenticados.
- **VERIFY**: Executar localmente a migração e conferir se as tabelas foram criadas com RLS ativo.

#### Task 2: Atualizar Definições de Tipos
- **Agente**: `backend-specialist`
- **Skills**: `clean-code`
- **INPUT**: [types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts).
- **OUTPUT**: Modificar o arquivo de tipos:
  - Adicionar `'monster'` à união `WorldEntityCategory`.
  - Exportar interface `EntityStatSheet` com os campos de combate completos.
- **VERIFY**: Rodar `npx tsc --noEmit` para validar os tipos.

---

### Fase 2: Camada de Repositórios e Serviços (Backend Core - P1)

#### Task 3: Atualizar Interfaces e Repositório Supabase
- **Agente**: `backend-specialist`
- **Skills**: `api-patterns`
- **INPUT**: [IWorldRepository.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/repositories/contracts/IWorldRepository.ts) e [SupabaseWorldRepository.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/repositories/supabase/SupabaseWorldRepository.ts).
- **OUTPUT**:
  - Declarar `fetchEntityStatSheet(entityId)` e `saveEntityStatSheet(sheet)` no contrato.
  - Implementar no SupabaseRepository as querys para buscar/upsertar na tabela `entity_stat_sheets`.
- **VERIFY**: Compilação TypeScript bem-sucedida.

#### Task 4: Implementar Repositório Offline (LocalStorage)
- **Agente**: `backend-specialist`
- **Skills**: `api-patterns`
- **INPUT**: [LocalStorageWorldRepository.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/repositories/offline/LocalStorageWorldRepository.ts).
- **OUTPUT**:
  - Implementar persistência dos `entity_stat_sheets` no localStorage usando a chave `codex_entity_stat_sheets`.
- **VERIFY**: Executar teste de repositórios integrados se disponível.

#### Task 5: Expor Métodos no Serviço
- **Agente**: `backend-specialist`
- **Skills**: `api-patterns`
- **INPUT**: [worldService.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/services/worldService.ts).
- **OUTPUT**:
  - Expor `fetchEntityStatSheet` e `saveEntityStatSheet` com padrão `Result<T>`.
- **VERIFY**: TypeScript compilando.

---

### Fase 3: Interface do Worldbuilder - Ficha no Modal (UI/UX - P2)

#### Task 6: Projetar Modal de Entidades com Abas de Estatísticas
- **Agente**: `frontend-specialist`
- **Skills**: `frontend-design`
- **INPUT**: [WorldEntityModal.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/WorldEntityModal.tsx).
- **OUTPUT**:
  - Permitir a seleção da categoria `"monster"` (Monstros e Feras) no seletor de categorias.
  - Criar um estado de aba no topo do modal: `"description"` (Informações narrativas) e `"stats"` (Estatísticas de Combate).
  - Exibir a aba `"stats"` apenas se a categoria for `npc`, `monster` ou `beast`.
  - Na aba `"stats"`, construir um painel limpo (sem tons de roxo):
    - Grade com AC, HP, Max HP, Velocidade, CR e XP.
    - Atributos clássicos (FOR, DES, CON, INT, SAB, CAR) com modificadores automáticos em tempo real (ex: `14` exibe `+2`).
    - Seção para adicionar, listar e remover habilidades passivas e ações de ataque (inserindo nome e descrição).
  - Ligar o botão de salvar do modal para que ele salve tanto a `WorldEntity`amp; quanto a `EntityStatSheet` associada.
- **VERIFY**: Testar o modal visualmente criando/editando monstros e NPCs.

---

### Fase 4: Integração com Session Studio (Encontros - P2)

#### Task 7: Dividir Seção de Monstros em Abas e Integrar Fichas
- **Agente**: `frontend-specialist`
- **Skills**: `frontend-design`
- **INPUT**: [SessionStudio.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/SessionStudio.tsx).
- **OUTPUT**:
  - Modificar a seção "Adicionar Monstros do Compêndio SRD".
  - Adicionar um seletor de aba interna: "Monstros SRD" e "Monstros do Mundo".
  - Na aba "Monstros do Mundo", puxar da lista `worldEntities` as entidades filtradas pelas categorias `'monster'` e `'beast'`.
  - Integrar a busca do dropdown com esses monstros customizados.
  - Ao selecionar um monstro customizado, ler sua ficha de atributos correspondente (usando `worldService.fetchEntityStatSheet`). Se a ficha não existir ou não tiver dados, carregar fallbacks de combate padrão baseados nos atributos mínimos da criatura.
  - Adicionar a criatura ao encontro com seus atributos customizados de HP e CA correspondentes.
- **VERIFY**: Adicionar um monstro personalizado e ver se ele aparece listado nos combatentes com o HP e CA criados por você.

---

## Phase X: Final Verification

Executar os seguintes testes de validação para garantir a integridade do código:

```bash
# 1. Validação de Tipos TypeScript
npx tsc --noEmit

# 2. Linting de regras de estilo
npm run lint

# 3. Build de produção da aplicação
npm run build
```

---

## ✅ PHASE X COMPLETE
- Lint: [ ]
- Security: [ ]
- Build: [ ]
- Date: 
