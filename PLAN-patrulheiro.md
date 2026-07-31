# Plano de Implementação: Patrulheiro (Ranger) - Níveis 1-20

**Visão Geral:** Este plano detalha a implementação completa da classe Patrulheiro (Ranger) no sistema Masters Codex. A classe será integrada no banco de dados de progressão (`lib/dnd5e-data.ts`), no motor de regras (`lib/dnd5e-calculator.ts`) e validada com uma nova suíte de testes unitários. O plano abrange a progressão completa do nível 1 ao 20 para a classe base e suas duas subclasses clássicas: **Caçador** (Hunter) e **Mestre das Feras** (Beast Master).

---

## 🔴 Perguntas em Aberto (Socratic Gate)

Para garantir uma modelagem fiel ao comportamento esperado no Masters Codex, responda aos seguintes pontos antes de prosseguirmos para o `/create` (fase de implementação):

1. **Sub-escolhas do Caçador (Hunter's Prey, Defensive Tactics, etc.):** 
   - No D&D 5e, o Caçador escolhe opções específicas dentro de suas habilidades (como *Matador de Colossos* vs *Matador de Gigantes* no nível 3).
   - *Proposta:* Modelaremos isso como uma única habilidade descritiva no `CLASS_FEATURES_DB` que lista as opções disponíveis para o jogador no campo `description`, similar ao comportamento atual do Bárbaro Totêmico (`Espírito Totêmico (Ex: Urso)`). Você prefere que façamos dessa forma ou que cada opção seja uma feature individual requerendo seleção na UI?
2. **Representação do Companheiro Animal (Mestre das Feras):**
   - O Mestre das Feras recebe um Companheiro do Patrulheiro.
   - *Proposta:* Registraremos a habilidade no banco e ela será listada na ficha. Atualmente o sistema possui suporte a fichas de companheiros/sidekicks ou apenas exibirá o companheiro animal como um texto descritivo e habilidade na ficha do Patrulheiro?
3. **Proficiências Multiclasse:**
   - Ao fazer multiclasse em Patrulheiro, o personagem ganha proficiência em armaduras leves, armaduras médias, escudos, armas simples, armas marciais e uma perícia da lista da classe.
   - O objeto `MULTICLASS_PROFICIENCIES` em `lib/dnd5e-data.ts` deve ser atualizado para refletir isso? (Atualmente ele já possui Bárbaro, Paladino, Mago, Bardo, etc.).

---

## 🏗️ 1. Banco de Habilidades (`lib/dnd5e-data.ts`)

Adicionar a chave `Patrulheiro` no objeto `CLASS_FEATURES_DB` com a progressão completa de níveis 1 a 20.

### Habilidades por Nível

- **Nível 1:**
  - `Inimigo Favorito`: Habilidade base. Vantagem em rastrear e lembrar informações sobre um tipo de inimigo escolhido.
  - `Explorador Natural`: Habilidade base. Benefícios ao viajar e explorar um tipo de terreno escolhido.
- **Nível 2:**
  - `Estilo de Luta`: Escolha de estilo de combate. (`choices: ['Arquearia', 'Defesa', 'Duelismo', 'Combate com Duas Armas']`).
  - `Conjuração (Patrulheiro)`: Habilidade de conjurar magias usando Sabedoria como atributo de conjuração.
- **Nível 3:**
  - `Arquétipo de Patrulheiro`: Escolha de subclasse. (`choices: ['Caçador', 'Mestre das Feras']`, `isSubclassChoice: true`).
  - `Prontidão Primal`: Habilidade base. Usa ação e espaço de magia para detectar a presença de tipos específicos de criaturas a até 1,5 km.
  - `Presa do Caçador`: Requer *Caçador*. Concede opções de combate adicionais (Matador de Colossos, Matador de Gigantes ou Quebrador de Hordas).
  - `Companheiro do Patrulheiro`: Requer *Mestre das Feras*. Companheiro animal de tamanho Médio ou menor.
- **Nível 4:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
- **Nível 5:**
  - `Ataque Extra`: Habilidade base. Ataca duas vezes ao usar a ação de Ataque.
- **Nível 6:**
  - `Inimigo Favorito Melhorado`: Habilidade base. Escolhe um inimigo favorito adicional e aprende um idioma relacionado.
  - `Explorador Natural Melhorado`: Habilidade base. Escolhe um tipo de terreno favorito adicional.
- **Nível 7:**
  - `Táticas Defensivas`: Requer *Caçador*. Escolha de opções defensivas (Escapar da Horda, Defesa contra Ataques Múltiplos ou Vontade de Aço).
  - `Treinamento Excepcional`: Requer *Mestre das Feras*. Companheiro animal pode realizar Correr, Desengajar ou Ajudar com Ação Bônus. Seus ataques contam como mágicos.
- **Nível 8:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
  - `Caminho da Terra`: Habilidade base. Ignora terreno difícil não-mágico e ganha vantagem contra plantas criadas por magia.
- **Nível 10:**
  - `Mimetismo na Natureza`: Habilidade base. Pode se camuflar por 1 minuto para receber +10 em testes de Furtividade.
  - `Explorador Natural Adicional`: Habilidade base. Escolhe um terceiro tipo de terreno favorito.
- **Nível 11:**
  - `Ataque Múltiplo`: Requer *Caçador*. Escolha de opção de ataque em área (Salva de Flechas ou Ataque em Turbilhão).
  - `Fúria Bestial`: Requer *Mestre das Feras*. Companheiro animal faz dois ataques quando recebe ordem de atacar.
- **Nível 12:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
- **Nível 14:**
  - `Desaparecer`: Habilidade base. Esconder-se como ação bônus e não pode ser rastreado de forma não mágica.
  - `Inimigo Favorito Adicional`: Habilidade base. Escolhe um terceiro tipo de inimigo favorito e aprende outro idioma.
- **Nível 15:**
  - `Defesa de Caçador Superior`: Requer *Caçador*. Opções defensivas superiores (Evasão, Esquiva Sobrenatural ou Ficar de Pé contra a Maré).
  - `Conjurar Compartilhado`: Requer *Mestre das Feras*. Magias conjuradas no Patrulheiro também afetam o companheiro animal.
- **Nível 16:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
- **Nível 18:**
  - `Sentidos Ferais`: Habilidade base. Ataca inimigos não vistos sem desvantagem e percebe invisíveis a até 9 metros.
- **Nível 19:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
- **Nível 20:**
  - `Matador de Inimigos`: Habilidade base. Adiciona modificador de Sabedoria na jogada de ataque ou dano contra inimigo favorito uma vez por turno.

---

## ⚙️ 2. Motor de Cálculo (`lib/dnd5e-calculator.ts`)

A lógica de cálculo para o Patrulheiro já se encontra parcialmente estabelecida para multiclasse e limite de magias:
1. **Slots de Magia (Meio-conjurador):** Já calculados adequadamente na função `applyLevelChange` (metade do nível arredondado para baixo, liberando slots a partir do nível 2).
2. **Magias Conhecidas:** Já mapeadas na função `calculateSpellLimits`.
3. **Recursos com limite de uso:** O Patrulheiro não possui recursos numéricos nativos com limite de uso diário (como pontos de Ki ou fúrias) na classe básica do PHB. Por isso, **não** adicionaremos novas propriedades em `getClassResourcesForLevel` para a classe base do Patrulheiro.

A integração dependerá inteiramente da filtragem de habilidades de subclasse realizada pelo `recalculateSheetDerivedStats` (que utiliza as propriedades `requiresSubclass === subclass` e injeta dinamicamente as habilidades corretas na ficha).

---

## 🧪 3. Verificação e Testes Unitários (`lib/__tests__/dnd5e-calculator.test.ts`)

Criaremos uma nova suíte de testes unitários no arquivo `lib/__tests__/dnd5e-calculator.test.ts` dedicada ao Patrulheiro:

1. **Validação da Classe Base:**
   - Criar um Patrulheiro nível 1 e validar se `Inimigo Favorito` e `Explorador Natural` estão presentes.
   - Criar um Patrulheiro nível 2 e verificar se `Estilo de Luta` e `Conjuração (Patrulheiro)` estão presentes.
   - Verificar se os slots de magia de 1º nível são 2 para um Patrulheiro de nível 2.
2. **Isolamento e Filtragem de Subclasses:**
   - Criar um Patrulheiro nível 3 do arquétipo **Caçador** e validar se `Presa do Caçador` está presente, enquanto `Companheiro do Patrulheiro` (da subclasse Mestre das Feras) está ausente.
   - Criar um Patrulheiro nível 3 do arquétipo **Mestre das Feras** e validar se `Companheiro do Patrulheiro` está presente, enquanto `Presa do Caçador` está ausente.
   - Validar que as habilidades de níveis superiores (como `Ataque Múltiplo` ou `Fúria Bestial` no nível 11) são filtradas corretamente dependendo do nível e da subclasse escolhida.

---

## 📝 Lista de Tarefas (Task Breakdown)

| ID | Tarefa | Arquivo | Agente Recomendado | Habilidade |
|---|---|---|---|---|
| 1 | Adicionar progressão de níveis 1-20 do Patrulheiro (Ranger) em `CLASS_FEATURES_DB` | [dnd5e-data.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/dnd5e-data.ts) | `game-developer` | `clean-code` |
| 2 | Registrar requisitos de multiclasse e proficiências de Patrulheiro | [dnd5e-data.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/dnd5e-data.ts) | `game-developer` | `clean-code` |
| 3 | Criar suíte de testes unitários para a classe Patrulheiro e subclasses | [dnd5e-calculator.test.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/__tests__/dnd5e-calculator.test.ts) | `test-engineer` | `testing-patterns` |

---

## ✅ PHASE X: Critérios de Verificação

- [ ] Lint & Type Check passam sem erros (`npm run lint` e `npx tsc --noEmit`).
- [ ] Os testes unitários do calculador de regras passam (`npx vitest run lib/__tests__/dnd5e-calculator.test.ts`).
