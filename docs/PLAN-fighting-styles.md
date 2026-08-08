# Plano de Implementação: Estilos de Luta Adicionais (D&D 5e)

> **Status:** 📝 Em Planejamento | **Prioridade:** ⚔️ Média | **Tipo de Projeto:** WEB / RULES ENGINE  
> **Chave do Plano:** `fighting-styles`

Este plano detalha a implementação e automação de três estilos de luta populares do D&D 5e: **Arquearia**, **Duelismo** e **Combate com Armas Grandes**, permitindo que a ficha de personagem calcule e aplique os modificadores de acerto e rolagens de dano automaticamente com base no texto cadastrado na ficha do usuário.

---

## 🎯 Escopo da Automação

| Estilo de Luta | Regra D&D 5e | Local da Automação | Ação da Engine |
| :--- | :--- | :--- | :--- |
| **Arquearia (Archery)** | +2 de bônus nas jogadas de ataque com armas à distância. | `lib/dnd5e-calculator.ts` (`calculateWeaponAttack`) | Se possuir o estilo e a arma for `isRanged`, somar +2 ao modificador de acerto total (`atkBonus`). |
| **Duelismo (Dueling)** | +2 de bônus nas jogadas de dano com arma corpo a corpo de uma mão (sem outras armas). | `lib/dnd5e-calculator.ts` (`calculateWeaponAttack`) | Se possuir o estilo, a arma for melee (`!isRanged`) e não for pesada/duas mãos, somar +2 ao modificador de dano (`damage`). |
| **Armas Grandes (GWF)** | Rerrolar 1 e 2 nos dados de dano com armas de duas mãos ou versáteis. | `lib/dnd5e-dice.ts` e `CombatSection.tsx` | Se possuir o estilo e a arma for melee de duas mãos/versátil, rerrolar qualquer dado que resulte em 1 ou 2 (manter o segundo resultado). |

---

## 🏗️ Proposta de Implementação

### 1. Detecção dos Estilos de Luta (Regex Simples)
Usaremos a mesma abordagem robusta já aplicada para o estilo *Defesa*:
```typescript
const hasStyle = (sheet: CharacterSheet, styleName: string) => {
  const query = styleName.toLowerCase();
  return (
    sheet.otherFeatures?.toLowerCase().includes(query) || 
    sheet.featuresAndTraits?.toLowerCase().includes(query)
  );
};
```
Mapearemos chaves em português e inglês:
*   **Arquearia:** `"arquearia"` ou `"archery"`
*   **Duelismo:** `"duelismo"` ou `"dueling"`
*   **Armas Grandes:** `"armas grandes"` ou `"great weapon"`

### 2. Ajustes no Calculador de Ataques (`lib/dnd5e-calculator.ts`)
Dentro de `calculateWeaponAttack(sheet, weaponName)`:
*   **Arquearia:**
    ```typescript
    const hasArchery = hasStyle(sheet, 'arquearia') || hasStyle(sheet, 'archery');
    if (hasArchery && weapon.isRanged) {
      totalAtk += 2;
    }
    ```
*   **Duelismo:**
    ```typescript
    const hasDueling = hasStyle(sheet, 'duelismo') || hasStyle(sheet, 'dueling');
    const isTwoHanded = weapon.properties?.some(p => p.toLowerCase().includes('duas mãos') || p.toLowerCase().includes('two-handed'));
    if (hasDueling && !weapon.isRanged && !isTwoHanded) {
      totalDamageMod += 2;
    }
    ```

### 3. Ajustes na Rolagem de Dados de Dano (GWF)
Sempre que dados forem rolados para dano de arma, se o personagem tiver **Combate com Armas Grandes** e a arma for melee e de duas mãos ou versátil, qualquer resultado `1` ou `2` em um dado individual deve ser rerrolado.

*   **Onde aplicar:**
    1.  `lib/dnd5e-dice.ts` (na função `executeWeaponAttackRoll`)
    2.  `components/character-sheet/Sections/CombatSection.tsx` (na função `rollWeaponDamage`)
*   **Algoritmo de Rerrolagem:**
    ```typescript
    const hasGWF = hasStyle(sheet, 'armas grandes') || hasStyle(sheet, 'great weapon');
    const isTwoHandedOrVersatile = weapon?.properties?.some(p => 
      p.toLowerCase().includes('duas mãos') || 
      p.toLowerCase().includes('two-handed') || 
      p.toLowerCase().includes('versátil') || 
      p.toLowerCase().includes('versatile')
    );
    const shouldApplyGWF = hasGWF && !weapon?.isRanged && isTwoHandedOrVersatile;

    // Durante o loop de rolagem dos dados:
    let roll = Math.floor(Math.random() * diceFaces) + 1;
    if (shouldApplyGWF && (roll === 1 || roll === 2)) {
      roll = Math.floor(Math.random() * diceFaces) + 1; // Rerrola e aceita o novo valor
    }
    diceSum += roll;
    ```

---

## 📋 Tarefas (Task Breakdown)

### 🟩 Task 1: Modificar `lib/dnd5e-calculator.ts`
*   Adicionar lógica de detecção de estilo de luta Arquearia e Duelismo na função `calculateWeaponAttack`.
*   Assegurar retrocompatibilidade e recálculo da ficha em tempo real.

### 🟩 Task 2: Atualizar a Rolagem de Dano (GWF)
*   Modificar `executeWeaponAttackRoll` no arquivo `lib/dnd5e-dice.ts` para importar `WEAPON_TABLE` e aplicar a rerrolagem de GWF.
*   Modificar `rollWeaponDamage` em `components/character-sheet/Sections/CombatSection.tsx` para aplicar a mesma rerrolagem de GWF.

### 🟩 Task 3: Testes Unitários de Verificação
*   Criar testes em `dnd5e-calculator.test.ts` validando o acréscimo de bônus de acerto para Arquearia (+2) e bônus de dano para Duelismo (+2).
*   Criar testes em `dnd5e-dice.test.ts` simulando a rerrolagem do dado 1 ou 2 de dano no estilo Combate com Armas Grandes.

---

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (0 errors)
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-08-08
