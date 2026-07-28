# Audio Bar Contextualization (Cockpit Only)

This plan details the changes required to make the `AudioMaestro` (Audio Bar) contextual to the active scene and restrict its visibility strictly to the Live Cockpit view, while maintaining background audio playback across the application.

## User Review Required

- Currently, if a scene has NO bgm tracks or sfx shortcuts configured, the Audio Bar will appear empty. Is this the intended behavior, or should it fallback to a default list if nothing is configured?
- We will conditionally render the `<AudioMaestro />` in `app/page.tsx` to only appear when `activeTab === 'live_cockpit'`. Since the audio playback is handled globally by `AudioContext`, the music will continue to play when switching away from the cockpit, which matches your requirement.

## Proposed Changes

### `app/page.tsx`
#### [MODIFY] [page.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/app/page.tsx)
- Change `{/* Bottom Audio Control Footer */} <AudioMaestro />` to conditionally render: `{activeTab === 'live_cockpit' && <AudioMaestro />}`.

### `components/AudioMaestro.tsx`
#### [MODIFY] [AudioMaestro.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/AudioMaestro.tsx)
- Import `useSession` from `@/context/SessionContext`.
- Extract `activeScene` from `useSession()`.
- Filter `BGM_TRACKS` and `SFX_BUTTONS` using `activeScene?.bgmTracks` and `activeScene?.sfxShortcuts`.
- Render the filtered lists in the UI instead of the full library.

## Verification Plan

### Manual Verification
1. **Visibility Check:** Open the application, verify the audio bar is NOT visible on tabs like Worldbuilder or Session Studio.
2. **Visibility Check (Cockpit):** Switch to the Live Cockpit tab and verify the audio bar IS visible.
3. **Contextual Filtering:** Ensure the audio bar only shows the BGM and SFX tracks configured for the currently active scene.
4. **Playback Persistence:** Play a BGM in the Live Cockpit, switch to another tab (e.g., Session Studio), and verify the music continues playing without interruption even though the audio bar is hidden.
