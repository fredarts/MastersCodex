# Plano de Implementação: Subclasses do Monge

**Visão Geral:** Este plano detalha o cadastro e a integração das subclasses **Caminho das Sombras** (Way of Shadow) e **Caminho dos Quatro Elementos** (Way of the Four Elements) no banco de dados de progressão (`lib/dnd5e-data.ts`) e a respectiva validação no motor do sistema.

---

## 🔴 Perguntas em Aberto (Socratic Gate)

Antes de iniciarmos com `/create`, confirme um ponto sobre a mecânica de magias das subclasses:
1. **CD e Ataque das Magias (Ki):** Tanto o Caminho das Sombras quanto o dos Quatro Elementos usam **Sabedoria** para calcular a CD das magias conjuradas através do Ki. O motor atual já reconhece a habilidade de conjuração de Monge como Sabedoria em `calculateSpellDC`?
   * *Nota do Planner:* Vamos revisar isso nos testes. Se necessário, garantiremos que o Monge use Sabedoria se a habilidade conjurada vier de suas características de classe.

---

## 🏗️ 1. Banco de Habilidades (`lib/dnd5e-data.ts`)

Ajustar a habilidade `Tradição Monástica` de nível 3 para incluir as novas escolhas e cadastrar as habilidades específicas das duas subclasses.

### Alteração na Habilidade de Nível 3 (Monge):
```typescript
      {
        name: 'Tradição Monástica',
        level: 3,
        description: 'Escolha uma tradição monástica que guiará seu treinamento.',
        activation: 'none',
        choices: ['Caminho da Mão Aberta', 'Caminho das Sombras', 'Caminho dos Quatro Elementos'],
        isSubclassChoice: true
      }
```

### Novas Características a Cadastrar:

#### Caminho das Sombras:
- **Nível 3:**
  - `Artes das Sombras`: Você pode gastar 2 pontos de ki para conjurar *Escuridão*, *Visão no Escuro*, *Passo Sem Pegadas* ou *Silêncio* sem componentes materiais. Você também aprende o truque *Ilusão Menor*.
- **Nível 6:**
  - `Passo das Sombras`: Quando estiver na penumbra ou escuridão, você pode se teleportar como uma ação bônus a até 18 metros para outro ponto desocupado que também esteja na penumbra ou escuridão. Ganha vantagem no primeiro ataque corpo-a-corpo antes do fim do turno.
- **Nível 11:**
  - `Manto de Sombras`: Quando estiver em uma área de penumbra ou escuridão, você pode usar sua ação para ficar invisível. A invisibilidade se encerra se você atacar, conjurar uma magia ou entrar em uma área de luz plena.
- **Nível 17:**
  - `Oportunista`: Quando uma criatura a até 1,5 metro de você for atingida por um ataque realizado por outra criatura (que não seja você), você pode usar sua reação para realizar um ataque corpo-a-corpo contra aquela criatura.

#### Caminho dos Quatro Elementos:
- **Nível 3:**
  - `Discípulo dos Elementos`: Você aprende disciplinas elementais que canalizam seu ki. Você aprende a disciplina *Sintonização Elemental* e outra disciplina elemental à sua escolha. Pode gastar ki para simular magias como *Mãos Queimadoras* ou *Onda Trovejante*.
- **Nível 6:**
  - `Disciplinas Elementais (6º Nível)`: Você aprende uma nova disciplina elemental de sua escolha (como *Gongar da Cúpula* ou *Chicotada de Água*).
- **Nível 11:**
  - `Disciplinas Elementais (11º Nível)`: Você aprende uma nova disciplina elemental de sua escolha (como *Chamas da Fênix* ou *Cavalgada do Vento*).
- **Nível 17:**
  - `Disciplinas Elementais (17º Nível)`: Você aprende uma nova disciplina elemental de sua escolha (como *Sopro de Inverno* ou *Rio de Famintos*).

---

## ⚙️ 2. Motor de Cálculo (`lib/dnd5e-calculator.ts`)

Como as habilidades de ambas as subclasses consomem Ki diretamente (recurso `pontos_ki` já implementado para todos os monges nível >= 2), **não há necessidade de registrar novos recursos de limites diários** em `getClassResourcesForLevel`. Toda a integração reside no filtro dinâmico de habilidades de subclasses executado pelo `recalculateSheetDerivedStats`.

---

## 🧪 3. Verificação e Testes Unitários (`lib/__tests__/dnd5e-calculator.test.ts`)

Adicionar testes para certificar que o isolamento de subclasses funcione corretamente:

1. **Validação do Caminho das Sombras:**
   - Criar um monge do *Caminho das Sombras* nível 11.
   - Testar se habilidades como `Artes das Sombras` e `Manto de Sombras` estão presentes.
   - Assegurar que `Técnica da Mão Aberta` e `Disciplinas Elementais` estão ausentes.
2. **Validação do Caminho dos Quatro Elementos:**
   - Criar um monge do *Caminho dos Quatro Elementos* nível 6.
   - Testar se a habilidade `Discípulo dos Elementos` e `Disciplinas Elementais (6º Nível)` estão presentes.
   - Assegurar que habilidades das Sombras ou Mão Aberta estão ausentes.

---

## 📝 Lista de Tarefas (Task Breakdown)

| ID | Tarefa | Arquivo | Agente Recomendado | Habilidade |
|---|---|---|---|---|
| 1 | Atualizar escolhas de subclasse e adicionar habilidades no DB | `lib/dnd5e-data.ts` | `game-developer` | `clean-code` |
| 2 | Criar testes unitários para as novas subclasses | `dnd5e-calculator.test.ts` | `test-engineer` | `testing-patterns` |

---

## ✅ PHASE X: Critérios de Verificação

- [ ] Linter & Type Check passam.
- [ ] Os testes de cálculo passam (`npx vitest run lib/__tests__/dnd5e-calculator.test.ts`).
