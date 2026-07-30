# Implementação da Classe Bardo (100%)

## Visão Geral
Este plano detalha a implementação completa da classe **Bardo** (Bard) para o sistema de D&D 5e no Masters Codex. O Bardo é um conjurador versátil focado em Carisma, com habilidades únicas de suporte (Inspiração Bárdica) e versatilidade em perícias (Faz-Tudo, Especialização).

## Tipo de Projeto
WEB (Backend/Lógica e Frontend para visualização na ficha de personagem)

## Critérios de Sucesso
- [ ] Bardo disponível como opção de classe na criação de personagem.
- [ ] Atributos e proficiências iniciais aplicados corretamente (D8, testes de resistência de Destreza e Carisma, armas, ferramentas musicais).
- [ ] Sistema de Conjuração do Bardo baseado em Carisma funcionando perfeitamente (Spells Known, não preparados).
- [ ] Recurso de **Inspiração Bárdica** (Bardic Inspiration) implementado com pool baseado no modificador de Carisma e escalonamento de dado (d6 a d12).
- [ ] Recurso **Faz-Tudo** (Jack of All Trades) integrado à lógica de testes de habilidade e Iniciativa.
- [ ] Recursos **Canção de Descanso** (Song of Rest), **Especialização** (Expertise), e **Segredos Mágicos** (Magical Secrets) implementados no progression.
- [ ] Subclasses do Bardo (ex: Colégio do Conhecimento) implementadas com suas características (ex: Cutting Words, proficiências extras, magias adicionais).

## Stack Tecnológica
- `lib/dnd5e-data.ts`: Adição dos dados estáticos (características de classe, tabela de progressão, magias).
- `lib/dnd5e-calculator.ts`: Lógica de progressão (cálculo de usos de Inspiração, bônus de Jack of All Trades, número de magias conhecidas).
- `components/character-sheet/`: Ajustes na ficha para exibir as habilidades do Bardo de forma interativa.

## Tarefas (Task Breakdown)

### Fase 1: Dados e Estrutura Base
- **Tarefa 1.1**: Adicionar dados da classe Bardo em `lib/dnd5e-data.ts`.
  - Agente: `backend-specialist`
  - Skills: `clean-code`
  - *Input*: Dados do SRD de Bardo.
  - *Output*: Constantes `Bard` na lista de classes, proficiências em `CLASS_PROFICIENCIES` (armadura leve, armas simples, etc.) e multiclasse requisitos (Carisma 13).
  - *Verify*: Testes passam compilando.
- **Tarefa 1.2**: Definir Tabela de Progressão do Bardo (`dnd5e-data.ts`).
  - Agente: `backend-specialist`
  - Skills: `clean-code`
  - *Input*: Progressão nível 1 a 20 do SRD (Truques Conhecidos, Magias Conhecidas, Espaços de Magia).
  - *Output*: Objeto `classFeatures.Bardo` populado com todos os níveis, incluindo o escalonamento do dado de Inspiração Bárdica e Canção de Descanso.
  - *Verify*: Progresso mapeado de 1 a 20 corretamente.

### Fase 2: Mecânicas Únicas do Bardo
- **Tarefa 2.1**: Implementar Lógica da **Inspiração Bárdica**.
  - Agente: `backend-specialist`
  - Skills: `testing-patterns`
  - *Input*: Regra de Inspiração Bárdica (Usos = Modificador de Carisma, recarrega com descanso longo, depois nível 5 com curto).
  - *Output*: Atualização em `lib/dnd5e-calculator.ts` para rastrear esse recurso.
  - *Verify*: Usos corretos calculados baseados em CHA, mínimo de 1.
- **Tarefa 2.2**: Implementar **Faz-Tudo (Jack of All Trades)**.
  - Agente: `backend-specialist`
  - Skills: `testing-patterns`
  - *Input*: Personagens de Bardo nv 2+.
  - *Output*: Adicionar metade do bônus de proficiência (arredondado para baixo) em testes de habilidade/perícia onde não tem proficiência, incluindo Iniciativa.
  - *Verify*: Personagem nv 2+ tem bônus refletido nas rolagens de habilidades não treinadas.
- **Tarefa 2.3**: Implementar **Especialização (Expertise)**.
  - Agente: `backend-specialist`
  - Skills: `clean-code`
  - *Input*: Escolha de 2 perícias no nv 3, mais 2 no nv 10.
  - *Output*: Lógica de dobro de proficiência para as escolhas do Bardo em `dnd5e-calculator.ts`.
  - *Verify*: Valor da perícia dobra o bônus de proficiência.
- **Tarefa 2.4**: Lógica de **Conjuração**.
  - Agente: `backend-specialist`
  - Skills: `clean-code`
  - *Input*: Magias Conhecidas em vez de Preparadas.
  - *Output*: O Bardo não precisa preparar magias; `spellsKnown` mapeado para o calculator. Foco arcano: Instrumento Musical.

### Fase 3: Subclasses e Segredos Mágicos
- **Tarefa 3.1**: Implementar Colégio do Conhecimento (College of Lore).
  - Agente: `backend-specialist`
  - Skills: `clean-code`
  - *Input*: Características do Colégio do Conhecimento (Nv 3: Proficiências Bônus, Palavras Cortantes; Nv 6: Segredos Mágicos Adicionais; Nv 14: Habilidade Inigualável).
  - *Output*: Características na lista de features de subclasse no `dnd5e-data.ts`.
  - *Verify*: Tabela de subclasse carrega de acordo com os níveis selecionados.
- **Tarefa 3.2**: Lógica de **Segredos Mágicos (Magical Secrets)**.
  - Agente: `frontend-specialist` (com `backend-specialist`)
  - Skills: `app-builder`
  - *Input*: Bardo nível 10, 14, 18 (e nv 6 Lore).
  - *Output*: UI para escolher magias de QUALQUER lista de classes, tratando-as como magias de Bardo.
  - *Verify*: Jogador consegue adicionar magias fora da lista do bardo na ficha nos níveis adequados.

### Fase 4: Integração de UI
- **Tarefa 4.1**: UI para Recursos de Bardo.
  - Agente: `frontend-specialist`
  - Skills: `frontend-design`
  - *Input*: `ClassAbilitiesSection.tsx`
  - *Output*: Exibir botões/trackers bonitos para Inspiração Bárdica. Mostrar "Palavras Cortantes" como reação.
  - *Verify*: A ficha do usuário exibe corretamente o uso de habilidades específicas do Bardo.
- **Tarefa 4.2**: Testes Automatizados.
  - Agente: `test-engineer`
  - Skills: `testing-patterns`
  - *Input*: Regras do Bardo.
  - *Output*: Atualizar `__tests__/dnd5e-calculator.test.ts` com testes unitários confirmando Faz-Tudo, Especialização e Inspiração Bárdica.

## ✅ Fase X: Verificação (Pendente)
- Lint: [ ] Pendente
- Security: [ ] Pendente
- Testes Unitários de progressão do Bardo: [ ] Pendente
- Build: [ ] Pendente
- Date: 
