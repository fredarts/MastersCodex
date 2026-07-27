# PLAN-player-group-sharing.md

## Overview
Implement a feature in the Player Lobby to display the campaign's group members (players, NPCs, familiars) and allow players to view each other's character sheets. Implement a privacy toggle to block sheet sharing.

## Project Type
**WEB**

## Success Criteria
- Campaign members (players and semi-permanent NPCs) are displayed in the Player Lobby (left column).
- Players can click on a member to view their character sheet in a modal.
- Character sheet data includes a privacy toggle (`isPublic` or `isPrivate`).
- If a sheet is private, other players cannot view it.
- The UI fits into the existing aesthetic (cyan/amber/dark).

## Tech Stack
- React/Next.js (Frontend)
- Supabase (Backend/Database for storing `isPublic` flag in `character_sheets` JSON data)
- Tailwind CSS (Styling)

## File Structure
- `components/PlayerLobby.tsx` (Add Group Members widget)
- `components/character-sheet/CharacterSheetViewModal.tsx` (Existing or new read-only modal for viewing sheets)
- `lib/types.ts` (Add `isPublic` to CharacterSheet interface)

## Task Breakdown

### Task 1: Update Types and Backend Handling
- **Agent**: `backend-specialist`
- **Skills**: `api-patterns`
- **INPUT**: `lib/types.ts`
- **OUTPUT**: Add `isPublic?: boolean` to `CharacterSheet` interface. Update `saveCharacterSheet` to support this field.
- **VERIFY**: TypeScript compiles, field is saved in Supabase JSONB.

### Task 2: Create Group Members Widget
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **INPUT**: `components/PlayerLobby.tsx`
- **OUTPUT**: A new section in the left column titled "Membros do Grupo". Fetch and list `campaignMembers` (players and NPCs).
- **VERIFY**: Widget renders correctly with avatars/names of campaign members.

### Task 3: Implement Privacy Toggle
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **INPUT**: `components/character-sheet/...`
- **OUTPUT**: A toggle button "Tornar ficha pública para o grupo" allowing the owner to toggle `isPublic` (default: true).
- **VERIFY**: Toggling updates the database.

### Task 4: View Other Sheets
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **INPUT**: `components/PlayerLobby.tsx`
- **OUTPUT**: Clicking a member in the Group Widget opens a read-only modal of their sheet, ONLY if `isPublic` is true. If false, show a lock icon and prevent opening.
- **VERIFY**: Players can view public sheets, but not private ones.

## Phase X: Verification
- [ ] Run `npm run lint`
- [ ] Manual test: Player 1 sets sheet to public, Player 2 views it.
- [ ] Manual test: Player 1 sets sheet to private, Player 2 is blocked.
