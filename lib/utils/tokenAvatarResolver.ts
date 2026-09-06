import { Combatant, WorldEntity } from '@/lib/types';
import { getEntityPortraitUrl, getEntityCombatPinUrl } from '@/lib/world/entityHelpers';
import { NPC_TEMPLATES, INITIAL_MONSTERS } from '@/lib/srd-data';

export function normalizeTokenName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\s*\([^)]*\)/g, '') // Remove (PC), (NPC), (Monstro), (Party) etc.
    .replace(/\s*#\d+/g, '')       // Remove numeric increments #1, #2
    .trim()
    .toLowerCase();
}

export interface TokenAvatarResolutionOptions {
  customSheets?: any[];
  partyMembers?: any[];
  campaignMembers?: any[];
  worldEntities?: WorldEntity[];
}

/**
 * Centralized, robust resolver for token face portraits and avatars.
 * Prioritizes:
 * 1. Direct combatant portrait / avatarUrl / tokenImageUrl / faceImageUrl
 * 2. Active character sheets in memory & localStorage (masters_codex_character_sheets_v1)
 * 3. Campaign party members and campaign members
 * 4. World entities / NPCs (using getEntityPortraitUrl)
 * 5. SRD NPC templates
 */
export function resolveTokenAvatar(
  tokenName: string,
  combatant?: Combatant | null,
  options?: TokenAvatarResolutionOptions
): string | null {
  // 1. Direct check on combatant
  if (combatant) {
    const directUrl =
      combatant.avatarUrl ||
      combatant.tokenImageUrl ||
      (combatant as any).portraitUrl ||
      (combatant as any).faceImageUrl ||
      (combatant as any).imageUrl;
    if (directUrl && typeof directUrl === 'string' && directUrl.trim()) {
      return directUrl.trim();
    }
  }

  const rawName = tokenName || combatant?.name || '';
  const nameClean = normalizeTokenName(rawName);
  if (!nameClean) return null;

  // 2. Explicit options checks
  if (options?.customSheets && options.customSheets.length > 0) {
    const found = options.customSheets.find((s) => {
      const sName = normalizeTokenName(s.characterName || s.name || s.heroName || '');
      return sName === nameClean || sName.includes(nameClean) || nameClean.includes(sName);
    });
    if (found) {
      const url =
        found.faceImageUrl ||
        found.avatarUrl ||
        found.portraitUrl ||
        found.imageUrl ||
        (Array.isArray(found.images) && (found.images[0] || found.images[1]));
      if (url && typeof url === 'string' && url.trim()) return url.trim();
    }
  }

  if (options?.partyMembers && options.partyMembers.length > 0) {
    const found = options.partyMembers.find((p) => {
      const pName = normalizeTokenName(p.name || p.characterName || p.displayName || '');
      return pName === nameClean || pName.includes(nameClean) || nameClean.includes(pName);
    });
    if (found) {
      const url = found.avatarUrl || found.faceImageUrl || found.portraitUrl || found.tokenImageUrl || found.imageUrl;
      if (url && typeof url === 'string' && url.trim()) return url.trim();
    }
  }

  if (options?.campaignMembers && options.campaignMembers.length > 0) {
    const found = options.campaignMembers.find((m) => {
      const mName = normalizeTokenName(m.characterName || m.name || m.displayName || '');
      return mName === nameClean || mName.includes(nameClean) || nameClean.includes(mName);
    });
    if (found) {
      const url = found.avatarUrl || found.faceImageUrl || found.portraitUrl;
      if (url && typeof url === 'string' && url.trim()) return url.trim();
    }
  }

  if (options?.worldEntities && options.worldEntities.length > 0) {
    const found = options.worldEntities.find((e) => {
      const eName = normalizeTokenName(e.name || '');
      return eName === nameClean || eName.includes(nameClean) || nameClean.includes(eName);
    });
    if (found) {
      const url = getEntityPortraitUrl(found) || getEntityCombatPinUrl(found);
      if (url && typeof url === 'string' && url.trim()) return url.trim();
    }
  }

  // 3. Fallback to reading from localStorage in browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Check character sheets (Primary source of truth for character face portraits)
      const savedSheets =
        localStorage.getItem('masters_codex_character_sheets_v1') ||
        localStorage.getItem('codex_character_sheets_v1');
      if (savedSheets) {
        const sheets: any[] = JSON.parse(savedSheets);
        if (Array.isArray(sheets)) {
          const found = sheets.find((s) => {
            const sName = normalizeTokenName(s.characterName || s.name || s.heroName || '');
            return sName === nameClean || sName.includes(nameClean) || nameClean.includes(sName);
          });
          if (found) {
            const url =
              found.faceImageUrl ||
              found.avatarUrl ||
              found.portraitUrl ||
              found.imageUrl ||
              (Array.isArray(found.images) && (found.images[0] || found.images[1]));
            if (url && typeof url === 'string' && url.trim()) return url.trim();
          }
        }
      }
    } catch (_e) {}

    try {
      // Check active character sheet in storage
      const activeSheetRaw = localStorage.getItem('masters_codex_active_character_sheet');
      if (activeSheetRaw) {
        const s = JSON.parse(activeSheetRaw);
        const sName = normalizeTokenName(s.characterName || s.name || '');
        if (sName === nameClean || sName.includes(nameClean) || nameClean.includes(sName)) {
          const url =
            s.faceImageUrl ||
            s.avatarUrl ||
            s.portraitUrl ||
            s.imageUrl ||
            (Array.isArray(s.images) && (s.images[0] || s.images[1]));
          if (url && typeof url === 'string' && url.trim()) return url.trim();
        }
      }
    } catch (_e) {}

    try {
      // Check active campaign party members
      const activeCampaignRaw = localStorage.getItem('masters_codex_active_campaign');
      if (activeCampaignRaw) {
        const c = JSON.parse(activeCampaignRaw);
        const pms = c.partyMembers || [];
        const found = pms.find((p: any) => {
          const pName = normalizeTokenName(p.name || p.characterName || '');
          return pName === nameClean || pName.includes(nameClean) || nameClean.includes(pName);
        });
        if (found?.avatarUrl && typeof found.avatarUrl === 'string' && found.avatarUrl.trim()) {
          return found.avatarUrl.trim();
        }
      }
    } catch (_e) {}

    try {
      // Check campaigns list
      const savedCamps = localStorage.getItem('codex_campaigns');
      if (savedCamps) {
        const camps: any[] = JSON.parse(savedCamps);
        for (const camp of camps) {
          const pms = camp.partyMembers || [];
          const found = pms.find((p: any) => {
            const pName = normalizeTokenName(p.name || p.characterName || '');
            return pName === nameClean || pName.includes(nameClean) || nameClean.includes(pName);
          });
          if (found?.avatarUrl && typeof found.avatarUrl === 'string' && found.avatarUrl.trim()) {
            return found.avatarUrl.trim();
          }
        }
      }
    } catch (_e) {}

    try {
      // Check world entities / NPCs
      const savedEntities = localStorage.getItem('codex_world_entities');
      if (savedEntities) {
        const entities: WorldEntity[] = JSON.parse(savedEntities);
        if (Array.isArray(entities)) {
          const found = entities.find((e) => {
            const eName = normalizeTokenName(e.name || '');
            return eName === nameClean || eName.includes(nameClean) || nameClean.includes(eName);
          });
          if (found) {
            const url = getEntityPortraitUrl(found) || getEntityCombatPinUrl(found);
            if (url && typeof url === 'string' && url.trim()) return url.trim();
          }
        }
      }
    } catch (_e) {}
  }

  // 4. Check NPC templates
  const foundNpc = NPC_TEMPLATES.find((npc) => {
    const npcName = normalizeTokenName(npc.name);
    return npcName === nameClean || npcName.includes(nameClean) || nameClean.includes(npcName);
  });
  if (foundNpc?.avatarUrl && typeof foundNpc.avatarUrl === 'string' && foundNpc.avatarUrl.trim()) {
    return foundNpc.avatarUrl.trim();
  }

  // 5. Check SRD Monster templates
  const foundMon = INITIAL_MONSTERS.find((mon) => {
    const monName = normalizeTokenName(mon.name);
    return monName === nameClean || monName.includes(nameClean) || nameClean.includes(monName);
  });
  if (foundMon?.tokenImageUrl && typeof foundMon.tokenImageUrl === 'string' && foundMon.tokenImageUrl.trim()) {
    return foundMon.tokenImageUrl.trim();
  }

  return null;
}
