# Projeto: Implementação da Classe Clérigo & Correções do Calculador (D&D 5e)

## Overview
Este plano visa implementar 100% da classe Clérigo no sistema do Masters Codex, adicionando sua progressão completa de níveis (1 a 20) com todas as habilidades (features) no banco de dados. 
O plano também corrige dois problemas lógicos fundamentais na arquitetura atual de cálculo de fichas:
1. **Filtro de Subclasse & Multiclasse no Recálculo**: A função `recalculateSheetDerivedStats` atualmente reconstrói a lista de habilidades ignorando a subclasse ativa do personagem e ignorando multiclasses.
2. **Canalizar Divindade em Multiclasse**: Garante que o recurso "Canalizar Divindade" não seja sobrescrito incorretamente ao combinar classes que o compartilham (como Clérigo e Paladino), respeitando o limite máximo definido pelas regras do D&D 5e (o maior valor entre as classes, não acumulando).

## Project Type
WEB / BACKEND (Lógica de Dados, Regras de D&D e Calculador)

## Success Criteria
- [ ] O objeto `CLASS_FEATURES_DB` possui todas as 15+ habilidades (features) do Clérigo (nível 1 a 20), incluindo a escolha do "Domínio da Vida" como subclasse base da SRD.
- [ ] As habilidades que dependem de uma subclasse específica são corretamente filtradas e injetadas de acordo com a escolha do usuário na UI.
- [ ] O calculador (`dnd5e-calculator.ts`) processa corretamente a progressão de usos de "Canalizar Divindade" baseada no nível do Clérigo (1 uso no Nível 2, 2 no Nível 6, 3 no Nível 18).
- [ ] A lógica de recálculo dinâmico (`recalculateSheetDerivedStats`) foi corrigida para usar o loop multiclasse correto e respeitar o filtro `requiresSubclass`.
- [ ] Testes unitários cobrem o Clérigo puro, o ganho de recursos e a regra de multiclasse de Canalizar Divindade.

## Tech Stack
- **TypeScript**: Tipagem do banco de dados local.
- **Vitest**: Framework de testes já integrado no projeto.
- **D&D 5e SRD**: Referência oficial de regras.

## File Structure
- `lib/dnd5e-data.ts`: Onde a entrada `Clérigo` será adicionada em `CLASS_FEATURES_DB`.
- `lib/dnd5e-calculator.ts`: Onde ajustaremos a função de recursos (`getClassResourcesForLevel`) e de recálculo (`recalculateSheetDerivedStats`).
- `lib/__tests__/dnd5e-calculator.test.ts`: Onde criaremos a suíte de testes unitários para a classe Clérigo.

---

## Cleric Level-by-Level Features Mapping (1-20)
Aqui está a lista completa de habilidades que serão mapeadas no `CLASS_FEATURES_DB`:

*   **Nível 1**:
    *   `Conjuração (Clérigo)`: Habilidade de conjurar magias usando Sabedoria.
    *   `Domínio Divino`: Escolha de subclasse (isSubclassChoice: true, choices: ['Domínio da Vida']).
    *   `Proficiência Bônus (Domínio da Vida)`: Concede proficiência com Armaduras Pesadas (`requiresSubclass: 'Domínio da Vida'`).
    *   `Discípulo da Vida (Domínio da Vida)`: Bônus de cura igual a 2 + nível da magia (`requiresSubclass: 'Domínio da Vida'`).
*   **Nível 2**:
    *   `Canalizar Divindade`: Recurso mágico geral (`resourceCost` de 1 canalizar_divindade).
    *   `Canalizar Divindade: Expulsar Mortos-Vivos`: Uso padrão para expulsar mortos-vivos.
    *   `Canalizar Divindade: Preservar a Vida (Domínio da Vida)`: Habilidade ativa de cura em área (`requiresSubclass: 'Domínio da Vida'`).
*   **Nível 4**:
    *   `Incremento no Valor de Habilidade`: Aumento de atributos padrão.
*   **Nível 5**:
    *   `Destruir Mortos-Vivos (ND 1/2)`: Destrói mortos-vivos fracos que falharem na salvaguarda.
*   **Nível 6**:
    *   `Canalizar Divindade (2 usos)`: Aumenta o limite do recurso para 2 por descanso.
    *   `Curador Abençoado (Domínio da Vida)`: Cura o próprio clérigo ao curar aliados (`requiresSubclass: 'Domínio da Vida'`).
*   **Nível 8**:
    *   `Incremento no Valor de Habilidade`: Aumento de atributos padrão.
    *   `Destruir Mortos-Vivos (ND 1)`: Destrói mortos-vivos com ND 1 ou menor.
    *   `Golpe Divino (1d8) (Domínio da Vida)`: Dano radiante extra em ataques com arma (`requiresSubclass: 'Domínio da Vida'`).
*   **Nível 10**:
    *   `Intervenção Divina`: Chance percentual de obter ajuda da divindade.
*   **Nível 11**:
    *   `Destruir Mortos-Vivos (ND 2)`: Destrói mortos-vivos com ND 2 ou menor.
*   **Nível 12**:
    *   `Incremento no Valor de Habilidade`: Aumento de atributos padrão.
*   **Nível 14**:
    *   `Destruir Mortos-Vivos (ND 3)`: Destrói mortos-vivos com ND 3 ou menor.
    *   `Golpe Divino (2d8) (Domínio da Vida)`: Aumenta o dano radiante extra para 2d8 (`requiresSubclass: 'Domínio da Vida'`).
*   **Nível 16**:
    *   `Incremento no Valor de Habilidade`: Aumento de atributos padrão.
*   **Nível 17**:
    *   `Destruir Mortos-Vivos (ND 4)`: Destrói mortos-vivos com ND 4 ou menor.
    *   `Cura Suprema (Domínio da Vida)`: Maximiza dados de cura (`requiresSubclass: 'Domínio da Vida'`).
*   **Nível 18**:
    *   `Canalizar Divindade (3 usos)`: Aumenta o limite do recurso para 3 por descanso.
*   **Nível 19**:
    *   `Incremento no Valor de Habilidade`: Aumento de atributos padrão.
*   **Nível 20**:
    *   `Intervenção Divina Aprimorada`: Intervenção Divina funciona automaticamente.

---

## Task Breakdown

### 1. Adicionar o Banco de Habilidades do Clérigo em `dnd5e-data.ts`
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **Priority**: P0
- **Dependencies**: Nenhuma
- **INPUT**: Habilidades do Clérigo mapeadas acima.
- **OUTPUT**: Chave `Clérigo` populada em `CLASS_FEATURES_DB`.
- **VERIFY**: Garantir que as chaves respeitam a tipagem `Omit<ClassFeature, 'id'>[]`.

### 2. Corrigir a Lógica de Recálculo Dinâmico em `dnd5e-calculator.ts`
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **Priority**: P0
- **Dependencies**: Nenhuma
- **INPUT**: Função `recalculateSheetDerivedStats` em `dnd5e-calculator.ts`.
- **OUTPUT**: Substituir a reconstrução de `classFeaturesList` para iterar por todas as classes ativas (`currentClasses`) do personagem e validar a restrição `requiresSubclass === c.subclass`, igualando a lógica correta que é executada na subida de nível.
- **VERIFY**: Garantir que as habilidades específicas de subclasses do Paladino/Mago/Guerreiro não vazem mais quando o personagem for de outras subclasses.

### 3. Implementar Lógica de Canalizar Divindade em `dnd5e-calculator.ts`
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **Priority**: P1
- **Dependencies**: Tarefa 2
- **INPUT**: Função `getClassResourcesForLevel` em `dnd5e-calculator.ts`.
- **OUTPUT**:
  1. Lógica para calcular os usos máximos do recurso `canalizar_divindade` para o Clérigo de acordo com o nível da classe.
  2. Alteração na atribuição do recurso `canalizar_divindade` para todas as classes conjuntas de modo que o valor final máximo seja calculado com um `Math.max(existingCD, classCD)`, prevenindo que um loop de classe sobrescreva e reduza os usos de outra.
- **VERIFY**: Testar o valor máximo gerado para um Clérigo nível 6 (esperado: 2 usos).

### 4. Escrever Suíte de Testes Unitários em `dnd5e-calculator.test.ts`
- **Agent**: `test-engineer`
- **Skills**: `testing-patterns`
- **Priority**: P2
- **Dependencies**: Tarefa 3
- **INPUT**: `lib/__tests__/dnd5e-calculator.test.ts`.
- **OUTPUT**: Um novo grupo `describe('Mecânicas do Clérigo')` testando:
  * O carregamento correto das habilidades no nível 1 (com e sem Domínio da Vida).
  * O recálculo dos recursos (usos de Canalizar Divindade nos níveis 2, 6 e 18).
  * A regra de multiclasse de Canalizar Divindade (Clérigo 6 + Paladino 3 deve retornar 2 usos e não 1 ou 3).
- **VERIFY**: Executar os testes via terminal: `npm run test` ou `npx vitest run`.

---

## Phase X: Verificação Final
- [ ] Executar checagem de tipos do TypeScript e Lint: `npm run lint` e `npx tsc --noEmit`.
- [ ] Executar todos os testes do projeto: `npm run test` e verificar se a nova suíte do Clérigo passou 100%.
- [ ] Testar em tempo de execução: Executar `npm run dev`, abrir a UI, criar um Clérigo com subclasse "Domínio da Vida" e verificar se as habilidades e os recursos de Canalizar Divindade aparecem corretamente na ficha de personagem.
- [ ] Garantir que o Socratic Gate foi respeitado.
