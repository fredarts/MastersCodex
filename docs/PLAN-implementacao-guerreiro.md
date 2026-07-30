# Plano de Implementação: Guerreiro (Fighter)

Este documento detalha o plano de desenvolvimento para integrar a classe Guerreiro no aplicativo D&D 5e.

## Fase 1: Dados Base e Estrutura (lib/dnd5e-data.ts)
- **Tarefa 1.1:** Mapear a progressão de níveis (1 ao 20) no `CLASS_FEATURES_DB`.
- **Tarefa 1.2:** Adicionar recursos fundamentais na classe (Retomar o Fôlego, Surto de Ação, Indomável).
- **Tarefa 1.3:** Configurar a estrutura de incremento extra de Habilidades (Níveis 4, 6, 8, 12, 14, 16, 19) no `LevelUpModal`.

## Fase 2: Implementação de Recursos e Mecânicas Únicas (lib/dnd5e-calculator.ts)
- **Tarefa 2.1 - Retomar o Fôlego (Second Wind):**
  - Adicionar o recurso `retomar_folego` (uso: 1) em `getClassResourcesForLevel`.
  - Criar interface para acionar a cura em `ClassAbilitiesSection.tsx` (1d10 + Nível de Guerreiro).
- **Tarefa 2.2 - Surto de Ação (Action Surge):**
  - Adicionar recurso `surto_acao` em `getClassResourcesForLevel` (usos crescentes: 1 no Nível 2; 2 no Nível 17).
- **Tarefa 2.3 - Indomável (Indomitable):**
  - Adicionar recurso `indomavel` (1 no nv 9, 2 no nv 13, 3 no nv 17).
- **Tarefa 2.4 - Estilos de Luta (Fighting Style):**
  - Adicionar `choices` de estilo de luta no nível 1.
  - Modificar o `calculateArmorClass` para ler o Estilo "Defesa" (+1 CA com armadura).

## Fase 3: Subclasses (Arquétipo Marcial)
- **Tarefa 3.1 - Arquétipo Base:**
  - Adicionar Campeão (Champion).
  - Implementar o `Crítico Aprimorado` (Critica com 19 ou 20 no d20). Alterar a lógica de rolagem crítica em `CombatSection.tsx` / `dnd5e-dice.ts` para checar `critThreshold`.

## Fase 4: Integração de UI e Testes
- **Tarefa 4.1:** Renderização dos recursos (`surto_acao`, `indomavel`, `retomar_folego`) na interface.
- **Tarefa 4.2:** Testes unitários para Guerreiro em `dnd5e-calculator.test.ts` (ex: cálculo de CA com Defesa).

## Checklist de Verificação
- [ ] Retomar o Fôlego recupera 1d10 + nível?
- [ ] Estilo "Defesa" sobe o CA em +1 (se de armadura)?
- [ ] Limite de Crítico cai para 19 no Campeão?
