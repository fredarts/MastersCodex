# Plano de Implementação: Monge (Níveis 1-20)

**Visão Geral:** Este plano detalha a implementação completa da classe Monge, cobrindo todas as suas habilidades do nível 1 ao 20 no banco de dados (`lib/dnd5e-data.ts`) e o cálculo de recursos dinâmicos no calculador de fichas (`lib/dnd5e-calculator.ts`). Também aborda correções físicas de regras como a trava de CA do Monge com escudos.

---

## 🔴 Perguntas em Aberto (Socratic Gate)

Antes de prosseguirmos com o comando `/create` para executar este plano, precisamos alinhar alguns pontos:

1. **Bug da Classe de Armadura (CA):** Identifiquei que a lógica atual de CA adiciona +2 se o jogador tiver escudo mesmo que ele seja Monge. Pelas regras oficiais de D&D 5e, o escudo desativa a *Defesa sem Armadura* do Monge. Quer que ajustemos essa lógica em `dnd5e-calculator.ts` para que a CA de Monge não some Sabedoria se ele usar escudo? (Isso tornará o sistema 100% fiel à regra).
2. **Próximas Subclasses:** O **Caminho da Mão Aberta** (Way of the Open Hand) é a principal subclasse que implementa habilidades mecânicas (cura e golpes extras). Quer que foquemos apenas nesta subclasse para o Druida ou também planeje a base de outra como o **Caminho das Sombras** (Way of Shadow)?

---

## 🏗️ 1. Banco de Habilidades (`lib/dnd5e-data.ts`)

O objeto `Monge` será adicionado ao `CLASS_FEATURES_DB` cobrindo a progressão do 1º ao 20º nível para a classe base e a subclasse *Caminho da Mão Aberta*.

### Habilidades por Nível

- **Nível 1:**
  - `Defesa sem Armadura`: CA = 10 + DES + SAB (enquanto sem armadura/escudo).
  - `Artes Marciais (d4)`: Ataques desarmados usam DES, causam 1d4, e permitem ataque extra como ação bônus.
- **Nível 2:**
  - `Ki`: Habilidade base para gasto de Ki (Passo do Vento, Defesa Paciente, Rajada de Golpes).
  - `Movimento sem Armadura (+3m)`: Aumenta a velocidade se não usar armadura ou escudo.
- **Nível 3:**
  - `Defletir Projéteis`: Reação para reduzir dano de ataques à distância e arremessar de volta.
  - `Tradição Monástica`: Escolha de subclasse. (`choices: ['Caminho da Mão Aberta']`).
  - `Técnica da Mão Aberta`: Requer *Caminho da Mão Aberta*. Efeitos adicionais ao aplicar Rajada de Golpes (derrubar, empurrar, ou impedir reações).
- **Nível 4:**
  - `Incremento no Valor de Habilidade` (ASI).
  - `Queda Suave`: Reação para reduzir dano de queda em 5x nível.
- **Nível 5:**
  - `Ataque Extra`: Pode atacar duas vezes na sua ação de ataque.
  - `Ataque Atordoante`: Gasta  Ki para tentar atordoar o alvo no acerto.
  - `Artes Marciais (d6)`: Dano aumenta para 1d6.
- **Nível 6:**
  - `Golpes Empoderados por Ki`: Ataques desarmados contam como mágicos.
  - `Integridade Corporal`: Requer *Caminho da Mão Aberta*. Ação para curar 3x nível de Monge (1/descanso longo).
  - `Movimento sem Armadura (+4.5m)`.
- **Nível 7:**
  - `Evasão`: Sucesso em salvaguardas de DES evita todo o dano, falha reduz pela metade.
  - `Mente Serena`: Ação para encerrar efeito de medo ou charme em si mesmo.
- **Nível 8:**
  - `ASI`.
- **Nível 9:**
  - `Movimento sem Armadura Melhorado`: Permite andar sobre superfícies verticais e líquidos.
- **Nível 10:**
  - `Pureza Corporal`: Imunidade a doenças e venenos.
  - `Movimento sem Armadura (+6m)`.
- **Nível 11:**
  - `Tranquilidade`: Requer *Caminho da Mão Aberta*. Ganha efeito da magia *Santuário* ao fim de um descanso longo.
  - `Artes Marciais (d8)`: Dano aumenta para 1d8.
- **Nível 12:**
  - `ASI`.
- **Nível 13:**
  - `Língua do Sol e da Lua`: Compreende e fala com qualquer criatura viva.
- **Nível 14:**
  - `Alma de Diamante`: Proficiência em todas as salvaguardas. Gasta 1 Ki para rerrolar um teste falho.
  - `Movimento sem Armadura (+7.5m)`.
- **Nível 15:**
  - `Corpo Atemporal`: Não sofre efeitos da velhice e não precisa comer ou beber.
- **Nível 16:**
  - `ASI`.
- **Nível 17:**
  - `Palma Vibrante`: Requer *Caminho da Mão Aberta*. Golpe letal por 3 Ki.
  - `Artes Marciais (d10)`: Dano aumenta para 1d10.
- **Nível 18:**
  - `Corpo Vazio`: Gasta Ki para ficar invisível e resistente a danos ou projetar-se astralmente.
  - `Movimento sem Armadura (+9m)`.
- **Nível 19:**
  - `ASI`.
- **Nível 20:**
  - `Auto-Perfeição`: Recupera 4 pontos de Ki se iniciar combate sem nenhum.

---

## ⚙️ 2. Motor de Cálculo (`lib/dnd5e-calculator.ts`)

Ajustar a função `getClassResourcesForLevel` para processar a classe Monge:

- **Recurso: Pontos de Ki (`pontos_ki`)**
  - Apenas para nível >= 2.
  - `max: c.level`
- **Recurso: Integridade Corporal (`integridade_corporal`)**
  - Requer *Caminho da Mão Aberta* e nível >= 6.
  - `max: 1`
- **Correção da Defesa Sem Armadura:**
  - Alterar a regra da CA de Monge para ativar apenas se `!hasShield`.

```typescript
      // Defesa sem Armadura — Monge: 10 + DES + SAB (apenas sem escudo)
      else if (sheet.className === 'Monge' && !hasShield) {
        const wisMod = getAttributeModifier(sheet, 'wis');
        ac = 10 + dexMod + wisMod;
      }
```

---

## 🧪 3. Verificação e Testes Unitários (`lib/__tests__/dnd5e-calculator.test.ts`)

Adicionar a suíte de testes `describe('Mecânicas do Monge')`:

1. **Recursos Básicos:**
   - Validar que Monge nível 1 tem 0 Ki.
   - Validar que Monge nível 5 tem 5 Ki.
   - Validar que o recurso `integridade_corporal` (1 uso) só aparece a partir do nível 6 se possuir a subclasse *Caminho da Mão Aberta*.
2. **Defesa sem Armadura (CA):**
   - Validar que Monge nível 1 com DES 14 (+2) e SAB 16 (+3) tem CA 15 sem armadura e sem escudo.
   - Validar que se equipar um escudo (`hasShield: true`), a CA deve ignorar o bônus de Sabedoria, calculando-se como `10 + 2 (DES) + 2 (Escudo) = 14`.
3. **Filtro de Subclasse:**
   - Assegurar que habilidades como `Palma Vibrante` não apareçam para personagens sem a subclasse correspondente.

---

## 📝 Lista de Tarefas (Task Breakdown)

| ID | Tarefa | Arquivo | Agente Recomendado | Habilidade |
|---|---|---|---|---|
| 1 | Adicionar progressão de níveis 1-20 do Monge (Open Hand) | `lib/dnd5e-data.ts` | `game-developer` | `clean-code` |
| 2 | Integrar Ki, Integridade Corporal e corrigir CA com escudo | `lib/dnd5e-calculator.ts` | `game-developer` | `clean-code` |
| 3 | Criar testes unitários para CA, Ki e subclasses | `dnd5e-calculator.test.ts` | `test-engineer` | `testing-patterns` |

---

## ✅ PHASE X: Critérios de Verificação

- [ ] Linter & Type Check passam.
- [ ] O teste unitário de cálculo passa (`npx vitest run lib/__tests__/dnd5e-calculator.test.ts`).
