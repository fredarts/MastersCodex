# Plano de Implementação: Sistema de Multiclasse (Revisado e Consolidado)

Este plano detalha a implementação do sistema de multiclasse para o Masters Codex. Após revisão técnica, identificamos e corrigimos lacunas críticas de lógica relativas a retrocompatibilidade, cálculo de pontos de vida, espaços de magia e renderização de interface.

---

## 🛠️ Regras de Negócio Consolidadas

1. **Pré-requisitos de Atributo (Bloqueio Rígido):**
   - Para adotar uma nova classe, o personagem deve cumprir os requisitos de D&D 5e de **ambas** as classes (a classe atual e a nova classe).
   - Requisitos das classes implementadas:
     - **Bárbaro:** Força >= 13
     - **Paladino:** Força >= 13 e Carisma >= 13
     - **Mago:** Inteligência >= 13
   - Caso os requisitos não sejam atendidos, a classe ficará desativada no dropdown com um aviso indicando os atributos necessários.

2. **Proficiências de Multiclasse:**
   - O personagem não ganha todas as proficiências iniciais da nova classe. Ele ganha apenas as proficiências descritas na tabela de Multiclasse do Livro do Jogador.
   - O sistema automatizará essa injeção ao adicionar a nova classe.

3. **Espaços de Magia (Spell Slots):**
   - Se o personagem tiver apenas **uma** classe com a característica de Conjuração (ex: Mago 3 / Bárbaro 2), ele usará a tabela de espaços de magia daquela classe específica (Mago).
   - Se o personagem tiver **múltiplas** classes conjuradoras (ex: Mago 3 / Paladino 2), o nível de conjurador será calculado como:
     - `Nível de Mago + Math.floor(Nível de Paladino / 2)`
   - O resultado será usado para determinar os espaços de magia na tabela de conjurador multiclasse.

---

## 📐 Proposta de Arquitetura e Estrutura de Dados

### 1. Retrocompatibilidade e a Estrutura de Ficha (`lib/types.ts`)
Para evitar quebrar as dezenas de componentes que dependem de `sheet.className` e `sheet.level`, manteremos esses campos como a **Classe Principal** (a primeira selecionada) e **Nível Total** do personagem. A estrutura real das classes será salva em um novo campo `classes`.

```typescript
// Adições em lib/types.ts

export interface CharacterClassProgress {
  name: string;
  level: number;
  subclass?: string;
  isPrimary: boolean;
}

// Dentro de CharacterSheet:
export interface CharacterSheet {
  // ... campos existentes ...
  className: string; // Mantido para compatibilidade (nome da classe principal ou string formatada ex: "Mago / Bárbaro")
  level: number;     // Nível Total (soma de todos os níveis de classes)
  classes?: CharacterClassProgress[]; // Opcional para manter retrocompatibilidade
  // ...
}
```

### 2. Mapeamento de Regras em `lib/dnd5e-data.ts`
Adicionaremos os objetos de mapeamento de pré-requisitos e proficiências concedidas por multiclasse:

```typescript
export const MULTICLASS_REQUIREMENTS: Record<string, Partial<Record<AttributeKey, number>>> = {
  'Bárbaro': { str: 13 },
  'Paladino': { str: 13, cha: 13 },
  'Mago': { int: 13 }
};

export const MULTICLASS_PROFICIENCIES: Record<string, { armor: string; weapons: string }> = {
  'Bárbaro': { armor: 'Escudos', weapons: 'Armas simples, armas marciais' },
  'Paladino': { armor: 'Armaduras leves, armaduras médias, escudos', weapons: 'Armas simples, armas marciais' },
  'Mago': { armor: 'Nenhuma', weapons: 'Adagas, dardos, fundas, cajados, bestas leves' }
};
```

---

## ✏️ Detalhamento das Alterações nos Componentes

### 1. Novo Helper de Classes (`lib/dnd5e-calculator.ts`)
Criaremos funções utilitárias para lidar com a lista de classes de forma segura:

- `getCharacterClasses(sheet)`: Retorna `sheet.classes` se existir e não estiver vazio. Caso contrário, retorna um fallback dinâmico: `[{ name: sheet.className, level: sheet.level, subclass: sheet.subclass, isPrimary: true }]`.
- `hasClass(sheet, className)`: Verifica se o personagem possui a classe informada.
- `getClassLevel(sheet, className)`: Retorna o nível do personagem em uma classe específica.

### 2. Refatoração de Gates de Interface (`ClassAbilitiesSection.tsx` e outros)
Substituir verificações estritas como `sheet.className === 'Bárbaro'` por chamadas ao helper `hasClass(sheet, 'Bárbaro')`. Isso garante que as abas de recursos de fúria e smites apareçam juntas para um personagem multiclasse.

### 3. Atualização do `LevelUpModal.tsx`
- **Passo 0 (Seleção de evolução):**
  - Pergunta se o jogador quer subir de nível na classe atual ou adicionar uma nova classe.
  - O dropdown de novas classes filtrará e desativará classes cujos requisitos em `MULTICLASS_REQUIREMENTS` não sejam atendidos baseados nos atributos atuais da ficha.
- **Passo 1 (Pontos de Vida):**
  - O Dado de Vida usado para rolar/calcular a média será o da classe escolhida para subir de nível.
- **Passo 2 (Habilidades de Classe):**
  - Irá buscar na `CLASS_FEATURES_DB` as habilidades correspondentes ao novo nível alcançado naquela classe específica.
  - Ao escolher uma nova classe pela primeira vez, aplica as proficiências de `MULTICLASS_PROFICIENCIES` na ficha do personagem.

### 4. Recálculo dos Dados de Vida (Hit Dice)
O campo `hitDiceTotal` e `hitDiceUsed` passará a suportar strings compostas para personagens multiclasse (ex: `'4d6, 1d12'`). O método de descanso e recuperação de dados de vida precisará processar essa lista separada por vírgulas.

---

## 📈 Plano de Verificação e Testes

### Testes Unitários/Lógicos
- [ ] Validar a função `getCharacterClasses` com fichas antigas (retrocompatibilidade).
- [ ] Validar a função de cálculo de espaços de magia com as seguintes combinações:
  - Mago 3 / Bárbaro 2 (deve ter slots de 3º nível de Mago).
  - Paladino 2 / Bárbaro 2 (deve ter slots de 1º nível de Paladino - usa tabela do Paladino puro pois é a única classe conjuradora).
  - Mago 3 / Paladino 2 (deve ter slots de conjurador nível 4 na tabela de multiclasse).
- [ ] Validar se as proficiências de multiclasse são aplicadas apenas na primeira vez que a classe é adicionada.

### Testes de UI (Manual)
- [ ] Tentar adicionar Bárbaro em um personagem com Força 10 (deve estar bloqueado no dropdown).
- [ ] Executar o Level Up escolhendo multiclasse e confirmar se a barra de vida e os dados de vida atualizaram com o dado correto (ex: 1d12 para Bárbaro).
- [ ] Confirmar se os recursos da nova classe (ex: usos de Fúria) aparecem na ficha ao lado dos recursos da classe principal.
