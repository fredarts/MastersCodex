# Character Sheet Automation Plan

## Overview
Implement comprehensive automation for character creation based on D&D 5.0 rules. This includes adding subraces, fixing how racial attribute bonuses are applied (and re-applied when changing races), and setting the foundation for background automation.

## Project Type
WEB

## Success Criteria
- [ ] Users can select a subrace from a dropdown based on their chosen race.
- [ ] Racial and subracial attribute bonuses apply correctly and visibly during the Point Buy step (Step 3) in the Wizard.
- [ ] Changing a race or subrace in the General Section correctly recalculates attributes without stacking previous bonuses.
- [ ] Subrace data is accurately reflected according to the Player's Handbook (PHB) for core races.

## Tech Stack
- Frontend: React (Next.js), Tailwind CSS
- Logic: TypeScript (`lib/dnd5e-data.ts`, `lib/dnd5e-calculator.ts`)

## File Structure Changes
- `lib/types.ts`: Update `RacePreset` and `AttributeScore` to track base values and subraces.
- `lib/dnd5e-data.ts`: Expand `DND_RACES` with subrace data.
- `lib/dnd5e-calculator.ts`: Refactor `applyRacePreset` and attribute recalculation logic.
- `components/character-sheet/Modals/CharacterBuilderWizardModal.tsx`: Update Steps 2 and 3 UI.
- `components/character-sheet/Sections/GeneralSection.tsx`: Update race/subrace dropdown logic.

## Task Breakdown

### Task 1: Type & Data Foundation
- **Agent**: `backend-specialist`
- **Skill**: `clean-code`
- **INPUT**: `lib/types.ts`, `lib/dnd5e-data.ts`
- **OUTPUT**:
  1. Add `subraces?: Record<string, RacePreset>` to `RacePreset` type.
  2. Add `baseScore?: number` to `AttributeScore` in `types.ts` to separate points bought from total score.
  3. Populate `DND_RACES` with standard 5e subraces (Hill/Mountain Dwarf, High/Wood/Drow Elf, Lightfoot/Stout Halfling, etc.).
- **VERIFY**: TypeScript compiles successfully with new types and data structure.

### Task 2: Calculator Logic Refactor
- **Agent**: `backend-specialist`
- **Skill**: `clean-code`
- **INPUT**: `lib/dnd5e-calculator.ts`
- **OUTPUT**:
  1. Modify `applyRacePreset` to accept an optional `subraceName`.
  2. Implement logic that calculates the final `score` based on `baseScore` + `raceBonus` + `subraceBonus`.
  3. Ensure it gracefully handles switching from one race/subrace to another by zeroing out the old bonuses and applying the new ones using `baseScore` as the anchor.
- **VERIFY**: Manual tests confirm that changing race from Elf to Dwarf correctly removes the +2 DEX and applies +2 CON.

### Task 3: Wizard UI Enhancements
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: `components/character-sheet/Modals/CharacterBuilderWizardModal.tsx`
- **OUTPUT**:
  1. **Step 2**: Add a dropdown for `subrace` that populates based on the chosen race. Hide/disable if the race has no subraces.
  2. **Step 4 (Point Buy)**: Display the racial bonuses next to the point buy controls (E.g., `14 (+2) = 16`). The +/- buttons should manipulate the `baseScore`, while the total updates reactively.
  3. On `handleFinishWizard`, save the `baseScore` and the computed `score` correctly.
- **VERIFY**: The user can see racial bonuses affecting their stats live in the Point Buy screen.

### Task 4: General Section UI Updates
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: `components/character-sheet/Sections/GeneralSection.tsx`
- **OUTPUT**:
  1. Replace the plain text `subrace` input with a `select` dropdown that reacts to the `sheet.race`.
  2. Trigger the updated `applyRacePreset` when either the race or subrace dropdown changes.
- **VERIFY**: Changing the race in the General Section correctly updates the subrace dropdown and applies the new stats to the character seamlessly.

## ✅ PHASE X: Verification
- [ ] Run Lint & Type Check (`npm run lint && npx tsc --noEmit`)
- [ ] Verify UI components have no purple/violet hex codes.
- [ ] Manual Check: Create character via Wizard, check stats. Change race in General Section, verify stats changed correctly.
