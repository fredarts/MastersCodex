'use client';

import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Plus, 
  Play, 
  Image as ImageIcon, 
  Music, 
  Swords, 
  Mic, 
  BookOpen, 
  Lock, 
  Trash2, 
  Map, 
  Calendar, 
  Sparkles, 
  Skull, 
  Volume2,
  Tv,
  Beer,
  MessageSquare,
  Compass,
  UserCheck,
  Shield,
  Search,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useSession } from '@/lib/hooks/useSession';
import { useWorld } from '@/lib/hooks/useWorld';
import { GameScene, SceneType, Combatant, SceneImage, WorldEntity, CustomMonster } from '@/lib/types';
import { INITIAL_MONSTERS, SFX_BUTTONS, BGM_TRACKS } from '@/lib/srd-data';
import { storageService } from '@/lib/services/storageService';
import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { WikiTextRenderer } from '@/components/ui/WikiTextRenderer';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CreateSceneModal } from '@/components/CreateSceneModal';
import { customMonsterService } from '@/lib/services/customMonsterService';
import { normalizeImageUrl, isYouTubeUrl, getYouTubeThumbnailUrl } from '@/lib/imageUtils';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { ThreeErrorBoundary } from '@/components/ThreeErrorBoundary';
import { useBattleGridStore } from '@/lib/stores/useBattleGridStore';
import { useCustomDialog } from '@/context/CustomDialogContext';
import { EncounterDifficultyMeter } from '@/components/live-cockpit/EncounterDifficultyMeter';
import { crToXp, previewEncounterWithNewMonster, XP_THRESHOLDS_BY_LEVEL, getEncounterMultiplier } from '@/lib/dnd5e-encounter-calculator';

interface CharacterSheetMinimal {
  characterName?: string;
  className?: string;
  modelUrl?: string;
  tokenType?: 'billboard' | '3d';
  avatarUrl?: string;
  maxHp?: number;
  currentHp?: number;
  armorClass?: number;
}

interface SessionStudioProps {
  onEquipScene?: (scene: GameScene) => void;
  isMainSidebarCollapsed?: boolean;
  onSetMainSidebarCollapsed?: (collapsed: boolean) => void;
}

export const SessionStudio: React.FC<SessionStudioProps> = ({ 
  onEquipScene,
  isMainSidebarCollapsed,
  onSetMainSidebarCollapsed,
}) => {
  const { activeCampaign, campaignMembers, createFeedEvent } = useCampaign();
  const { showAlert } = useCustomDialog();
  const { 
    sessions, 
    activeSession, 
    setActiveSession, 
    createSession,
    scenes, 
    activeScene, 
    setActiveScene,
    updateScene,
    deleteScene,
    campaignMaps
  } = useSession();
  const { worldEntities, activeWorld } = useWorld();

  const [selectedScene, setSelectedScene] = useState<GameScene | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'image' | 'audio' | 'combat' | 'voice' | 'notes' | 'worldbuilding' | 'dungeon-maps'>('image');
  const [isScenesSidebarCollapsed, setIsScenesSidebarCollapsed] = useState(false);
  const [isSubTabsCollapsed, setIsSubTabsCollapsed] = useState(false);
  const [is3DFullFocus, setIs3DFullFocus] = useState(false);
  const wasMainSidebarCollapsedBeforeFocusRef = React.useRef<boolean>(false);

  const toggle3DFullFocus = () => {
    setIs3DFullFocus((prev) => {
      const next = !prev;
      if (next) {
        wasMainSidebarCollapsedBeforeFocusRef.current = isMainSidebarCollapsed ?? false;
        if (onSetMainSidebarCollapsed) {
          onSetMainSidebarCollapsed(true);
        }
      } else {
        if (onSetMainSidebarCollapsed && !wasMainSidebarCollapsedBeforeFocusRef.current) {
          onSetMainSidebarCollapsed(false);
        }
      }
      return next;
    });
  };
  const [worldSearch, setWorldSearch] = useState('');
  const [worldFilterCat, setWorldFilterCat] = useState('all');
  const [showCreateSceneModal, setShowCreateSceneModal] = useState(false);
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // Editable Form State for Selected Scene
  const [title, setTitle] = useState('');
  const [sceneType, setSceneType] = useState<SceneType>('social');
  const [imageUrl, setImageUrl] = useState('');
  const [sceneImages, setSceneImages] = useState<SceneImage[]>([]);
  const [bgmCategory, setBgmCategory] = useState<'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao'>('taverna');
  const [bgmTracks, setBgmTracks] = useState<string[]>([]);
  const [customAudios, setCustomAudios] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sfxShortcuts, setSfxShortcuts] = useState<string[]>([]);
  const [npcName, setNpcName] = useState('');
  const [npcAudioUrl, setNpcAudioUrl] = useState('');
  const [sensoryText, setSensoryText] = useState('');
  const [secretNotes, setSecretNotes] = useState('');

  useEffect(() => {
    if (activeCampaign?.id && isSupabaseConfigured()) {
      supabase
        .from('campaign_audio_assets')
        .select('*')
        .eq('campaign_id', activeCampaign.id)
        .then(({ data }) => {
          if (data) setCustomAudios(data);
        });

      supabase
        .from('campaign_audio_favorites')
        .select('audio_id')
        .eq('campaign_id', activeCampaign.id)
        .then(({ data }) => {
          if (data) setFavorites(data.map((f: any) => f.audio_id));
        });
    }
  }, [activeCampaign?.id, selectedScene?.id]);

  // Formatar todas as músicas BGM (SRD + Custom)
  const srdBgms = BGM_TRACKS.map(t => ({ ...t, isCustom: false }));
  const customBgms = customAudios
    .filter(a => a.type === 'bgm')
    .map(a => ({ id: a.id, name: a.name, url: a.url, category: a.category, isLoop: a.is_loop, isCustom: true }));
  const allBgmTracks = [...srdBgms, ...customBgms];

  // Formatar todos os efeitos SFX (SRD + Custom)
  const srdSfxs = SFX_BUTTONS.map(s => ({ ...s, isLoop: false, isCustom: false }));
  const customSfxs = customAudios
    .filter(a => a.type === 'sfx')
    .map(a => ({ id: a.id, name: a.name, iconName: a.icon_name || 'Music', url: a.url, category: a.category, isCustom: true }));
  const allSfxTracks = [...srdSfxs, ...customSfxs];

  // Identificar favoritos
  const favoriteBgmTracks = allBgmTracks.filter(t => favorites.includes(t.id));
  const favoriteSfxTracks = allSfxTracks.filter(s => favorites.includes(s.id));
  const [sceneCombatants, setSceneCombatants] = useState<Combatant[]>([]);
  const [combatAddTab, setCombatAddTab] = useState<'srd' | 'world' | 'npcs' | 'players'>('srd');
  const [combatSearchQuery, setCombatSearchQuery] = useState('');
  const [showCombatDropdown, setShowCombatDropdown] = useState(false);
  const [monsterQty, setMonsterQty] = useState(1);
  const [customMonsters, setCustomMonsters] = useState<CustomMonster[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await customMonsterService.fetchCustomMonsters(activeWorld?.id);
        setCustomMonsters(data);
      } catch (err) {
        console.error('Erro ao carregar monstros customizados:', err);
      }
    };
    load();
  }, [activeWorld?.id]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.combat-dropdown-container')) {
        setShowCombatDropdown(false);
      }
    };
    if (showCombatDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showCombatDropdown]);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors'>('day');
  const [timeOfDayHour, setTimeOfDayHour] = useState<number>(12);
  const [hasFog, setHasFog] = useState(false);
  const [hasRain, setHasRain] = useState(false);
  const [environmentSettings, setEnvironmentSettings] = useState<Record<string, any>>({});
  const [buildingBlocks3D, setBuildingBlocks3D] = useState<import('@/lib/3d-building-blocks').BuildingBlock3D[]>([]);
  const [gridConfig3D, setGridConfig3D] = useState<import('@/lib/3d-building-blocks').GridConfig3D | undefined>(undefined);
  const [floorTextureUrl, setFloorTextureUrl] = useState<string | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (scenes.length > 0) {
      if (!selectedScene || !scenes.some((s) => s.id === selectedScene.id)) {
        setSelectedScene(scenes[0]);
      }
    } else {
      setSelectedScene(null);
    }
  }, [scenes, activeSession?.id]);

  useEffect(() => {
    if (selectedScene) {
      setTitle(selectedScene.title || '');
      setSceneType(selectedScene.sceneType || 'social');
      setImageUrl(selectedScene.imageUrl || '');
      setBgmCategory(selectedScene.bgmCategory || 'taverna');
      setBgmTracks(selectedScene.bgmTracks || []);
      setSfxShortcuts(selectedScene.sfxShortcuts || []);
      setNpcName(selectedScene.npcName || '');
      setNpcAudioUrl(selectedScene.npcAudioUrl || '');
      setSensoryText(selectedScene.sensoryText || '');
      setSecretNotes(selectedScene.secretNotes || '');
      setSceneCombatants(selectedScene.combatants || []);
      setTimeOfDay(selectedScene.timeOfDay || 'day');
      setTimeOfDayHour(selectedScene.timeOfDayHour ?? 12);
      setHasFog(selectedScene.hasFog ?? false);
      setHasRain(selectedScene.hasRain ?? false);
      setEnvironmentSettings(selectedScene.environmentSettings || {});
      setBuildingBlocks3D(selectedScene.buildingBlocks || selectedScene.environmentSettings?.building_blocks_3d || []);
      setGridConfig3D(selectedScene.gridConfig3D || selectedScene.environmentSettings?.grid_config_3d || undefined);
      setFloorTextureUrl(selectedScene.floorTextureUrl || undefined);
      setSceneImages(selectedScene.sceneImages || []);
    } else {
      setTitle('');
      setSceneType('social');
      setImageUrl('');
      setBgmCategory('taverna');
      setBgmTracks([]);
      setSfxShortcuts([]);
      setNpcName('');
      setNpcAudioUrl('');
      setSensoryText('');
      setSecretNotes('');
      setSceneCombatants([]);
      setTimeOfDayHour(12);
      setHasFog(false);
      setHasRain(false);
      setEnvironmentSettings({});
      setBuildingBlocks3D([]);
      setGridConfig3D(undefined);
      setFloorTextureUrl(undefined);
      setSceneImages([]);
    }
  }, [selectedScene]);

  // Helper para resolver nível do personagem salvo em LocalStorage
  const resolvePlayerLevel = (pName: string): number => {
    try {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1') || localStorage.getItem('codex_character_sheets_v1');
      if (saved) {
        const sheets: any[] = JSON.parse(saved);
        const cClean = pName.split('(')[0].trim().toLowerCase();
        const found = sheets.find(
          (s) =>
            (s.characterName && s.characterName.split('(')[0].trim().toLowerCase() === cClean) ||
            (s.characterName && pName.toLowerCase().includes(s.characterName.toLowerCase())) ||
            (s.characterName && s.characterName.toLowerCase().includes(pName.toLowerCase()))
        );
        if (found && found.level) return Number(found.level);
      }
    } catch (e) {}
    return 1;
  };

  // Party computada para o encontro da cena
  const encounterPartyList = React.useMemo(() => {
    const playerCombatants = (sceneCombatants || []).filter((c) => c.type === 'player');
    if (playerCombatants.length > 0) {
      return playerCombatants.map((c) => ({
        level: resolvePlayerLevel(c.name),
      }));
    }
    const nonDmMembers = (campaignMembers || []).filter((m) => m.role !== 'dm');
    if (nonDmMembers.length > 0) {
      return nonDmMembers.map((m) => ({
        level: resolvePlayerLevel(m.characterName || m.displayName || ''),
      }));
    }
    return [{ level: 1 }, { level: 1 }, { level: 1 }, { level: 1 }];
  }, [sceneCombatants, campaignMembers]);

  // Monstros presentes na cena para a calculadora de XP
  const encounterMonstersList = React.useMemo(() => {
    return (sceneCombatants || [])
      .filter((c) => c.type === 'monster' || c.type === 'npc')
      .map((c, idx) => ({
        id: c.id || `mon-${idx}`,
        cr: c.cr,
        name: c.name,
        xp: crToXp(c.cr),
      }));
  }, [sceneCombatants]);

  // Gerador automático de encontros por nível de dificuldade
  const handleAutoGenerateEncounter = (targetDiff: 'easy' | 'medium' | 'hard' | 'deadly') => {
    const pList = encounterPartyList.length > 0 ? encounterPartyList : [{ level: 1 }, { level: 1 }, { level: 1 }, { level: 1 }];
    
    // Calcula o orçamento alvo de XP para a party
    const targetXpBudget = pList.reduce((acc, p) => {
      const lvl = Math.max(1, Math.min(20, p.level || 1));
      const thresholds = XP_THRESHOLDS_BY_LEVEL[lvl] || XP_THRESHOLDS_BY_LEVEL[1];
      return acc + thresholds[targetDiff];
    }, 0);

    const avgPartyLevel = Math.round(pList.reduce((acc, p) => acc + (p.level || 1), 0) / pList.length);

    // Seleciona candidatos do INITIAL_MONSTERS
    const available = INITIAL_MONSTERS.map((m) => ({
      ...m,
      xpValue: crToXp(m.cr),
      numericCr: typeof m.cr === 'string' && m.cr.includes('/') 
        ? (m.cr === '1/2' ? 0.5 : m.cr === '1/4' ? 0.25 : 0.125) 
        : Number(m.cr)
    })).filter((m) => m.numericCr <= avgPartyLevel + (targetDiff === 'deadly' ? 3 : 1));

    if (available.length === 0) {
      toast.error('Não há monstros compatíveis no bestiário.');
      return;
    }

    const strategy = Math.random() > 0.4 ? 'group' : 'solo';
    const chosenMonsters: typeof INITIAL_MONSTERS[0][] = [];

    if (strategy === 'solo') {
      const sorted = [...available].sort((a, b) => 
        Math.abs(a.xpValue - targetXpBudget) - Math.abs(b.xpValue - targetXpBudget)
      );
      if (sorted[0]) chosenMonsters.push(sorted[0]);
    } else {
      const count = Math.floor(Math.random() * 3) + 2; // 2, 3 ou 4
      const mult = getEncounterMultiplier(count, pList.length);
      const targetPerMonsterXp = targetXpBudget / (count * mult);

      const sorted = [...available].sort((a, b) => 
        Math.abs(a.xpValue - targetPerMonsterXp) - Math.abs(b.xpValue - targetPerMonsterXp)
      );
      const basePick = sorted[0] || available[0];
      for (let i = 0; i < count; i++) {
        chosenMonsters.push(basePick);
      }
    }

    // Mantém os jogadores e substitui os monstros antigos pelos novos gerados
    const currentPlayers = sceneCombatants.filter((c) => c.type === 'player');
    const newCombatants: Combatant[] = [];

    chosenMonsters.forEach((m) => {
      const sameName = newCombatants.filter((c) => c.name.startsWith(m.name)).length;
      const finalName = chosenMonsters.filter((x) => x.name === m.name).length > 1 
        ? `${m.name} ${sameName + 1}` 
        : m.name;

      newCombatants.push({
        id: `c-sc-${Date.now()}-${Math.random()}-${Math.floor(Math.random() * 1000)}`,
        name: finalName,
        type: 'monster',
        hp: m.hp,
        maxHp: m.hp,
        ac: m.ac,
        initiative: Math.floor(Math.random() * 20) + 1,
        conditions: [],
        cr: m.cr,
        size: m.size,
        tokenImageUrl: m.tokenImageUrl,
        modelUrl: m.modelUrl,
        tokenType: m.tokenType,
      });
    });

    setSceneCombatants([...currentPlayers, ...newCombatants]);
    toast.success(`Encontro ${targetDiff.toUpperCase()} gerado com sucesso (${newCombatants.length} criaturas)!`);
  };

  if (!activeCampaign || (activeWorld && activeCampaign.worldId !== activeWorld.id)) {
    return (
      <div className="flex-1 bg-[#0a0d14] flex flex-col items-center justify-center p-8 text-center select-none">
        <Film className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-300 text-base">
          {activeWorld ? `Nenhuma Campanha no Mundo: ${activeWorld.title}` : 'Nenhuma Campanha Selecionada'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Inicie ou selecione uma campanha de RPG neste mundo para planejar sessões e projetar cenas cinematográficas.
        </p>
      </div>
    );
  }

  const handleSaveSceneChanges = async () => {
    if (!selectedScene) return;
    const computedPreset: 'day' | 'sunset' | 'night' | 'fog' | 'storm' =
      timeOfDayHour >= 21 || timeOfDayHour <= 4
        ? 'night'
        : timeOfDayHour >= 16.5
        ? 'sunset'
        : 'day';

    // Merge 3D grid positions/rotations into combatants before saving
    const { tokenPositions3D, tokenRotations3D } = useBattleGridStore.getState();
    const combatantsWithPositions = sceneCombatants.map((c) => {
      const key = c.id || c.name;
      const pos = tokenPositions3D[key];
      const rot = tokenRotations3D[key];
      return {
        ...c,
        x: pos !== undefined ? pos.x : c.x,
        z: pos !== undefined ? pos.z : c.z,
        rotation: rot !== undefined ? rot : c.rotation,
      };
    });

    const updatedEnv = {
      ...environmentSettings,
      building_blocks_3d: buildingBlocks3D,
      grid_config_3d: gridConfig3D,
    };

    const updated: GameScene = {
      ...selectedScene,
      title,
      sceneType,
      imageUrl: imageUrl || undefined,
      bgmCategory,
      bgmTracks,
      sfxShortcuts,
      npcName: npcName || undefined,
      npcAudioUrl: npcAudioUrl || undefined,
      sensoryText: sensoryText || undefined,
      secretNotes: secretNotes || undefined,
      combatants: combatantsWithPositions,
      timeOfDay: timeOfDay || (hasRain ? 'storm' : hasFog ? 'fog' : computedPreset),
      isIndoor: timeOfDay === 'indoors',
      timeOfDayHour,
      hasFog,
      hasRain,
      floorTextureUrl,
      sceneImages,
      buildingBlocks: buildingBlocks3D,
      gridConfig3D,
      environmentSettings: updatedEnv,
      associatedMapIds: selectedScene.associatedMapIds || (selectedScene.associatedMapId ? [selectedScene.associatedMapId] : []),
    };

    await updateScene(updated);
    setSelectedScene(updated);
    setSceneCombatants(combatantsWithPositions);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;
    await createSession(newSessionTitle);
    setNewSessionTitle('');
    setShowNewSessionInput(false);
  };

  const handleAddMonsterToScene = (m: typeof INITIAL_MONSTERS[0], qty: number = 1) => {
    const newCombatants: Combatant[] = [];
    const baseName = m.name;
    
    const sameNameCombatants = sceneCombatants.filter(c => 
      c.name.toLowerCase() === baseName.toLowerCase() || 
      c.name.toLowerCase().startsWith(baseName.toLowerCase() + ' ')
    );
    
    for (let i = 0; i < qty; i++) {
      let finalName = baseName;
      const totalCount = sameNameCombatants.length + newCombatants.length;
      if (qty > 1 || totalCount > 0) {
        finalName = `${baseName} ${totalCount + 1}`;
      }
      
      newCombatants.push({
        id: `c-sc-${Date.now()}-${Math.random()}-${i}`,
        name: finalName,
        type: 'monster',
        hp: m.hp,
        maxHp: m.hp,
        ac: m.ac,
        initiative: Math.floor(Math.random() * 20) + 1,
        conditions: [],
        cr: m.cr,
        size: m.size,
        tokenImageUrl: m.tokenImageUrl,
        modelUrl: m.modelUrl,
        tokenType: m.tokenType,
      });
    }
    setSceneCombatants((prev) => [...prev, ...newCombatants]);
  };

  const handleAddCustomMonsterToScene = (monster: CustomMonster, qty: number = 1) => {
    const newCombatants: Combatant[] = [];
    const baseName = monster.name;
    
    const sameNameCombatants = sceneCombatants.filter(c => 
      c.name.toLowerCase() === baseName.toLowerCase() || 
      c.name.toLowerCase().startsWith(baseName.toLowerCase() + ' ')
    );
    
    for (let i = 0; i < qty; i++) {
      let finalName = baseName;
      const totalCount = sameNameCombatants.length + newCombatants.length;
      if (qty > 1 || totalCount > 0) {
        finalName = `${baseName} ${totalCount + 1}`;
      }
      
      newCombatants.push({
        id: `c-sc-${Date.now()}-${Math.random()}-${i}`,
        name: finalName,
        type: 'monster',
        hp: monster.hp,
        maxHp: monster.maxHp || monster.hp,
        ac: monster.ac,
        initiative: Math.floor(Math.random() * 20) + 1,
        conditions: [],
        cr: monster.cr,
        size: monster.size,
        tokenImageUrl: monster.tokenImageUrl,
        modelUrl: monster.modelUrl,
      });
    }
    setSceneCombatants((prev) => [...prev, ...newCombatants]);
  };

  const handleToggleMapAssociation = (mapId: string) => {
    if (!selectedScene) return;
    const currentIds = selectedScene.associatedMapIds || (selectedScene.associatedMapId ? [selectedScene.associatedMapId] : []);
    let newIds: string[] = [];
    if (currentIds.includes(mapId)) {
      newIds = currentIds.filter(id => id !== mapId);
    } else {
      newIds = [...currentIds, mapId];
    }
    
    setSelectedScene({
      ...selectedScene,
      associatedMapIds: newIds
    });
  };

  const handleAddNpcToScene = (npc: WorldEntity) => {
    const cs = npc.characterSheet || npc.attributes?.characterSheet;
    const hp = cs?.currentHp ?? Number(npc.attributes?.hp || npc.attributes?.pv || npc.attributes?.PV || npc.statSheet?.hp || 20);
    const maxHp = cs?.maxHp ?? Number(npc.attributes?.maxHp || npc.statSheet?.maxHp || hp);
    const ac = cs?.armorClass ?? Number(npc.attributes?.ac || npc.attributes?.ca || npc.attributes?.CA || npc.statSheet?.ac || 12);
    const dexVal = cs ? (cs.attributes?.dex?.score || 10) : (npc.statSheet?.dex || 10);
    const dexMod = Math.floor((dexVal - 10) / 2);

    const newC: Combatant = {
      id: `c-npc-${Date.now()}-${Math.random()}`,
      name: npc.name,
      type: 'npc',
      hp: hp,
      maxHp: maxHp,
      ac: ac,
      speed: cs?.speed ?? npc.statSheet?.speed ?? '9m (30ft)',
      initiative: Math.floor(Math.random() * 20) + 1 + dexMod,
      conditions: [],
      modelUrl: getModelUrlByNameOrPath(npc.name),
      str: cs ? cs.attributes?.str?.score : npc.statSheet?.str,
      dex: cs ? cs.attributes?.dex?.score : npc.statSheet?.dex,
      con: cs ? cs.attributes?.con?.score : npc.statSheet?.con,
      int: cs ? cs.attributes?.int?.score : npc.statSheet?.int,
      wis: cs ? cs.attributes?.wis?.score : npc.statSheet?.wis,
      cha: cs ? cs.attributes?.cha?.score : npc.statSheet?.cha,
      avatarUrl: npc.images?.[0] || cs?.avatarUrl,
      actions: cs?.attacks && cs.attacks.length > 0 ? cs.attacks.map((atk: any) => ({
        name: atk.name,
        desc: `Ataque: ${atk.atkBonus} para acertar. Dano: ${atk.damage} (${atk.type || 'Físico'}).`
      })) : npc.statSheet?.actions,
      characterSheet: cs,
    };
    setSceneCombatants((prev) => [...prev, newC]);
  };

  const filteredNpcs = worldEntities
    .filter((e) => e.category === 'npc')
    .filter(
      (npc) =>
        npc.name.toLowerCase().includes(combatSearchQuery.toLowerCase()) ||
        (npc.subType && npc.subType.toLowerCase().includes(combatSearchQuery.toLowerCase()))
    );

  const filteredMonsters = INITIAL_MONSTERS.filter(
    (m) =>
      m.name.toLowerCase().includes(combatSearchQuery.toLowerCase()) ||
      (m.type && m.type.toLowerCase().includes(combatSearchQuery.toLowerCase()))
  );

  const filteredCustomMonsters = customMonsters.filter(
    (m) =>
      m.name.toLowerCase().includes(combatSearchQuery.toLowerCase()) ||
      (m.type && m.type.toLowerCase().includes(combatSearchQuery.toLowerCase()))
  );

  const handleAddPlayerToScene = (mem: typeof campaignMembers[0]) => {
    const pName = mem.characterName || mem.displayName || 'Jogador';

    // Busca a ficha do personagem no localStorage para ler HP, maxHp, AC e tokenType reais
    let resolvedModelUrl: string | undefined = mem.modelUrl;
    let resolvedHp = 10;
    let resolvedMaxHp = 10;
    let resolvedAc = 10;
    let resolvedTokenType: 'billboard' | '3d' = mem.tokenType || '3d';
    let resolvedAvatarUrl: string | undefined = mem.avatarUrl;

    try {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1') || localStorage.getItem('codex_character_sheets_v1');
      if (saved) {
        const sheets: CharacterSheetMinimal[] = JSON.parse(saved);
        const cClean = pName.split('(')[0].trim().toLowerCase();
        const found = sheets.find(
          (s) =>
            (s.characterName && s.characterName.split('(')[0].trim().toLowerCase() === cClean) ||
            (s.characterName && pName.toLowerCase().includes(s.characterName.toLowerCase())) ||
            (s.characterName && s.characterName.toLowerCase().includes(pName.toLowerCase()))
        );
        if (found) {
          // Model URL
          if (!resolvedModelUrl) {
            if (found.modelUrl) resolvedModelUrl = found.modelUrl;
            else if (found.className) resolvedModelUrl = getModelUrlByNameOrPath(found.className);
          }
          // HP e AC reais da ficha
          if (found.maxHp) resolvedMaxHp = found.maxHp;
          resolvedHp = (found.currentHp != null) ? found.currentHp : resolvedMaxHp;
          if (found.armorClass) resolvedAc = found.armorClass;
          // Token type preference (3D vs 2D billboard)
          if (found.tokenType) resolvedTokenType = found.tokenType;
          if (found.avatarUrl) resolvedAvatarUrl = found.avatarUrl;
        }
      }
    } catch (e) {}

    // Fallback por nome se modelUrl ainda não foi resolvido
    if (!resolvedModelUrl) {
      resolvedModelUrl = getModelUrlByNameOrPath(pName);
    }

    const newP: Combatant = {
      id: `c-pl-${Date.now()}-${Math.random()}`,
      name: pName,
      type: 'player',
      hp: resolvedHp,
      maxHp: resolvedMaxHp,
      ac: resolvedAc,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
      modelUrl: resolvedModelUrl,
      tokenType: resolvedTokenType,
      tokenImageUrl: resolvedTokenType === 'billboard' ? resolvedAvatarUrl : undefined,
      avatarUrl: resolvedAvatarUrl,
    };
    setSceneCombatants((prev) => [...prev, newP]);
  };

  const handleAddAllPlayersToScene = () => {
    if (campaignMembers.length === 0) return;
    
    const newCombatants: Combatant[] = [];
    campaignMembers.forEach((mem) => {
      const pName = mem.characterName || mem.displayName || 'Jogador';
      
      const alreadyExists = sceneCombatants.some(
        c => c.type === 'player' && c.name.toLowerCase() === pName.toLowerCase()
      );
      
      if (!alreadyExists) {
        let resolvedModelUrl = mem.modelUrl;
        let resolvedHp = 10;
        let resolvedMaxHp = 10;
        let resolvedAc = 10;
        let resolvedTokenType: 'billboard' | '3d' = mem.tokenType || '3d';
        let resolvedAvatarUrl: string | undefined = mem.avatarUrl;

        try {
          const saved = localStorage.getItem('masters_codex_character_sheets_v1') || localStorage.getItem('codex_character_sheets_v1');
          if (saved) {
            const sheets: CharacterSheetMinimal[] = JSON.parse(saved);
            const cClean = pName.split('(')[0].trim().toLowerCase();
            const found = sheets.find(
              (s) =>
                (s.characterName && s.characterName.split('(')[0].trim().toLowerCase() === cClean) ||
                (s.characterName && pName.toLowerCase().includes(s.characterName.toLowerCase())) ||
                (s.characterName && s.characterName.toLowerCase().includes(pName.toLowerCase()))
            );
            if (found) {
              if (!resolvedModelUrl) {
                if (found.modelUrl) resolvedModelUrl = found.modelUrl;
                else if (found.className) resolvedModelUrl = getModelUrlByNameOrPath(found.className);
              }
              if (found.maxHp) resolvedMaxHp = found.maxHp;
              resolvedHp = (found.currentHp != null) ? found.currentHp : resolvedMaxHp;
              if (found.armorClass) resolvedAc = found.armorClass;
              if (found.tokenType) resolvedTokenType = found.tokenType;
              if (found.avatarUrl) resolvedAvatarUrl = found.avatarUrl;
            }
          }
        } catch (e) {}

        if (!resolvedModelUrl) {
          resolvedModelUrl = getModelUrlByNameOrPath(pName);
        }

        newCombatants.push({
          id: `c-pl-${Date.now()}-${Math.random()}`,
          name: pName,
          type: 'player',
          hp: resolvedHp,
          maxHp: resolvedMaxHp,
          ac: resolvedAc,
          initiative: Math.floor(Math.random() * 20) + 1,
          conditions: [],
          modelUrl: resolvedModelUrl,
          tokenType: resolvedTokenType,
          tokenImageUrl: resolvedTokenType === 'billboard' ? resolvedAvatarUrl : undefined,
          avatarUrl: resolvedAvatarUrl,
        });
      }
    });

    if (newCombatants.length > 0) {
      setSceneCombatants((prev) => [...prev, ...newCombatants]);
      toast.success(`${newCombatants.length} jogadores adicionados ao combate.`);
    } else {
      toast.info("Todos os jogadores já estão no combate.");
    }
  };

  const handleToggleSfxShortcut = (sfxId: string) => {
    setSfxShortcuts((prev) =>
      prev.includes(sfxId) ? prev.filter((id) => id !== sfxId) : [...prev, sfxId]
    );
  };

  const getSceneIcon = (type: string) => {
    switch (type) {
      case 'combat': return <Swords className="w-4 h-4 text-rose-400" />;
      case 'dialogue': return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'social': return <Beer className="w-4 h-4 text-amber-400" />;
      case 'exploration': return <Compass className="w-4 h-4 text-emerald-400" />;
      default: return <Film className="w-4 h-4 text-purple-400" />;
    }
  };

  const areMenusCollapsed = isScenesSidebarCollapsed && isSubTabsCollapsed;

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Main Studio Body: Left Timeline Panel + Right Scene Editor */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Scenes Timeline Sidebar */}
        <div className={`bg-[#0f141d] border-b md:border-b-0 md:border-r border-[#2a3449] flex flex-col justify-between p-3 select-none transition-all duration-300 flex-shrink-0 overflow-hidden relative z-10 ${
          is3DFullFocus ? 'hidden md:hidden' : isScenesSidebarCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'
        }`}>
          <div>
            <div className={`flex items-center ${isScenesSidebarCollapsed ? 'justify-center flex-col gap-2 mb-3' : 'justify-between px-2 mb-2'}`}>
              {!isScenesSidebarCollapsed ? (
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-purple-400" />
                  <span>Timeline ({scenes.length})</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-slate-500" title={`Timeline (${scenes.length})`}>
                  #{scenes.length}
                </span>
              )}
              
              <div className={`flex items-center gap-1 ${isScenesSidebarCollapsed ? 'flex-col' : ''}`}>
                <button
                  onClick={() => setShowCreateSceneModal(true)}
                  className="p-1 text-amber-400 hover:bg-[#161c28] rounded-lg transition-colors"
                  title="Nova Cena"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsScenesSidebarCollapsed(!isScenesSidebarCollapsed)}
                  className="p-1 text-slate-400 hover:text-amber-400 hover:bg-[#161c28] rounded-lg transition-colors"
                  title={isScenesSidebarCollapsed ? 'Expandir Timeline' : 'Recolher Timeline'}
                >
                  {isScenesSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] animate-fade-in">
              {scenes.length === 0 ? (
                <div className={`p-4 text-center text-slate-500 bg-[#161c28] border border-dashed border-[#2a3449] rounded-xl text-xs ${isScenesSidebarCollapsed ? 'text-[10px] p-1' : ''}`}>
                  {isScenesSidebarCollapsed ? 'Vazio' : 'Nenhuma cena criada nesta sessão.'}
                </div>
              ) : (
                scenes.map((sc, idx) => {
                  const isSelected = selectedScene?.id === sc.id;
                  
                  if (isScenesSidebarCollapsed) {
                    return (
                      <div
                        key={`collapsed-ss-${sc.id}`}
                        onClick={() => setSelectedScene(sc)}
                        title={`Cena #${idx + 1}: ${sc.title}`}
                        className={`w-10 h-10 mx-auto p-1.5 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer group relative ${
                          isSelected
                            ? 'bg-gradient-to-b from-purple-950 via-[#161c28] to-[#121824] border-purple-500 text-purple-300 font-bold shadow'
                            : 'bg-[#161c28] border-[#2a3449] text-slate-300 hover:bg-[#1f2738]'
                        }`}
                      >
                        <span className="text-[9px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                        <div>{getSceneIcon(sc.sceneType)}</div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={sc.id}
                      onClick={() => setSelectedScene(sc)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-950/40 via-[#161c28] to-[#121824] border-purple-500 text-purple-300 font-bold shadow'
                          : 'bg-[#161c28] border-[#2a3449] text-slate-300 hover:bg-[#1f2738]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{idx + 1}.</span>
                        {getSceneIcon(sc.sceneType)}
                        <span className="text-xs truncate font-semibold">{sc.title}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScene(sc.id);
                          if (selectedScene?.id === sc.id) setSelectedScene(null);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Scene Editor Panel */}
        <div className="flex-1 flex flex-col bg-[#0a0d14] overflow-hidden">
          {!selectedScene ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Film className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="font-bold text-slate-300 text-base">Nenhuma Cena Selecionada</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Selecione ou crie uma cena na timeline à esquerda para editar seus recursos visuais, sons e encontros.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Scene Editor Header */}
              <div className="p-3 bg-[#0d111a] border-b border-[#2a3449] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="p-2 rounded-xl bg-[#161c28] border border-[#2a3449] text-purple-400">
                    {getSceneIcon(sceneType)}
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título da Cena..."
                      className="w-full bg-transparent font-bold text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-b focus:border-purple-500 pb-0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sceneType}
                    onChange={(e) => setSceneType(e.target.value as SceneType)}
                    className="bg-[#161c28] border border-[#2a3449] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="combat">⚔️ Combate</option>
                    <option value="social">🍺 Social</option>
                    <option value="dialogue">💬 Diálogo</option>
                    <option value="exploration">🧭 Exploração</option>
                  </select>

                  <button
                    onClick={() => {
                      if (selectedScene) {
                        // Merge latest 3D positions/rotations into scene combatants
                        const { tokenPositions3D, tokenRotations3D } = useBattleGridStore.getState();
                        const mergedCombatants = (selectedScene.combatants || []).map((c) => {
                          const key = c.id || c.name;
                          const pos = tokenPositions3D[key];
                          const rot = tokenRotations3D[key];
                          return {
                            ...c,
                            x: pos !== undefined ? pos.x : c.x,
                            z: pos !== undefined ? pos.z : c.z,
                            rotation: rot !== undefined ? rot : c.rotation,
                          };
                        });
                        const sceneWithPositions = { ...selectedScene, combatants: mergedCombatants };
                        setActiveScene(sceneWithPositions);
                        onEquipScene?.(sceneWithPositions);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                    title="Disparar esta cena para a visualização dos jogadores"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>▶ DISPARAR CENA AO VIVO</span>
                  </button>

                  {isSaved && <span className="text-xs text-emerald-400 font-bold">✓ Alterações Salvas!</span>}
                  <button
                    onClick={handleSaveSceneChanges}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                  >
                    Salvar Cena
                  </button>
                </div>
              </div>

              {/* Vertical Collapsible Sub-Tabs & Editor Content Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Collapsible Sub-Tabs Sidebar (Sandwich Menu Style) */}
                <aside className={`bg-[#0f141d] border-r border-[#2a3449] flex flex-col justify-between transition-all duration-300 z-10 flex-shrink-0 ${
                  is3DFullFocus ? 'hidden' : isSubTabsCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'
                }`}>
                  <div>
                    <div className={`p-3 border-b border-[#2a3449]/60 flex items-center ${isSubTabsCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} bg-[#121824]/50`}>
                      {!isSubTabsCollapsed && (
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Recursos da Cena
                        </span>
                      )}
                      <button
                        onClick={() => setIsSubTabsCollapsed(!isSubTabsCollapsed)}
                        className="p-1.5 rounded-lg bg-[#161c28] text-slate-400 hover:text-purple-400 hover:bg-[#1f2738] transition-colors mx-auto"
                        title={isSubTabsCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
                      >
                        {isSubTabsCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Vertical Menu Buttons */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => setActiveSubTab('image')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSubTab === 'image'
                            ? 'bg-purple-600 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                        }`}
                        title="Arte / Imagem da Cena"
                      >
                        <ImageIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        {!isSubTabsCollapsed && <span className="truncate">Arte da Cena</span>}
                      </button>

                      <button
                        onClick={() => setActiveSubTab('audio')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSubTab === 'audio'
                            ? 'bg-purple-600 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                        }`}
                        title="BGM & SFX"
                      >
                        <Music className="w-4 h-4 text-pink-400 flex-shrink-0" />
                        {!isSubTabsCollapsed && <span className="truncate">Áudio (BGM & SFX)</span>}
                      </button>

                      <button
                        onClick={() => setActiveSubTab('combat')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSubTab === 'combat'
                            ? 'bg-purple-600 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                        }`}
                        title={`Encontro (${sceneCombatants.length})`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Swords className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          {!isSubTabsCollapsed && <span className="truncate">Encontro</span>}
                        </div>
                        {!isSubTabsCollapsed && sceneCombatants.length > 0 && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            activeSubTab === 'combat' ? 'bg-slate-950 text-purple-300' : 'bg-[#161c28] text-slate-400 border border-[#2a3449]'
                          }`}>
                            {sceneCombatants.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveSubTab('dungeon-maps')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSubTab === 'dungeon-maps'
                            ? 'bg-purple-600 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                        }`}
                        title="Mapas de Masmorras da Cena"
                      >
                        <Map className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {!isSubTabsCollapsed && <span className="truncate">Mapa de Dungeon</span>}
                      </button>

                      <button
                        onClick={() => setActiveSubTab('voice')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSubTab === 'voice'
                            ? 'bg-purple-600 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                        }`}
                        title="Voz de NPC por IA"
                      >
                        <Mic className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        {!isSubTabsCollapsed && <span className="truncate">Voz de NPC por IA</span>}
                      </button>

                      <button
                        onClick={() => setActiveSubTab('notes')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSubTab === 'notes'
                            ? 'bg-purple-600 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                        }`}
                        title="Texto Sensorial & Segredos"
                      >
                        <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        {!isSubTabsCollapsed && <span className="truncate">Texto & Segredos</span>}
                      </button>

                      <button
                        onClick={() => setActiveSubTab('worldbuilding')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeSubTab === 'worldbuilding'
                            ? 'bg-purple-600 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                        }`}
                        title={`Transmitir Worldbuilding (${worldEntities.length})`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          {!isSubTabsCollapsed && <span className="truncate">Transmitir World</span>}
                        </div>
                        {!isSubTabsCollapsed && worldEntities.length > 0 && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            activeSubTab === 'worldbuilding' ? 'bg-slate-950 text-amber-300' : 'bg-[#161c28] text-slate-400 border border-[#2a3449]'
                          }`}>
                            {worldEntities.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </aside>

                {/* Sub-Tab Editor Content */}
                <div className={`flex-1 bg-[#0a0d14] ${is3DFullFocus ? 'p-2 overflow-hidden' : 'overflow-y-auto p-6'}`}>
                {activeSubTab === 'image' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Add Image Options */}
                    <div className="bg-[#121824] p-4 rounded-xl border border-[#2a3449] space-y-4">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Adicionar Nova Arte/Mídia ao Slideshow
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Option 1: File Upload */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Upload de Imagem ou Vídeo (Supabase)
                          </label>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            disabled={!isSupabaseConfigured()}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const isVideo = file.type.startsWith('video/');
                              try {
                                const publicUrl = await storageService.uploadAsset(file, 'scenes');
                                const newImg: SceneImage = {
                                  id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                  imageUrl: publicUrl,
                                  overlayText: '',
                                  secretNotes: '',
                                  mediaType: isVideo ? 'video' : 'image',
                                };
                                setSceneImages(prev => [...prev, newImg]);
                                if (!imageUrl) setImageUrl(publicUrl); // set primary fallback if empty
                              } catch (err: any) {
                                showAlert({
                                  title: 'Erro de Upload',
                                  message: err.message || 'Erro ao fazer upload do arquivo.',
                                  variant: 'danger',
                                });
                              }
                            }}
                            className={`w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-300 file:bg-purple-600/20 file:border-0 file:text-purple-300 file:px-3 file:py-1 file:rounded-md file:text-[10px] file:font-bold file:cursor-pointer ${
                              !isSupabaseConfigured() ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          {!isSupabaseConfigured() && (
                            <p className="text-[9px] text-rose-400 font-bold">
                              ⚠️ Supabase não configurado. Upload desabilitado.
                            </p>
                          )}
                        </div>

                        {/* Option 2: Image/Video URL */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Ou Colar URL Direta da Imagem / Vídeo
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://exemplo.com/mídia.png ou .mp4"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const target = e.target as HTMLInputElement;
                                  if (target.value.trim()) {
                                    const rawVal = target.value.trim();
                                    const normalized = normalizeImageUrl(rawVal);
                                    const isYouTube = isYouTubeUrl(rawVal);
                                    const isVideo = isYouTube || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(normalized);
                                    const newImg: SceneImage = {
                                      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                      imageUrl: normalized,
                                      overlayText: '',
                                      secretNotes: '',
                                      mediaType: isVideo ? 'video' : 'image',
                                    };
                                    setSceneImages(prev => [...prev, newImg]);
                                    if (!imageUrl) setImageUrl(normalized);
                                    target.value = '';
                                  }
                                }
                              }}
                              className="flex-1 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                if (input.value.trim()) {
                                  const rawVal = input.value.trim();
                                  const normalized = normalizeImageUrl(rawVal);
                                  const isYouTube = isYouTubeUrl(rawVal);
                                  const isVideo = isYouTube || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(normalized);
                                  const newImg: SceneImage = {
                                    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                    imageUrl: normalized,
                                    overlayText: '',
                                    secretNotes: '',
                                    mediaType: isVideo ? 'video' : 'image',
                                  };
                                  setSceneImages(prev => [...prev, newImg]);
                                  if (!imageUrl) setImageUrl(normalized);
                                  input.value = '';
                                }
                              }}
                              className="px-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold text-xs rounded-lg cursor-pointer"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* AI Mock button */}
                      <div className="pt-2 border-t border-[#2a3449]/40 flex justify-end">
                        <button
                          type="button"
                          onClick={() => showAlert({
                            title: 'Em Breve',
                            message: 'Integração com Nano Banana/Gemini IA estará disponível em breve!',
                            variant: 'info',
                          })}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Gerar Imagem com IA</span>
                        </button>
                      </div>
                    </div>

                    {/* Scene Images List */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Slides Ativos na Cena ({sceneImages.length})
                      </div>
                      
                      {sceneImages.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-[#161c28] border border-dashed border-[#2a3449] rounded-2xl text-xs">
                          Nenhuma imagem ou slide adicionado a esta cena. Adicione um arquivo ou cole uma URL acima para começar.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sceneImages.map((imgObj, idx) => (
                            <div key={imgObj.id} className="p-4 bg-[#121824] rounded-xl border border-[#2a3449] flex flex-col md:flex-row gap-4 shadow">
                              {/* Preview Column */}
                              <div className="relative w-full md:w-32 h-24 bg-black rounded-lg overflow-hidden border border-[#2a3449]/80 shrink-0">
                                {isYouTubeUrl(imgObj.imageUrl) ? (
                                  <>
                                    <img src={getYouTubeThumbnailUrl(imgObj.imageUrl) || ''} className="w-full h-full object-cover" alt="YouTube Preview" />
                                    <span className="absolute top-1 right-1 bg-red-600/95 text-[8px] font-bold text-white px-1 rounded uppercase tracking-wider font-mono">
                                      YOUTUBE
                                    </span>
                                  </>
                                ) : imgObj.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(imgObj.imageUrl) ? (
                                  <>
                                    <video src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover bg-black" muted playsInline />
                                    <span className="absolute top-1 right-1 bg-purple-900/95 text-[8px] font-bold text-purple-200 px-1 rounded uppercase tracking-wider font-mono">
                                      VÍDEO
                                    </span>
                                  </>
                                ) : (
                                  <img src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" />
                                )}
                                <span className="absolute top-1 left-1 bg-black/80 text-[9px] font-bold text-amber-400 px-1.5 py-0.5 rounded font-mono">
                                  Slide {idx + 1}
                                </span>
                              </div>

                              {/* Form Inputs Column */}
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                                    Texto de Legenda (Visível para os jogadores na tela):
                                  </label>
                                  <input
                                    type="text"
                                    value={imgObj.overlayText || ''}
                                    placeholder="Ex: O dragão ancestral emerge das cinzas do vulcão..."
                                    onChange={(e) => {
                                      const next = [...sceneImages];
                                      next[idx] = { ...next[idx], overlayText: e.target.value };
                                      setSceneImages(next);
                                    }}
                                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold text-amber-400/80 uppercase mb-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Teleprompter do Narrador (Apenas você visualiza no Cockpit):
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={imgObj.secretNotes || ''}
                                    placeholder="Ex: Ler com tom grave. Os jogadores devem rolar salvaguarda de Destreza assim que o dragão rugir..."
                                    onChange={(e) => {
                                      const next = [...sceneImages];
                                      next[idx] = { ...next[idx], secretNotes: e.target.value };
                                      setSceneImages(next);
                                    }}
                                    className="w-full bg-[#0a0d14] border border-amber-500/20 focus:border-amber-500 rounded-lg p-2 text-xs text-amber-200 font-serif resize-none"
                                  />
                                </div>
                              </div>

                              {/* Delete button */}
                              <div className="flex items-end justify-end md:justify-center md:items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = sceneImages.filter((_, i) => i !== idx);
                                    setSceneImages(next);
                                    if (imageUrl === imgObj.imageUrl) {
                                      setImageUrl(next[0]?.imageUrl || '');
                                    }
                                  }}
                                  className="p-2 bg-[#0a0d14] hover:bg-rose-950/20 border border-[#2a3449] hover:border-rose-500/30 text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                                  title="Remover Slide"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeSubTab === 'audio' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Trilhas BGM Selecionadas */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400">Trilhas de Música Selecionadas para esta Cena (BGM):</label>
                      {bgmTracks.length === 0 ? (
                        <div className="text-xs text-slate-500 italic p-3 bg-[#0a0d14] rounded-xl border border-dashed border-[#2a3449]">
                          Nenhuma música associada a esta cena. Selecione abaixo para adicionar.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-[#0a0d14] rounded-xl border border-[#2a3449]">
                          {bgmTracks.map(trackId => {
                            const track = allBgmTracks.find(t => t.id === trackId);
                            return (
                              <span key={trackId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-950/40 text-pink-300 text-xs font-bold rounded-lg border border-pink-500/20">
                                <span>{track ? track.name : 'Trilha Customizada'}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setBgmTracks(bgmTracks.filter(id => id !== trackId))}
                                  className="text-pink-500 hover:text-pink-300 font-bold ml-1"
                                >
                                  &times;
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sugestões de Músicas Favoritas */}
                    {favoriteBgmTracks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider flex items-center gap-1">⭐ Sugestões Favoritas (BGM)</span>
                        <div className="grid grid-cols-2 gap-2">
                          {favoriteBgmTracks.map(track => {
                            const isSelected = bgmTracks.includes(track.id);
                            return (
                              <button
                                key={track.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setBgmTracks(bgmTracks.filter(id => id !== track.id));
                                  } else {
                                    setBgmTracks([...bgmTracks, track.id]);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span className="truncate">{track.name}</span>
                                <span>{isSelected ? '✓' : '+'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Todas as Trilhas de Música */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Todas as Músicas (SRD & Uploads)</span>
                      <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 border border-[#2a3449] rounded-xl p-2 bg-[#0a0d14]">
                        {allBgmTracks.map(track => {
                          const isSelected = bgmTracks.includes(track.id);
                          return (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => {
                                  if (isSelected) {
                                    setBgmTracks(bgmTracks.filter(id => id !== track.id));
                                  } else {
                                    setBgmTracks([...bgmTracks, track.id]);
                                  }
                              }}
                              className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-pink-900/30 text-pink-300 font-bold'
                                  : 'hover:bg-[#121824] text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className="truncate">{track.name}</span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {track.isCustom ? 'Upload' : 'Padrão'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SFX Section */}
                    <div className="pt-4 border-t border-slate-800 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">
                          Atalhos de Efeitos Sonoros SFX Selecionados:
                        </label>
                        {sfxShortcuts.length === 0 ? (
                          <div className="text-xs text-slate-500 italic p-3 bg-[#0a0d14] rounded-xl border border-dashed border-[#2a3449]">
                            Nenhum efeito sonoro rápido associado a esta cena.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 p-2 bg-[#0a0d14] rounded-xl border border-[#2a3449]">
                            {sfxShortcuts.map(sfxId => {
                              const sfx = allSfxTracks.find(s => s.id === sfxId);
                              return (
                                <span key={sfxId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/20">
                                  <span>{sfx ? sfx.name : 'Efeito Customizado'}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => setSfxShortcuts(sfxShortcuts.filter(id => id !== sfxId))}
                                    className="text-amber-500 hover:text-amber-300 font-bold ml-1"
                                  >
                                    &times;
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sugestões de SFX Favoritos */}
                      {favoriteSfxTracks.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">⭐ Sugestões Favoritas (SFX)</span>
                          <div className="grid grid-cols-3 gap-2">
                            {favoriteSfxTracks.map(sfx => {
                              const isSelected = sfxShortcuts.includes(sfx.id);
                              return (
                                <button
                                  key={sfx.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSfxShortcuts(sfxShortcuts.filter(id => id !== sfx.id));
                                    } else {
                                      setSfxShortcuts([...sfxShortcuts, sfx.id]);
                                    }
                                  }}
                                  className={`p-2 rounded-xl border text-center text-xs transition-all flex flex-col items-center gap-1 ${
                                    isSelected
                                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                                      : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <span className="text-[10px] truncate">{sfx.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Todos os Efeitos SFX */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Todos os Efeitos Sonoros</span>
                        <div className="grid grid-cols-3 gap-2">
                          {allSfxTracks.map((sfx) => {
                            const isSelected = sfxShortcuts.includes(sfx.id);
                            return (
                              <button
                                key={sfx.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSfxShortcuts(sfxShortcuts.filter((id) => id !== sfx.id));
                                  } else {
                                    setSfxShortcuts([...sfxShortcuts, sfx.id]);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                  isSelected
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-inner'
                                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span className="text-xs truncate">{sfx.name}</span>
                                <span className="text-[8px] font-mono text-slate-500 uppercase">{sfx.isCustom ? 'Upload' : sfx.category}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'combat' && (
                  <div className={`w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 items-start transition-all duration-300 ${
                    is3DFullFocus ? 'max-w-none px-0' : areMenusCollapsed ? 'max-w-[95%] xl:max-w-[1550px]' : 'max-w-7xl'
                  }`}>
                    {/* Left Column: Monster/Player Selection & Current Scene Combatants List */}
                    <div className={`space-y-3.5 bg-[#121824]/90 p-4 rounded-2xl border border-[#2a3449] shadow-xl transition-all duration-300 ${
                      is3DFullFocus ? 'hidden' : areMenusCollapsed ? 'lg:col-span-4' : 'lg:col-span-5'
                    }`}>
                      {/* Medidor de Dificuldade de Encontros (CR/XP D&D 5e) */}
                      <EncounterDifficultyMeter
                        party={encounterPartyList}
                        monsters={encounterMonstersList}
                        onRemoveMonster={(id) => setSceneCombatants((prev) => prev.filter((c) => c.id !== id))}
                      />

                      {/* Gerador Rápido de Encontros por Dificuldade */}
                      <div className="p-3 bg-[#161c28] border border-amber-500/30 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                          <span className="flex items-center gap-1.5 font-serif">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Gerador Rápido de Encontros (D&D 5e):
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Auto Balanceado
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => handleAutoGenerateEncounter('easy')}
                            className="px-2 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            title="Gerar encontro com dificuldade Fácil para a party"
                          >
                            <Shield className="w-3 h-3" /> Fácil
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAutoGenerateEncounter('medium')}
                            className="px-2 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 text-amber-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            title="Gerar encontro com dificuldade Média para a party"
                          >
                            <Swords className="w-3 h-3" /> Médio
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAutoGenerateEncounter('hard')}
                            className="px-2 py-1.5 bg-orange-950/60 hover:bg-orange-900/80 border border-orange-700/60 text-orange-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            title="Gerar encontro com dificuldade Difícil para a party"
                          >
                            <Flame className="w-3 h-3" /> Difícil
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAutoGenerateEncounter('deadly')}
                            className="px-2 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            title="Gerar encontro com dificuldade Mortal para a party"
                          >
                            <Skull className="w-3 h-3" /> Mortal
                          </button>
                        </div>
                      </div>

                      {/* Widget Unificado de Adição de Combatentes (SRD, Mundo, NPCs e Jogadores) */}
                      <div className="p-3 bg-[#161c28] border border-[#2a3449] hover:border-amber-500/30 rounded-xl space-y-2.5 relative combat-dropdown-container transition-all">
                        {/* Tab Bar / Segmented Control */}
                        <div className="flex items-center justify-between border-b border-[#2a3449] pb-2 gap-1 overflow-x-auto scrollbar-none">
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setCombatAddTab('srd');
                                setCombatSearchQuery('');
                                setShowCombatDropdown(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                combatAddTab === 'srd'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                              }`}
                            >
                              <Skull className="w-3 h-3 text-rose-400" />
                              <span>SRD (5e)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCombatAddTab('world');
                                setCombatSearchQuery('');
                                setShowCombatDropdown(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                combatAddTab === 'world'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Mundo ({customMonsters.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCombatAddTab('npcs');
                                setCombatSearchQuery('');
                                setShowCombatDropdown(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                combatAddTab === 'npcs'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                              }`}
                            >
                              <User className="w-3 h-3 text-amber-400" />
                              <span>NPCs ({filteredNpcs.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCombatAddTab('players');
                                setCombatSearchQuery('');
                                setShowCombatDropdown(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                combatAddTab === 'players'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                              }`}
                            >
                              <Shield className="w-3 h-3 text-cyan-400" />
                              <span>Jogadores ({campaignMembers.length})</span>
                            </button>
                          </div>

                          {combatAddTab === 'players' && campaignMembers.length > 0 && (
                            <button
                              type="button"
                              onClick={handleAddAllPlayersToScene}
                              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-[9px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1 shrink-0 font-sans cursor-pointer"
                              title="Adicionar todos os jogadores ao combate com 1 clique"
                            >
                              <Users className="w-2.5 h-2.5" /> Importar Grupo
                            </button>
                          )}
                        </div>

                        {/* Conteúdo da Aba Jogadores */}
                        {combatAddTab === 'players' ? (
                          <div className="space-y-2">
                            {campaignMembers.length === 0 ? (
                              <div className="p-3 text-center text-slate-500 text-xs">
                                Nenhum jogador conectado na campanha
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-0.5">
                                {campaignMembers.map((mem) => (
                                  <button
                                    key={mem.id}
                                    type="button"
                                    onClick={() => handleAddPlayerToScene(mem)}
                                    className="px-2.5 py-1.5 bg-[#0a0d14] hover:bg-[#121824] border border-cyan-500/40 hover:border-cyan-400 rounded-xl text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                  >
                                    <Shield className="w-3 h-3 text-cyan-400" />
                                    <span>+ {mem.characterName || mem.displayName}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Conteúdo das Abas SRD, Mundo e NPCs (Campo de busca + Qtd + Dropdown) */
                          <div className="relative">
                            <div className="flex gap-2 items-center">
                              <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                  type="text"
                                  value={combatSearchQuery}
                                  onChange={(e) => {
                                    setCombatSearchQuery(e.target.value);
                                    setShowCombatDropdown(true);
                                  }}
                                  onFocus={() => setShowCombatDropdown(true)}
                                  placeholder={
                                    combatAddTab === 'srd'
                                      ? "Buscar monstro no Compêndio SRD..."
                                      : combatAddTab === 'world'
                                      ? "Buscar monstro / homebrew do mundo..."
                                      : "Buscar NPC por nome ou subtipo..."
                                  }
                                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/40 font-sans"
                                />
                                {combatSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCombatSearchQuery('');
                                      setShowCombatDropdown(false);
                                    }}
                                    className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-200 font-sans cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              {combatAddTab !== 'npcs' && (
                                <div className="flex items-center gap-1 shrink-0 bg-[#0a0d14] border border-[#2a3449] rounded-xl px-2 py-1 select-none">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase font-sans">Qtd:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={monsterQty}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      setMonsterQty(isNaN(val) ? 1 : Math.max(1, Math.min(99, val)));
                                    }}
                                    className="w-8 bg-transparent text-xs text-slate-200 text-center font-bold focus:outline-none font-sans"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setMonsterQty((prev) => Math.min(99, prev + 1))}
                                      className="text-[8px] text-slate-400 hover:text-slate-200 px-0.5 leading-none cursor-pointer"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMonsterQty((prev) => Math.max(1, prev - 1))}
                                      className="text-[8px] text-slate-400 hover:text-slate-200 px-0.5 leading-none cursor-pointer"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Floating Dropdown List */}
                            {showCombatDropdown && (
                              <div className="absolute left-0 right-0 mt-1.5 bg-[#121824] border border-[#2a3449] rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60">
                                {combatAddTab === 'srd' && (
                                  filteredMonsters.length === 0 ? (
                                    <div className="p-3 text-center text-slate-500 text-xs font-sans">
                                      Nenhum monstro encontrado
                                    </div>
                                  ) : (
                                    filteredMonsters.map((m) => {
                                      const monsterXp = crToXp(m.cr) * monsterQty;
                                      const preview = previewEncounterWithNewMonster(encounterPartyList, encounterMonstersList, { cr: m.cr, xp: monsterXp });
                                      return (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() => {
                                            handleAddMonsterToScene(m, monsterQty);
                                            setCombatSearchQuery('');
                                            setShowCombatDropdown(false);
                                          }}
                                          className="w-full px-3 py-2 text-left hover:bg-[#1c2436] flex items-center justify-between text-xs transition-colors group font-sans cursor-pointer gap-2"
                                        >
                                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <Skull className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-300 shrink-0" />
                                            <span className="font-bold text-slate-200 group-hover:text-slate-100 truncate">{m.name}</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded font-mono shrink-0">
                                              CR {m.cr} • {crToXp(m.cr).toLocaleString()} XP
                                            </span>
                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                              preview.difficulty === 'deadly' ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' :
                                              preview.difficulty === 'hard' ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' :
                                              preview.difficulty === 'medium' ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' :
                                              preview.difficulty === 'easy' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' :
                                              'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                                            }`}>
                                              +{monsterXp.toLocaleString()} XP → {preview.difficultyLabel}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-rose-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            + Adicionar ({monsterQty})
                                          </span>
                                        </button>
                                      );
                                    })
                                  )
                                )}

                                {combatAddTab === 'world' && (
                                  filteredCustomMonsters.length === 0 ? (
                                    <div className="p-3 text-center text-slate-500 text-xs font-sans">
                                      Nenhum monstro/besta encontrado
                                    </div>
                                  ) : (
                                    filteredCustomMonsters.map((m) => {
                                      const monsterXp = crToXp(m.cr) * monsterQty;
                                      const preview = previewEncounterWithNewMonster(encounterPartyList, encounterMonstersList, { cr: m.cr, xp: monsterXp });
                                      return (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() => {
                                            handleAddCustomMonsterToScene(m, monsterQty);
                                            setCombatSearchQuery('');
                                            setShowCombatDropdown(false);
                                          }}
                                          className="w-full px-3 py-2 text-left hover:bg-[#1c2436] flex items-center justify-between text-xs transition-colors group font-sans cursor-pointer gap-2"
                                        >
                                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <Skull className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300 shrink-0" />
                                            <span className="font-bold text-slate-200 group-hover:text-slate-100 truncate">{m.name}</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded font-mono shrink-0">
                                              CR {m.cr} • {crToXp(m.cr).toLocaleString()} XP
                                            </span>
                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                              preview.difficulty === 'deadly' ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' :
                                              preview.difficulty === 'hard' ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' :
                                              preview.difficulty === 'medium' ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' :
                                              preview.difficulty === 'easy' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' :
                                              'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                                            }`}>
                                              +{monsterXp.toLocaleString()} XP → {preview.difficultyLabel}
                                            </span>
                                            {m.type && (
                                              <span className="text-[9px] text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1 py-0.5 rounded uppercase font-mono">
                                                {m.type}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            + Adicionar ({monsterQty})
                                          </span>
                                        </button>
                                      );
                                    })
                                  )
                                )}

                                {combatAddTab === 'npcs' && (
                                  filteredNpcs.length === 0 ? (
                                    <div className="p-3 text-center text-slate-500 text-xs">
                                      Nenhum NPC encontrado
                                    </div>
                                  ) : (
                                    filteredNpcs.map((npc) => {
                                      const npcCr = (npc.attributes?.cr || npc.attributes?.nd || '1/2') as string;
                                      const npcXp = crToXp(npcCr);
                                      const preview = previewEncounterWithNewMonster(encounterPartyList, encounterMonstersList, { cr: npcCr, xp: npcXp });
                                      return (
                                        <button
                                          key={npc.id}
                                          type="button"
                                          onClick={() => {
                                            handleAddNpcToScene(npc);
                                            setCombatSearchQuery('');
                                            setShowCombatDropdown(false);
                                          }}
                                          className="w-full px-3 py-2 text-left hover:bg-[#1c2436] flex items-center justify-between text-xs transition-colors group cursor-pointer gap-2"
                                        >
                                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <User className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 shrink-0" />
                                            <span className="font-bold text-slate-200 group-hover:text-slate-100 truncate">{npc.name}</span>
                                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-500/20 shrink-0">
                                              ND {npcCr} • {npcXp.toLocaleString()} XP
                                            </span>
                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                              preview.difficulty === 'deadly' ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' :
                                              preview.difficulty === 'hard' ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' :
                                              preview.difficulty === 'medium' ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' :
                                              preview.difficulty === 'easy' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' :
                                              'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                                            }`}>
                                              +{npcXp.toLocaleString()} XP → {preview.difficultyLabel}
                                            </span>
                                            {npc.subType && (
                                              <span className="text-[10px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                                                {npc.subType}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-amber-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            + Adicionar
                                          </span>
                                        </button>
                                      );
                                    })
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Scene Combatants List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
                          <span>Combatentes da Cena ({sceneCombatants.length}):</span>
                          {sceneCombatants.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSceneCombatants([])}
                              className="text-[10px] text-rose-400 hover:underline font-normal cursor-pointer"
                            >
                              Limpar Todos
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                          {sceneCombatants.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 bg-[#161c28] border border-dashed border-[#2a3449] rounded-xl text-xs">
                              Nenhum combatente nesta cena. Clique nos monstros ou jogadores acima para incluir no encontro!
                            </div>
                          ) : (
                            sceneCombatants.map((c, idx) => (
                              <div key={idx} className="p-2.5 bg-[#161c28] border border-[#2a3449] hover:border-slate-600 rounded-xl flex items-center justify-between shadow-sm transition-all gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  {c.type === 'player' ? (
                                    <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                                  ) : c.type === 'npc' ? (
                                    <User className="w-4 h-4 text-amber-400 shrink-0" />
                                  ) : (
                                    <Skull className="w-4 h-4 text-rose-400 shrink-0" />
                                  )}
                                  <span className="text-xs font-bold text-slate-100 truncate">{c.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">HP: {c.hp} | CA: {c.ac}</span>
                                  {c.type !== 'player' && (
                                    <span className="text-[9px] font-mono text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded border border-rose-900/50 shrink-0">
                                      CR {c.cr || '0'} • {crToXp(c.cr).toLocaleString()} XP
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                    c.type === 'player' 
                                      ? 'bg-cyan-500/20 text-cyan-300' 
                                      : c.type === 'npc'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {c.type === 'player' ? 'JOGADOR' : c.type === 'npc' ? 'NPC' : 'MONSTRO'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSceneCombatants((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer shrink-0"
                                  title="Remover combatente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: 3D Battle Grid Interactive Preview */}
                    <div className={`space-y-2.5 bg-[#121824]/90 p-4 rounded-2xl border border-amber-500/30 shadow-xl transition-all duration-300 ${
                      is3DFullFocus ? 'lg:col-span-12 w-full' : areMenusCollapsed ? 'lg:col-span-8' : 'lg:col-span-7'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                          <Swords className="w-4 h-4 text-amber-400" />
                          <span>Pré-configuração e Posicionamento 3D no Grid:</span>
                          {is3DFullFocus && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 normal-case tracking-normal animate-pulse">
                              ⚡ Tela Máxima
                            </span>
                          )}
                        </span>
                        
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] text-amber-400 font-mono font-normal hidden sm:inline normal-case">
                            Arraste & posicione no painel 3D
                          </span>
                          <button
                            type="button"
                            onClick={toggle3DFullFocus}
                            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                              is3DFullFocus
                                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 font-black'
                                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 hover:border-amber-400'
                            }`}
                            title={is3DFullFocus ? 'Restaurar Painéis e Menus da Sessão' : 'Expandir Tela Máxima (Foco Total no Grid de Batalha 3D)'}
                          >
                            {is3DFullFocus ? (
                              <>
                                <Minimize2 className="w-3.5 h-3.5" />
                                <span>Restaurar Menus</span>
                              </>
                            ) : (
                              <>
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Expandir Tela Máxima</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className={`w-full bg-black rounded-2xl border border-amber-500/30 overflow-hidden relative shadow-2xl transition-all duration-300 ${
                        is3DFullFocus ? 'h-[calc(100vh-360px)]' : areMenusCollapsed ? 'h-[460px]' : 'h-[400px]'
                      }`}>
                        {sceneCombatants.length === 0 ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/80 backdrop-blur-sm">
                            <Swords className="w-12 h-12 text-amber-500/40 mb-3 animate-pulse" />
                            <p className="text-sm font-bold text-slate-200">Grid 3D Aguardando Combatentes</p>
                            <p className="text-xs text-slate-400 max-w-xs mt-1.5">
                              Adicione monstros do compêndio ou jogadores no painel ao lado para ativar a pré-visualização e posicionamento 3D!
                            </p>
                          </div>
                        ) : (
                          <ThreeErrorBoundary>
                            <BattleGrid3D
                              combatants={sceneCombatants}
                              onUpdateCombatants={(updated) => setSceneCombatants(updated)}
                              interactive={true}
                              isPlacementPhase={true}
                              {...environmentSettings}
                              timeOfDayHour={timeOfDayHour}
                              timeOfDayPreset={timeOfDay}
                              isIndoor={timeOfDay === 'indoors'}
                              hasFog={hasFog}
                              hasRain={hasRain}
                              onTimeOfDayChange={setTimeOfDay}
                              initialBuildingBlocks={buildingBlocks3D}
                              onBuildingBlocksChange={(blocks) => {
                                setBuildingBlocks3D(blocks);
                                setEnvironmentSettings((prev) => ({ ...prev, building_blocks_3d: blocks }));
                              }}
                              initialGridConfig={gridConfig3D}
                              onGridConfigChange={(gridCfg) => {
                                setGridConfig3D(gridCfg);
                                setEnvironmentSettings((prev) => ({ ...prev, grid_config_3d: gridCfg }));
                              }}
                              onEnvironmentChange={(env) => {
                                if (env.timeOfDayPreset) {
                                  setTimeOfDay(env.timeOfDayPreset);
                                }
                                setTimeOfDayHour(env.timeOfDayHour);
                                setHasFog(env.hasFog);
                                setHasRain(env.hasRain);
                                setEnvironmentSettings(prev => ({ ...prev, ...env }));
                              }}
                              floorTextureUrl={floorTextureUrl}
                              onFloorTextureChange={setFloorTextureUrl}
                              userRole="dm"
                            />
                          </ThreeErrorBoundary>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'voice' && (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Vincular NPC da História:</label>
                      <select
                        value={npcName}
                        onChange={(e) => setNpcName(e.target.value)}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Selecione um NPC...</option>
                        {worldEntities.filter((e) => e.category === 'npc').map((npc) => (
                          <option key={npc.id} value={npc.name}>
                            {npc.name} ({npc.subType || 'NPC'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">URL do Áudio da Voz de IA do NPC:</label>
                      <input
                        type="url"
                        value={npcAudioUrl}
                        onChange={(e) => setNpcAudioUrl(e.target.value)}
                        placeholder="https://cdn.pixabay.com/download/audio/..."
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {npcAudioUrl && (
                      <div className="p-4 bg-[#161c28] border border-cyan-500/30 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-slate-200">Voz do NPC: {npcName || 'Narrador'}</span>
                        </div>
                        <audio controls src={npcAudioUrl} className="h-8" />
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'notes' && (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                        <span>Texto Sensorial (Para ler em voz alta aos jogadores):</span>
                        <span className="text-[10px] text-amber-400/80 font-mono">Digite @ para mencionar</span>
                      </label>
                      <MentionTextarea
                        rows={4}
                        value={sensoryText}
                        worldEntities={worldEntities}
                        onChangeValue={(val) => setSensoryText(val)}
                        placeholder="Ex: O som da chuva bate forte nas janelas de madeira... Digite @ para vincular NPCs ou itens."
                        className="font-serif leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Notas Secretas do Mestre (Apenas você visualiza):
                        </span>
                        <span className="text-[10px] text-amber-400/80 font-mono">Digite @ para mencionar</span>
                      </label>
                      <MentionTextarea
                        rows={4}
                        value={secretNotes}
                        worldEntities={worldEntities}
                        onChangeValue={(val) => setSecretNotes(val)}
                        placeholder="Ex: O mordomo carrega uma chave secreta... Digite @ para vincular monstros, magias e estatísticas."
                        className="border-amber-500/30 text-amber-200 font-serif leading-relaxed focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {activeSubTab === 'worldbuilding' && (
                  <div className="max-w-4xl mx-auto space-y-4">
                    <div className="bg-[#121824] p-4 rounded-xl border border-[#2a3449] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" /> Transmitir Lore & Conhecimento para a Cena
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Selecione entradas do Worldbuilding para revelar detalhes na cena atual e publicar no Feed da Campanha dos jogadores.
                          </p>
                        </div>
                      </div>

                      {/* Filter & Search */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={worldSearch}
                            onChange={(e) => setWorldSearch(e.target.value)}
                            placeholder="Buscar NPCs, locais, religiões, feitiços, itens..."
                            className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto">
                          <button
                            type="button"
                            onClick={() => setWorldFilterCat('all')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              worldFilterCat === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Todos ({worldEntities.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setWorldFilterCat('npc')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              worldFilterCat === 'npc' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            NPCs
                          </button>
                          <button
                            type="button"
                            onClick={() => setWorldFilterCat('location')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              worldFilterCat === 'location' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Locais
                          </button>
                          <button
                            type="button"
                            onClick={() => setWorldFilterCat('faction')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              worldFilterCat === 'faction' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Facções
                          </button>
                          <button
                            type="button"
                            onClick={() => setWorldFilterCat('spell')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              worldFilterCat === 'spell' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Feitiços
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Entities Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {worldEntities
                        .filter((ent) => {
                          const matchesCat = worldFilterCat === 'all' || ent.category === worldFilterCat;
                          const matchesQuery =
                            !worldSearch ||
                            ent.name.toLowerCase().includes(worldSearch.toLowerCase()) ||
                            ent.shortDesc.toLowerCase().includes(worldSearch.toLowerCase());
                          return matchesCat && matchesQuery;
                        })
                        .map((ent) => (
                          <div
                            key={ent.id}
                            className="p-4 rounded-2xl bg-[#161c28] border border-[#2a3449] hover:border-amber-500/50 transition-all flex flex-col justify-between overflow-hidden"
                          >
                            <div>
                              {ent.images && ent.images.length > 0 && (
                                <div className="relative aspect-video -mx-4 -mt-4 mb-3 overflow-hidden bg-[#0a0d14]">
                                  <img src={ent.images[0]} alt={ent.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold uppercase bg-[#0a0d14] text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                                  {ent.subType || ent.category}
                                </span>
                              </div>
                              <h5 className="font-bold text-sm text-slate-100">{ent.name}</h5>
                              <p className="text-xs text-slate-300 mt-1 font-serif line-clamp-3">{ent.shortDesc}</p>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                if (!selectedScene) {
                                  toast.error('Selecione uma cena ativa para transmitir a lore.');
                                  return;
                                }
                                const loreSegment = `\n\n📜 [WORLDBUILDING REVELADO: ${ent.name}]\n${ent.shortDesc}\n${ent.fullContent ? `Detalhes: ${ent.fullContent}` : ''}`;
                                const updatedSensory = sensoryText ? `${sensoryText}${loreSegment}` : loreSegment.trim();
                                setSensoryText(updatedSensory);

                                if (activeCampaign) {
                                  await createFeedEvent({
                                    campaignId: activeCampaign.id,
                                    eventType: 'world_lore',
                                    title: `Lore Revelada: ${ent.name}`,
                                    summary: ent.shortDesc,
                                    isPublic: true,
                                  });
                                }

                                await updateScene({
                                  ...selectedScene,
                                  sensoryText: updatedSensory,
                                });

                                toast.success(`✨ Lore "${ent.name}" transmitida para a cena e Feed da Campanha!`);
                              }}
                              className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>⚡ Transmitir para a Cena & Feed</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {activeSubTab === 'dungeon-maps' && selectedScene && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-[#121824] p-5 rounded-2xl border border-[#2a3449] space-y-4 shadow-xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Map className="w-4.5 h-4.5 text-emerald-400" /> Associar Mapas de Masmorra à Cena
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Selecione um ou mais mapas de masmorras da campanha para disponibilizar nesta cena. No cockpit do mestre, você poderá alternar entre eles em tempo real.
                        </p>
                      </div>

                      {campaignMaps.length === 0 ? (
                        <div className="p-6 bg-[#0a0d14]/50 border border-dashed border-[#2a3449] rounded-xl text-center">
                          <p className="text-xs text-slate-500">Nenhum mapa criado nesta campanha.</p>
                          <p className="text-[10px] text-slate-600 mt-1">Vá até o menu Mapas no topo para criar sua primeira masmorra.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                          {campaignMaps.map((map) => {
                            const isAssociated = (selectedScene.associatedMapIds || (selectedScene.associatedMapId ? [selectedScene.associatedMapId] : [])).includes(map.id);
                            return (
                              <div
                                key={map.id}
                                onClick={() => handleToggleMapAssociation(map.id)}
                                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  isAssociated
                                    ? 'bg-[#1b2537] border-emerald-500/50 shadow-md shadow-emerald-950/20'
                                    : 'bg-[#0a0d14]/70 border-[#2a3449] hover:bg-[#121824]'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                    isAssociated ? 'bg-emerald-500 text-slate-950' : 'border border-[#2a3449]'
                                  }`}>
                                    {isAssociated && <span className="text-[10px] font-black">✓</span>}
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-bold text-slate-200">{map.title || 'Sem título'}</h5>
                                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {map.id.slice(0, 8)}...</p>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isAssociated ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/40 text-slate-400 border border-slate-700/30'
                                }`}>
                                  {isAssociated ? 'Associado' : 'Disponível'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Create Scene Modal */}
      <CreateSceneModal
        isOpen={showCreateSceneModal}
        onClose={() => setShowCreateSceneModal(false)}
      />
    </div>
  );
};
