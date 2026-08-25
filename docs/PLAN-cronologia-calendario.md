# Plano de Integração: Cronologia do World Building x Calendário da Campanha

## 📋 Diagnóstico Atual
Atualmente, a **Cronologia (`WorldTimelineView.tsx`)** e o **Calendário (`CampaignCalendarStudio.tsx` / `CalendarContext.tsx`)** funcionam de forma isolada:
1. **Cronologia Atual:** Salva datas em campos de texto livre (`"Primeira Era"`, `"100 DF"`), sem ordenação cronológica precisa e sem se importar com os meses/dias/sufixos configurados no Calendário do mundo.
2. **Calendário Atual:** Possui estrutura completa de anos, meses customizados (ex: Harptos, Greyhawk, Gregoriano), dias da semana, fases da lua e eventos/notas com data numérica precisa (`year`, `monthIndex`, `day`), mas esses eventos não alimentam nem refletem a Cronologia do World Building.

---

## 🎯 Objetivos do Projeto

1. **Estruturar a Data na Cronologia**: Substituir campos de texto genérico no modal da Cronologia por seletores vinculados ao Calendário do Mundo (`calendarConfig`).
2. **Ordenação Cronológica Precisa**: Ordenar os eventos históricos da Cronologia numericamente por Ano, Mês e Dia.
3. **Sincronização Bi-direcional / Visibilidade Unificada**:
   - Eventos registrados na Cronologia aparecem como marcas históricas no Calendário da Campanha.
   - Notas/marcos criados no Calendário do tipo `world_event` ou com a flag de "Lore do Mundo" aparecem na linha do tempo da Cronologia.
4. **Compatibilidade com Eras Históricas**: Permitir associar tanto datas exatas do calendário quanto Eras Pré-Históricas/Cataclismas no sistema.

---

## 📐 Alterações Propostas

### 1. Modelo de Dados (`lib/types.ts` & `lib/types/calendar.ts`)
- Atualizar a estrutura dos `attributes` das `WorldEntity` de linha do tempo para incluir:
  - `year`: number (ex: 100)
  - `monthIndex`: number | null (ex: 3)
  - `day`: number | null (ex: 14)
  - `eraName`: string (ex: "Primeira Era")
  - `yearSuffix`: string (ex: "DF" ou "DR")
  - `formattedDate`: string (ex: "14 de Ches, 100 DR")

### 2. Interface da Cronologia (`WorldTimelineView.tsx`)
- Integrar `useCampaignCalendar()` no `WorldTimelineView`.
- Atualizar o modal **Registrar Novo Evento na Cronologia**:
  - Seleção de Era / Sufixo (ex: "Segunda Era", "DR", "DF").
  - Campo numérico para **Ano** (ex: `100`).
  - Dropdown com os **Meses** dinâmicos trazidos de `calendarConfig.months` (com opção "Ano Inteiro / Sem Mês").
  - Campo numérico para **Dia** (baseado no limite de dias do mês selecionado).
- Atualizar a renderização da linha do tempo para ordenar os eventos de forma cronológica (Ano ASC/DESC -> Mês -> Dia).

### 3. Integração no Calendário (`CampaignCalendarStudio.tsx` & `CalendarContext.tsx`)
- Fazer o `CalendarContext` ou `CalendarDayModal` carregar também os eventos da Cronologia (`WorldEntity` com categoria `lore_event`, `military_conflict`, `tradition`) que ocorrem naquele ano/mês/dia.
- Ao visualizar um dia no Calendário da Campanha, destacar eventos históricos que aconteceram naquele mesmo dia/mês em anos passados ("Neste dia na história...").

---

## 👥 Perguntas Socraticas & Feedback do Usuário

1. **Eras Pré-Calendário**: Deseja que eventos de eras muito antigas (ex: "Antes da Criação") possam ser marcados com anos negativos (ex: `-1000 DF`) ou apenas selecionando um rótulo de Era sem ano específico?
2. **Filtros e Visões**: Gostaria de uma opção na Cronologia para filtrar entre "Eventos Gerais do Mundo" e "Eventos Ocorridos Durante a Campanha Atual"?

---

## 🔬 Plano de Verificação

### Testes Manuais
1. Criar um evento na Cronologia escolhendo Ano 1492, Mês 5 (Eleint), Dia 14.
2. Verificar se o evento aparece ordenado corretamente na Cronologia.
3. Abrir o Calendário da Campanha no mês de Eleint (Ano 1492) e verificar se o evento da Cronologia é exibido no dia 14.
4. Alterar o preset do calendário (ex: Harptos -> Gregoriano) e checar a reatividade e exibição dos meses.
