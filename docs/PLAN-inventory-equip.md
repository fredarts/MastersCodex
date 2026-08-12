# PLAN - Character Inventory Equipment System

Implement a unified equipping system for D&D 5e Character Sheets. This removes the manual Armor Class (CA) dropdown from the Combat tab and computes it dynamically from equipped armor/shields in the inventory. Equipped weapons will also automatically sync to the Combat tab's attacks list.

## Project Type
- **Type**: WEB
- **Primary Agent**: `frontend-specialist`
- **Key Skills**: `clean-code`, `react-best-practices`, `frontend-design`

## Success Criteria
1. **Inventory Equipping Controls**:
   - An "Equipar" / "Equipado" button is added next to the item name for Weapons and Armors/Shields in the Inventory tab.
   - Newly added items (manual or compendium) start as unequipped by default.
2. **Equipping Constraints (Hand Management)**:
   - Max 1 armor equipped.
   - Max 1 shield equipped.
   - Max 2 hands occupied:
     - Equipping a Two-Handed weapon automatically unequips other weapons and shields.
     - Equipping a Shield automatically unequips any Two-Handed weapon, allowing at most 1 one-handed weapon.
     - Equipping a third one-handed weapon automatically unequips the oldest one.
3. **Derived Combat Stats (CA & Attacks)**:
   - The CA is calculated dynamically based on the equipped armor and shield inside `recalculateSheetDerivedStats`.
   - Equipped weapons automatically generate and update their corresponding attacks in `sheet.attacks`.
   - Unequipped weapons are automatically removed from `sheet.attacks`.
4. **Combat UI Updates**:
   - The manual CA dropdown and shield checkbox on the Combat tab are replaced with clean, read-only displays.

---

## File Structure

- `[MODIFY]` [types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts) — Add `equipped` field to `CharacterEquipmentItem`.
- `[MODIFY]` [dnd5e-calculator.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/dnd5e-calculator.ts) — Update `recalculateSheetDerivedStats` to derive equipped armor/shields and sync equipped weapons.
- `[MODIFY]` [EquipmentSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/EquipmentSection.tsx) — Add Equip toggle UI and hand constraints handler.
- `[MODIFY]` [CombatSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/CombatSection.tsx) — Make Armor Class and Shield displays read-only.

---

## Task Breakdown

### Phase 1: Data Model & Calculation Logic

#### Task 1.1: Update Data Model Types
- **Agent**: `frontend-specialist`
- **Skill**: `clean-code`
- **Priority**: P0
- **Dependencies**: None
- **INPUT**: [types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts)
- **OUTPUT**: Add optional `equipped?: boolean;` property to `CharacterEquipmentItem` interface.
- **VERIFY**: Verify typescript compiles cleanly (`npx tsc --noEmit`).

#### Task 1.2: Implement Derived Stats Calculation
- **Agent**: `frontend-specialist`
- **Skill**: `clean-code`
- **Priority**: P0
- **Dependencies**: Task 1.1
- **INPUT**: [dnd5e-calculator.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/dnd5e-calculator.ts)
- **OUTPUT**:
  - Update `recalculateSheetDerivedStats` to:
    1. Scan `sheet.equipment` for equipped armor/shield.
    2. Set `sheet.equippedArmor` and `sheet.hasShield` accordingly.
    3. Filter `sheet.attacks` to keep custom attacks and sync equipped weapons by matching IDs.
    4. Auto-generate/update attack stats for equipped weapons.
- **VERIFY**: Run `npx tsc --noEmit` and confirm no compilation errors.

---

### Phase 2: UI Implementation

#### Task 2.1: Add Inventory Equipping UI & Enforce Rules
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 1.2
- **INPUT**: [EquipmentSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/EquipmentSection.tsx)
- **OUTPUT**:
  - Add an "Equipar" toggle button in the weapon/armor list cards.
  - Implement a `handleToggleEquip` function that enforces:
    - Only 1 armor equipped.
    - Only 1 shield equipped.
    - Hand constraints for weapons (two-handed vs one-handed dual-wielding vs shield).
  - Recalculate and propagate the sheet change via `onChange(recalculateSheetDerivedStats(...))`.
- **VERIFY**: Check inventory rendering on the local dev server.

#### Task 2.2: Make Combat Tab Displays Read-Only
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 2.1
- **INPUT**: [CombatSection.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/CombatSection.tsx)
- **OUTPUT**:
  - Replace the `<select>` for `equippedArmor` with a styled read-only component showing the equipped armor.
  - Replace the `<input type="checkbox">` for `hasShield` with a read-only shield indicator.
- **VERIFY**: Test the character sheet Combat tab to confirm manual options are gone and show correct derived values.

---

## Phase X: Final Verification

- [ ] Run Typescript check: `npx tsc --noEmit`
- [ ] Run linter check: `npm run lint` or `npx eslint components/character-sheet/Sections/`
- [ ] Verify that equipping/unequipping armor updates CA dynamically.
- [ ] Verify that equipping/unequipping weapons adds/removes attacks dynamically on the Combat tab.
- [ ] Manual Check: Hand limits are properly enforced (e.g., equipping two-handed weapon unequips shield/second weapon).

## ✅ PHASE X COMPLETE
- Lint: [ ]
- Security: [ ]
- Build: [ ]
- Date: [Pending]
