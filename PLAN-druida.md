# Plano de Implementação: Druida (Níveis 1-20)

**Visão Geral:** Este plano detalha a implementação completa da classe Druida, cobrindo todas as suas habilidades do nível 1 ao 20 no banco de dados (`lib/dnd5e-data.ts`) e o cálculo de recursos dinâmicos no calculador de fichas (`lib/dnd5e-calculator.ts`).

---

## 🔴 Perguntas Respondidas & Decisões de Escopo

Para garantir uma implementação robusta e à prova de falhas:
1. **Subclasses Cobertas:** Em vez de focar apenas no **Círculo da Lua**, este plano expande a base para cobrir ambas as subclasses clássicas: **Círculo da Lua** (Wild Shape de Combate) e **Círculo da Terra** (Conjuração e Recuperação), tirando proveito da lógica de filtragem de subclasses que corrigimos anteriormente.
2. **Forma Selvagem:** Será gerenciada como um recurso com 2 usos (níveis 2-19) e usos ilimitados (nível 20).
3. **Recuperação Natural:** Adicionado como recurso de classe exclusivo para o Círculo da Terra.

---

## 🏗️ 1. Banco de Habilidades (`lib/dnd5e-data.ts`)

O objeto `Druida` será adicionado ao `CLASS_FEATURES_DB` cobrindo a progressão do 1º ao 20º nível para a classe base e as duas subclasses principais.

### Habilidades por Nível

- **Nível 1:**
  - `Idioma Druídico`: Habilidade base.
  - `Conjuração (Druida)`: Habilidade base.
- **Nível 2:**
  - `Forma Selvagem (2 usos)`: Habilidade base.
  - `Círculo Druídico`: Habilidade de escolha de subclasse. (`choices: ['Círculo da Lua', 'Círculo da Terra']`).
  - `Forma Selvagem de Combate`: Requer *Círculo da Lua*. Permite Forma Selvagem como ação bônus e cura gastando slots.
  - `Formas do Círculo`: Requer *Círculo da Lua*. Forma Selvagem com ND inicial de 1.
  - `Truque Adicional (Círculo da Terra)`: Requer *Círculo da Terra*.
  - `Recuperação Natural`: Requer *Círculo da Terra*. Recupera slots de magia num descanso curto.
- **Nível 4:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
  - `Forma Selvagem Melhorada (Nado)`: Habilidade base. Permite transformar-se em criaturas com deslocamento de nado (ND máx 1/2).
- **Nível 6:**
  - `Ataque Primitivo`: Requer *Círculo da Lua*. Ataques físicos na Forma Selvagem contam como mágicos.
  - `Travessia da Terra`: Requer *Círculo da Terra*. Ignora terreno difícil não-mágico e ganha salvaguarda contra plantas nocivas.
- **Nível 8:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
  - `Forma Selvagem Melhorada (Voo)`: Habilidade base. Permite transformar-se em criaturas com deslocamento de voo (ND máx 1).
- **Nível 10:**
  - `Forma Elemental`: Requer *Círculo da Lua*. Gasta 2 usos de Forma Selvagem para virar um elemental.
  - `Salvaguarda da Natureza`: Requer *Círculo da Terra*. Imunidade a veneno, doença, e efeitos de medo/charme causados por fadas/elementais.
- **Nível 12:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
- **Nível 14:**
  - `Mil Formas`: Requer *Círculo da Lua*. Pode conjurar *Alterar-se* à vontade sem gastar slots.
  - `Santuário da Natureza`: Requer *Círculo da Terra*. Criaturas da natureza devem fazer salvaguarda para conseguir atacar o Druida.
- **Nível 16:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
- **Nível 18:**
  - `Corpo Atemporal`: Habilidade base. Envelhecimento 10x mais lento.
  - `Magia Bestial`: Habilidade base. Permite conjurar magias na Forma Selvagem (sem componentes materiais/somáticos não-monetários).
- **Nível 19:**
  - `Incremento no Valor de Habilidade`: Habilidade base.
- **Nível 20:**
  - `Arquidruida`: Habilidade base. Usos de Forma Selvagem ilimitados; ignora a maioria dos componentes verbais/somáticos das magias.

---

## ⚙️ 2. Motor de Cálculo (`lib/dnd5e-calculator.ts`)

Ajustar a função `getClassResourcesForLevel` para processar a classe Druida.

```typescript
} else if (c.name === 'Druida') {
  // Forma Selvagem: 2 usos até o nível 19. Nível 20 é ilimitado (representado por 9999)
  let formaSelvagemMax = 0;
  if (c.level >= 2) {
    formaSelvagemMax = c.level >= 20 ? 9999 : 2;
  }

  if (formaSelvagemMax > 0) {
    const existingFS = resources['forma_selvagem']?.max || 0;
    const newMax = Math.max(existingFS, formaSelvagemMax);
    resources['forma_selvagem'] = {
      name: 'forma_selvagem',
      label: 'Forma Selvagem',
      current: newMax,
      max: newMax
    };
  }

  // Círculo da Terra: Recuperação Natural (1 uso por dia)
  if (c.level >= 2 && c.subclass === 'Círculo da Terra') {
    resources['recuperacao_natural'] = {
      name: 'recuperacao_natural',
      label: 'Recuperação Natural',
      current: 1,
      max: 1
    };
  }
}
```

---

## 🧪 3. Verificação e Testes Unitários (`lib/__tests__/dnd5e-calculator.test.ts`)

Expandir os testes unitários do calculador para incluir cenários específicos:

1. **Recursos Básicos:**
   - Validar que Druida nível 1 tem 0 usos de Forma Selvagem.
   - Validar que Druida nível 2 a 19 possui 2 usos de Forma Selvagem.
   - Validar que Druida nível 20 possui usos ilimitados (9999) de Forma Selvagem.
   - Validar que Druida do *Círculo da Terra* nível 2 ganha o recurso `recuperacao_natural` (1 uso), enquanto um Druida do *Círculo da Lua* de mesmo nível não ganha este recurso.
2. **Filtragem de Subclasse (Integridade do Banco):**
   - Validar que as habilidades de nível 2, 6, 10 e 14 do *Círculo da Lua* (como `Ataque Primitivo` e `Forma Elemental`) estão presentes apenas se o jogador escolher essa subclasse.
   - Validar que as habilidades do *Círculo da Terra* (como `Recuperação Natural` e `Travessia da Terra`) estão presentes apenas se o jogador escolher essa subclasse.

---

## 📝 Lista de Tarefas (Task Breakdown)

| ID | Tarefa | Arquivo | Agente Recomendado | Habilidade |
|---|---|---|---|---|
| 1 | Adicionar progressão de níveis 1-20 do Druida (Moon e Land) | `lib/dnd5e-data.ts` | `game-developer` | `clean-code` |
| 2 | Integrar recursos de Forma Selvagem e Recuperação Natural | `lib/dnd5e-calculator.ts` | `game-developer` | `clean-code` |
| 3 | Criar suíte de testes unitários robusta | `dnd5e-calculator.test.ts` | `test-engineer` | `testing-patterns` |

---

## ✅ PHASE X: Critérios de Verificação

- [ ] Linter & Type Check passam.
- [ ] O teste unitário de cálculo passa (`npx vitest run lib/__tests__/dnd5e-calculator.test.ts`).
