'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Sparkles, 
  Swords, 
  MessageSquare, 
  Beer, 
  Compass, 
  Wand2, 
  BookOpen, 
  Image as ImageIcon, 
  Sliders, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  Globe, 
  Search, 
  Trash2, 
  Link as LinkIcon,
  Crown,
  Scroll,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Play,
  Pause,
  Copy,
  Radio,
  Music,
  Zap,
  Flame,
  Shield,
  Heart,
  Target,
  Sun,
  Moon,
  Sunset,
  CloudRain,
  CloudFog,
  Layers,
  Settings,
  Skull,
  User,
  Users
} from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';
import { useWorld } from '@/lib/hooks/useWorld';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { useAudio } from '@/context/AudioContext';
import { SceneType, Combatant, WorldEntity, SceneImage, CustomMonster, CampaignMember } from '@/lib/types';
import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { isSupabaseConfigured } from '@/lib/supabase';
import { storageService } from '@/lib/services/storageService';
import { SceneAiGeneratorModal } from '@/components/SceneAiGeneratorModal';
import { AudioMaestroModal } from '@/components/AudioMaestroModal';
import { BGM_TRACKS, SFX_BUTTONS, INITIAL_MONSTERS } from '@/lib/srd-data';
import { customMonsterService } from '@/lib/services/customMonsterService';
import { EncounterDifficultyMeter } from '@/components/live-cockpit/EncounterDifficultyMeter';
import { 
  crToXp, 
  previewEncounterWithNewMonster, 
  XP_THRESHOLDS_BY_LEVEL 
} from '@/lib/dnd5e-encounter-calculator';
import { toast } from 'sonner';

interface CreateSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'narrative' | 'slides' | 'atmosphere' | 'combat';

const ART_PRESETS = [
  { id: 'epic-fantasy', label: 'Alta Fantasia Épica', promptSuffix: 'epic high fantasy concept art, dramatic lighting, cinematic 16:9 scene illustration, masterwork painting' },
  { id: 'dark-fantasy', label: 'Dark Fantasy & Sombrio', promptSuffix: 'dark fantasy gothic atmosphere, moody shadows, ominous fog, cinematic oil painting, grimdark masterpiece' },
  { id: 'dungeon-interior', label: 'Interior de Masmorra', promptSuffix: 'dungeon interior environment art, torchlight glow, cobblestone, ancient stone architecture, atmospheric 16:9' },
  { id: 'tavern-warm', label: 'Taverna Acolhedora', promptSuffix: 'warm medieval fantasy tavern interior, hearth fire, cozy ambient lighting, patrons and wooden tables, concept art' },
  { id: 'wilderness-vista', label: 'Paisagem Natural', promptSuffix: 'expansive fantasy wilderness vista, dramatic skies, untouched nature, adventure concept art' },
];

const translateCategory = (cat: string): string => {
  const map: Record<string, string> = {
    npc: 'NPC',
    location: 'Local',
    faction: 'Facção',
    item: 'Item',
    beast: 'Monstro',
  };
  return map[cat] || cat;
};

const getCategoryColor = (cat: string): string => {
  switch (cat) {
    case 'npc': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'location': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'faction': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'item': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'beast': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    default: return 'text-slate-300 bg-slate-800 border-slate-700';
  }
};

export const CreateSceneModal: React.FC<CreateSceneModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeSession, createScene, scenes, campaignMaps } = useSession();
  const { worldEntities, activeWorld } = useWorld();
  const { activeCampaign, campaignMembers } = useCampaign();
  const { settings } = useUserSettings();
  const { playBgm, pauseBgm, activeBgm, isPlayingBgm, playSfx } = useAudio();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('narrative');

  // Narrative Form State
  const [sceneType, setSceneType] = useState<SceneType>('social');
  const [title, setTitle] = useState('');
  const [npcName, setNpcName] = useState('');
  const [sensoryText, setSensoryText] = useState('');
  const [secretNotes, setSecretNotes] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<WorldEntity[]>([]);
  const [entitySearch, setEntitySearch] = useState('');
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);

  // Multi-Slide State
  const [slides, setSlides] = useState<SceneImage[]>([
    { id: `slide-init-1`, imageUrl: '', overlayText: '', secretNotes: '' }
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slidePrompt, setSlidePrompt] = useState('');
  const [selectedArtPreset, setSelectedArtPreset] = useState(ART_PRESETS[0].id);
  const [isGeneratingSlide, setIsGeneratingSlide] = useState(false);

  // Atmosphere & Audio Maestro State
  const [bgmCategory, setBgmCategory] = useState<'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao'>('taverna');
  const [selectedBgmTrackIds, setSelectedBgmTrackIds] = useState<string[]>(['bgm-taverna']);
  const [selectedSfxShortcuts, setSelectedSfxShortcuts] = useState<string[]>(['sfx-sword-slash', 'sfx-fireball', 'sfx-cure-wounds']);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night' | 'fog' | 'storm'>('day');
  const [hasFog, setHasFog] = useState(false);
  const [hasRain, setHasRain] = useState(false);
  const [associatedMapId, setAssociatedMapId] = useState('');
  const [isAudioMaestroModalOpen, setIsAudioMaestroModalOpen] = useState(false);

  // Combat Setup State
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [battleSetupMode, setBattleSetupMode] = useState<'normal' | 'player_ambush' | 'player_surprised'>('normal');
  const [combatAddTab, setCombatAddTab] = useState<'srd' | 'world' | 'npcs' | 'players'>('srd');
  const [combatSearchQuery, setCombatSearchQuery] = useState('');
  const [monsterQty, setMonsterQty] = useState(1);
  const [showCombatDropdown, setShowCombatDropdown] = useState(false);
  const [customMonsters, setCustomMonsters] = useState<CustomMonster[]>([]);

  // AI Modal & Loading States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load custom monsters on mount
  useEffect(() => {
    if (isOpen) {
      setActiveTab('narrative');
      setErrorMsg(null);
      customMonsterService.fetchCustomMonsters(activeCampaign?.id).then((data) => {
        setCustomMonsters(data || []);
      });
    }
  }, [isOpen, activeCampaign]);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  const availableEntities = worldEntities.filter(
    (ent) => !selectedEntities.some((sel) => sel.id === ent.id)
  );

  const filteredEntities = availableEntities.filter((ent) => {
    const q = entitySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      ent.name.toLowerCase().includes(q) ||
      (ent.subType || '').toLowerCase().includes(q) ||
      translateCategory(ent.category).toLowerCase().includes(q)
    );
  });

  const handleSelectEntity = (ent: WorldEntity) => {
    setSelectedEntities((prev) => [...prev, ent]);
    if (ent.category === 'npc' && !npcName) {
      setNpcName(ent.name);
    }
    // If beast, add to combatants automatically
    if (ent.category === 'beast' || ent.statSheet) {
      const newCombatant: Combatant = {
        id: `comb-${Date.now()}-${ent.id}`,
        name: ent.name,
        type: 'monster',
        hp: ent.statSheet?.hp || 18,
        maxHp: ent.statSheet?.maxHp || 18,
        ac: ent.statSheet?.ac || 13,
        initiative: 12,
        conditions: [],
        cr: ent.statSheet?.cr || '1',
      };
      setCombatants((prev) => [...prev, newCombatant]);
    }
    setEntitySearch('');
    setIsEntityDropdownOpen(false);
  };

  const handleRemoveEntity = (id: string) => {
    setSelectedEntities((prev) => prev.filter((ent) => ent.id !== id));
  };

  // Helper para resolver nível do personagem
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

  // Party computada para o medidor de dificuldade D&D 5e
  const encounterPartyList = useMemo(() => {
    const playerCombatants = (combatants || []).filter((c) => c.type === 'player');
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
  }, [combatants, campaignMembers]);

  // Monstros na cena para a calculadora de XP
  const encounterMonstersList = useMemo(() => {
    return (combatants || [])
      .filter((c) => c.type === 'monster' || c.type === 'npc')
      .map((c, idx) => ({
        id: c.id || `mon-${idx}`,
        cr: c.cr,
        name: c.name,
        xp: crToXp(c.cr),
      }));
  }, [combatants]);

  // Filtro de monstros do SRD
  const filteredMonsters = useMemo(() => {
    const q = combatSearchQuery.toLowerCase().trim();
    if (!q) return INITIAL_MONSTERS.slice(0, 30);
    return INITIAL_MONSTERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.type && m.type.toLowerCase().includes(q)) ||
        (m.cr && String(m.cr).toLowerCase().includes(q))
    ).slice(0, 30);
  }, [combatSearchQuery]);

  // Filtro de monstros customizados do mundo
  const filteredCustomMonsters = useMemo(() => {
    const q = combatSearchQuery.toLowerCase().trim();
    if (!q) return customMonsters.slice(0, 30);
    return customMonsters.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.type && m.type.toLowerCase().includes(q)) ||
        (m.cr && String(m.cr).toLowerCase().includes(q))
    ).slice(0, 30);
  }, [customMonsters, combatSearchQuery]);

  // Filtro de NPCs do mundo
  const filteredNpcs = useMemo(() => {
    const npcs = worldEntities.filter((e) => e.category === 'npc');
    const q = combatSearchQuery.toLowerCase().trim();
    if (!q) return npcs.slice(0, 30);
    return npcs.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (n.subType && n.subType.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [worldEntities, combatSearchQuery]);

  // Auto-gerador de encontros balanceados por dificuldade D&D 5e
  const handleAutoGenerateEncounter = (targetDiff: 'easy' | 'medium' | 'hard' | 'deadly') => {
    const pList = encounterPartyList.length > 0 ? encounterPartyList : [{ level: 1 }, { level: 1 }, { level: 1 }, { level: 1 }];
    const targetXpBudget = pList.reduce((acc, p) => {
      const lvl = Math.max(1, Math.min(20, p.level || 1));
      const thresholds = XP_THRESHOLDS_BY_LEVEL[lvl] || XP_THRESHOLDS_BY_LEVEL[1];
      return acc + thresholds[targetDiff];
    }, 0);

    const avgPartyLevel = Math.round(pList.reduce((acc, p) => acc + (p.level || 1), 0) / pList.length);

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

    const isGroup = Math.random() > 0.4;
    const chosenCombatants: Combatant[] = [];

    if (!isGroup) {
      const sorted = [...available].sort((a, b) => 
        Math.abs(a.xpValue - targetXpBudget) - Math.abs(b.xpValue - targetXpBudget)
      );
      const boss = sorted[0];
      chosenCombatants.push({
        id: `comb-${Date.now()}-boss`,
        name: boss.name,
        type: 'monster',
        hp: boss.hp || 30,
        maxHp: boss.hp || 30,
        ac: boss.ac || 14,
        initiative: 10,
        conditions: [],
        cr: boss.cr || '1',
      });
    } else {
      const minions = available.filter((m) => m.xpValue <= targetXpBudget / 2);
      if (minions.length > 0) {
        const selectedMinion = minions[Math.floor(Math.random() * minions.length)];
        const qty = Math.max(2, Math.min(6, Math.floor(targetXpBudget / (selectedMinion.xpValue * 1.5))));
        for (let i = 0; i < qty; i++) {
          chosenCombatants.push({
            id: `comb-${Date.now()}-${i}`,
            name: `${selectedMinion.name} ${i + 1}`,
            type: 'monster',
            hp: selectedMinion.hp || 15,
            maxHp: selectedMinion.hp || 15,
            ac: selectedMinion.ac || 12,
            initiative: 10,
            conditions: [],
            cr: selectedMinion.cr || '1/4',
          });
        }
      }
    }

    // Preserve player combatants if any
    const playersInScene = combatants.filter((c) => c.type === 'player');
    setCombatants([...playersInScene, ...chosenCombatants]);
    toast.success(`Encontro "${targetDiff.toUpperCase()}" gerado automaticamente!`);
  };

  // Add Monster from SRD
  const handleAddMonsterToScene = (monster: typeof INITIAL_MONSTERS[0], qty: number = 1) => {
    const newItems: Combatant[] = [];
    for (let i = 0; i < qty; i++) {
      newItems.push({
        id: `m-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        name: qty > 1 ? `${monster.name} ${combatants.filter((c) => c.name.startsWith(monster.name)).length + i + 1}` : monster.name,
        type: 'monster',
        hp: monster.hp || 15,
        maxHp: monster.hp || 15,
        ac: monster.ac || 12,
        initiative: 10,
        conditions: [],
        cr: monster.cr || '1/4',
      });
    }
    setCombatants((prev) => [...prev, ...newItems]);
    toast.success(`${qty}x ${monster.name} adicionado(s) à cena!`);
  };

  // Add Custom Monster from World
  const handleAddCustomMonsterToScene = (monster: CustomMonster, qty: number = 1) => {
    const newItems: Combatant[] = [];
    for (let i = 0; i < qty; i++) {
      newItems.push({
        id: `cm-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        name: qty > 1 ? `${monster.name} ${combatants.filter((c) => c.name.startsWith(monster.name)).length + i + 1}` : monster.name,
        type: 'monster',
        hp: monster.hp || 20,
        maxHp: monster.hp || 20,
        ac: monster.ac || 13,
        initiative: 10,
        conditions: [],
        cr: monster.cr || '1',
      });
    }
    setCombatants((prev) => [...prev, ...newItems]);
    toast.success(`${qty}x ${monster.name} adicionado(s) à cena!`);
  };

  // Add NPC to Scene
  const handleAddNpcToScene = (npc: WorldEntity) => {
    const npcCombatant: Combatant = {
      id: `npc-${Date.now()}-${npc.id}`,
      name: npc.name,
      type: 'npc',
      hp: npc.statSheet?.hp || 25,
      maxHp: npc.statSheet?.maxHp || 25,
      ac: npc.statSheet?.ac || 12,
      initiative: 10,
      conditions: [],
      cr: npc.statSheet?.cr || '1/2',
    };
    setCombatants((prev) => [...prev, npcCombatant]);
    toast.success(`NPC ${npc.name} adicionado ao encontro!`);
  };

  // Add Player to Scene
  const handleAddPlayerToScene = (mem: CampaignMember) => {
    const pName = mem.characterName || mem.displayName || 'Jogador';
    if (combatants.some((c) => c.name === pName)) {
      toast.info(`${pName} já está presente na cena.`);
      return;
    }
    const playerCombatant: Combatant = {
      id: `pl-${Date.now()}-${mem.id}`,
      name: pName,
      type: 'player',
      hp: 20,
      maxHp: 20,
      ac: 14,
      initiative: 10,
      conditions: [],
    };
    setCombatants((prev) => [...prev, playerCombatant]);
    toast.success(`${pName} adicionado à cena!`);
  };

  // Import All Campaign Players
  const handleAddAllPlayersToScene = () => {
    const nonDm = (campaignMembers || []).filter((m) => m.role !== 'dm');
    if (nonDm.length === 0) {
      toast.info('Nenhum jogador cadastrado na campanha.');
      return;
    }
    const newPlayers: Combatant[] = [];
    nonDm.forEach((mem) => {
      const pName = mem.characterName || mem.displayName || 'Jogador';
      if (!combatants.some((c) => c.name === pName)) {
        newPlayers.push({
          id: `pl-${Date.now()}-${mem.id}`,
          name: pName,
          type: 'player',
          hp: 20,
          maxHp: 20,
          ac: 14,
          initiative: 10,
          conditions: [],
        });
      }
    });
    setCombatants((prev) => [...prev, ...newPlayers]);
    toast.success(`${newPlayers.length} jogador(es) importado(s) para o combate!`);
  };

  const toggleBgmTrack = (trackId: string, trackCategory: string) => {
    setSelectedBgmTrackIds((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId);
      } else {
        setBgmCategory(trackCategory as any);
        return [...prev, trackId];
      }
    });
  };

  // AI Narrative Generator Callback
  const handleApplyAiScene = (data: {
    title: string;
    sensoryText: string;
    secretNotes: string;
    suggestedBgm?: 'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao';
    timeOfDay?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
    hasFog?: boolean;
    hasRain?: boolean;
    slideCoverPrompt?: string;
    selectedEntities: WorldEntity[];
  }) => {
    if (data.title) setTitle(data.title);
    if (data.sensoryText) setSensoryText(data.sensoryText);
    if (data.secretNotes) setSecretNotes(data.secretNotes);
    if (data.suggestedBgm) {
      setBgmCategory(data.suggestedBgm);
      const matchingTracks = BGM_TRACKS.filter((t) => t.category === data.suggestedBgm);
      if (matchingTracks.length > 0) {
        setSelectedBgmTrackIds(matchingTracks.map((t) => t.id));
      }
    }
    if (data.timeOfDay) setTimeOfDay(data.timeOfDay);
    if (typeof data.hasFog === 'boolean') setHasFog(data.hasFog);
    if (typeof data.hasRain === 'boolean') setHasRain(data.hasRain);
    if (data.slideCoverPrompt) setSlidePrompt(data.slideCoverPrompt);
    if (data.selectedEntities && data.selectedEntities.length > 0) {
      setSelectedEntities(data.selectedEntities);
      const npc = data.selectedEntities.find((e) => e.category === 'npc');
      if (npc) setNpcName(npc.name);
    }
    toast.success('Roteiro da cena e entidades integrados com sucesso!');
  };

  // Slide Management
  const handleAddSlide = () => {
    const newSlide: SceneImage = {
      id: `slide-${Date.now()}`,
      imageUrl: '',
      overlayText: `Slide ${slides.length + 1}`,
      secretNotes: '',
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleRemoveSlide = (index: number) => {
    if (slides.length <= 1) {
      setSlides([{ id: `slide-1`, imageUrl: '', overlayText: '', secretNotes: '' }]);
      setActiveSlideIndex(0);
      return;
    }
    const newSlides = slides.filter((_, idx) => idx !== index);
    setSlides(newSlides);
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const updateCurrentSlide = (updates: Partial<SceneImage>) => {
    setSlides((prev) => {
      const next = [...prev];
      if (next[activeSlideIndex]) {
        next[activeSlideIndex] = { ...next[activeSlideIndex], ...updates };
      }
      return next;
    });
  };

  // Generate 16:9 Slide Image with AI
  const handleGenerateSlideAi = async () => {
    setIsGeneratingSlide(true);
    setErrorMsg(null);
    try {
      const preset = ART_PRESETS.find((p) => p.id === selectedArtPreset) || ART_PRESETS[0];
      const basePrompt = slidePrompt.trim()
        ? slidePrompt.trim()
        : `Atmospheric ${sceneType} scene in a fantasy realm for "${title || 'RPG Scene'}" (Slide ${activeSlideIndex + 1}), depicting ${selectedEntities.map((e) => e.name).join(', ') || 'adventurers'}.`;

      const fullPrompt = `${basePrompt}, ${preset.promptSuffix}`;

      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          aspectRatio: '16:9',
          userSettings: settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar imagem do slide.');

      let finalUrl = `data:image/jpeg;base64,${data.base64}`;

      if (isSupabaseConfigured()) {
        try {
          const imgRes = await fetch(finalUrl);
          const blob = await imgRes.blob();
          const file = new File([blob], `scene-slide-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const publicUrl = await storageService.uploadAsset(file, 'scenes');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Falha no upload para o storage, usando formato base64.', uploadErr);
        }
      }

      updateCurrentSlide({
        imageUrl: finalUrl,
        overlayText: currentSlide.overlayText || title || `Slide ${activeSlideIndex + 1}`,
      });

      toast.success(`Slide ${activeSlideIndex + 1} forjado em 16:9 com sucesso!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao gerar imagem de slide.');
      toast.error(err.message || 'Erro ao gerar imagem.');
    } finally {
      setIsGeneratingSlide(false);
    }
  };

  // SFX Toggle
  const toggleSfxShortcut = (sfxId: string) => {
    setSelectedSfxShortcuts((prev) =>
      prev.includes(sfxId) ? prev.filter((id) => id !== sfxId) : [...prev, sfxId]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setActiveTab('narrative');
      toast.error('Informe o título da cena.');
      return;
    }

    if (!activeSession) {
      toast.error('Nenhuma sessão ativa encontrada para criar a cena.');
      return;
    }

    setIsSubmitting(true);
    try {
      const validSlides = slides.filter((s) => s.imageUrl && s.imageUrl.trim() !== '');
      const primaryImageUrl = validSlides[0]?.imageUrl || slides[0]?.imageUrl || undefined;

      await createScene({
        sessionId: activeSession.id,
        orderIndex: scenes.length + 1,
        title: `${getTypeEmoji(sceneType)} ${title.trim().replace(/^(⚔️|🗣️|🍺|🗺️)\s*/, '')}`,
        sceneType,
        npcName: npcName || undefined,
        sensoryText: sensoryText || undefined,
        secretNotes: secretNotes || undefined,
        bgmCategory,
        bgmTracks: selectedBgmTrackIds.length > 0 ? selectedBgmTrackIds : [`bgm-${bgmCategory}`],
        sfxShortcuts: selectedSfxShortcuts,
        imageUrl: primaryImageUrl,
        sceneImages: validSlides.length > 0 ? validSlides : undefined,
        combatants: sceneType === 'combat' ? combatants : [],
        battleSetupMode: sceneType === 'combat' ? battleSetupMode : undefined,
        associatedMapId: associatedMapId || undefined,
        associatedMapIds: associatedMapId ? [associatedMapId] : [],
        timeOfDay,
        hasFog,
        hasRain,
      });

      toast.success('Cena forjada e adicionada à sessão com sucesso!');
      handleResetAndClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao criar cena.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setNpcName('');
    setSensoryText('');
    setSecretNotes('');
    setSlides([{ id: `slide-1`, imageUrl: '', overlayText: '', secretNotes: '' }]);
    setActiveSlideIndex(0);
    setSlidePrompt('');
    setSelectedEntities([]);
    setAssociatedMapId('');
    setSelectedBgmTrackIds(['bgm-taverna']);
    setCombatants([]);
    setActiveTab('narrative');
    onClose();
  };

  const getTypeEmoji = (type: SceneType) => {
    switch (type) {
      case 'combat': return '⚔️';
      case 'dialogue': return '🗣️';
      case 'social': return '🍺';
      case 'exploration': return '🗺️';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-[#111622] border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252f44] px-6 py-4 bg-[#161d2d]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Forjar Nova Cena para a Sessão
              </h3>
              <p className="text-xs text-slate-400">
                Sessão: <span className="text-amber-300 font-semibold">{activeSession?.title || 'Sessão'}</span> • {activeWorld?.title || 'Worldbuilding'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose} 
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#252f44] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (4 Tabs) */}
        <div className="flex items-center border-b border-[#252f44] bg-[#0c1019] px-6 gap-2 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('narrative')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'narrative'
                ? 'text-amber-400 border-amber-500 bg-[#161d2d]'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#131826]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Narrativa & Entidades IA</span>
            {selectedEntities.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/30 text-[10px] text-amber-300 rounded-full font-mono">
                {selectedEntities.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 relative whitespace-nowrap ${
              activeTab === 'slides'
                ? 'text-amber-400 border-amber-500 bg-[#161d2d]'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#131826]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Slides 16:9 ({slides.length})</span>
            {slides.some((s) => s.imageUrl) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5 shadow-sm"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('atmosphere')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'atmosphere'
                ? 'text-amber-400 border-amber-500 bg-[#161d2d]'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#131826]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>3. Áudio Maestro & Clima</span>
          </button>

          {sceneType === 'combat' && (
            <button
              type="button"
              onClick={() => setActiveTab('combat')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'combat'
                  ? 'text-rose-400 border-rose-500 bg-[#161d2d]'
                  : 'text-rose-400/70 border-transparent hover:text-rose-300 hover:bg-[#131826]'
              }`}
            >
              <Swords className="w-4 h-4 text-rose-400" />
              <span>4. Batalha & Inimigos ({combatants.length})</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0f1420]/60">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: NARRATIVA & ENTIDADES */}
          {activeTab === 'narrative' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Scene Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Cena Narrativa:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'social', label: 'Social / Taverna', icon: Beer, bgm: 'taverna', color: 'text-amber-400' },
                    { id: 'dialogue', label: 'Diálogo NPC', icon: MessageSquare, bgm: 'tensao', color: 'text-cyan-400' },
                    { id: 'combat', label: 'Combate Épico', icon: Swords, bgm: 'combate', color: 'text-rose-400' },
                    { id: 'exploration', label: 'Exploração', icon: Compass, bgm: 'masmorra', color: 'text-emerald-400' },
                  ].map((st) => {
                    const Icon = st.icon;
                    const isSelected = sceneType === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSceneType(st.id as SceneType);
                          setBgmCategory(st.bgm as any);
                          const matching = BGM_TRACKS.find((t) => t.category === st.bgm);
                          if (matching) setSelectedBgmTrackIds([matching.id]);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow'
                            : 'bg-[#0a0e17] border-[#252f44] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${st.color}`} />
                        <span className="text-[11px]">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & AI Helper Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Título da Cena: <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg transition-all shadow-sm group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                    <span>Forjar Roteiro & Textos com IA</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: A Emboscada na Taverna do Javali, O Confronto com o Feiticeiro..."
                  className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold tracking-wide"
                />
              </div>

              {/* World Entities Correlation Section */}
              <div className="bg-[#141a27] border border-[#252f44] p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    Personagens & Entidades Envolvidas nesta Cena ({worldEntities.length} no Mundo):
                  </label>
                  {selectedEntities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedEntities([])}
                      className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Selected Entities Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-[#0a0e17] border border-[#252f44] rounded-lg">
                  {selectedEntities.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic py-0.5">
                      Nenhuma entidade selecionada. Pesquise abaixo para vincular quem está presente nesta cena.
                    </span>
                  ) : (
                    selectedEntities.map((ent) => (
                      <span
                        key={ent.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${getCategoryColor(ent.category)}`}
                      >
                        <span>{ent.name}</span>
                        <span className="text-[9px] opacity-75">({translateCategory(ent.category)})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEntity(ent.id)}
                          className="hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Entity Search Dropdown */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={entitySearch}
                      onChange={(e) => {
                        setEntitySearch(e.target.value);
                        setIsEntityDropdownOpen(true);
                      }}
                      onFocus={() => setIsEntityDropdownOpen(true)}
                      placeholder="Pesquisar NPC, Vilão, Monstro ou Local para vincular..."
                      className="w-full bg-[#0a0e17] border border-[#252f44] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>

                  {isEntityDropdownOpen && filteredEntities.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#161c28] border border-[#2a3449] rounded-xl shadow-2xl z-20 max-h-40 overflow-y-auto divide-y divide-[#252f44]">
                      {filteredEntities.map((ent) => (
                        <button
                          key={ent.id}
                          type="button"
                          onClick={() => handleSelectEntity(ent)}
                          className="w-full text-left px-3.5 py-2 hover:bg-[#1f2738] flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-200">{ent.name}</span>
                            {ent.subType && (
                              <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                                — {ent.subType}
                              </span>
                            )}
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{ent.shortDesc}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ml-2 ${getCategoryColor(ent.category)}`}>
                            {translateCategory(ent.category)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sensory Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scroll className="w-3.5 h-3.5 text-amber-400" />
                    Texto Sensorial para Leitura em Voz Alta (Read Aloud):
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">Digite @ para mencionar entidades</span>
                </label>
                <MentionTextarea
                  rows={3}
                  value={sensoryText}
                  worldEntities={worldEntities}
                  onChangeValue={(val) => setSensoryText(val)}
                  placeholder="Descreva a atmosfera, iluminação, sons e o primeiro impacto que os heróis sentem..."
                  className="font-serif leading-relaxed"
                />
              </div>

              {/* Secret Master Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400/80" />
                  Notas Secretas do Mestre (Pistas, Armadilhas & Motivações Ocultas):
                </label>
                <textarea
                  rows={2}
                  value={secretNotes}
                  onChange={(e) => setSecretNotes(e.target.value)}
                  placeholder="Informações confidenciais apenas para os olhos do Mestre..."
                  className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none font-sans"
                ></textarea>
              </div>

            </div>
          )}

          {/* TAB 2: MULTI-SLIDES & IMAGENS (16:9) */}
          {activeTab === 'slides' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Slide Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-[#252f44] pb-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        activeSlideIndex === idx
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-[#141a27] text-slate-400 hover:text-slate-200 border border-[#252f44]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{s.overlayText ? s.overlayText.slice(0, 15) : `Slide ${idx + 1}`}</span>
                      {s.imageUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Novo Slide 16:9</span>
                  </button>
                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlide(activeSlideIndex)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 rounded-lg text-xs transition-colors"
                      title="Excluir este slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 16:9 Slide Preview Box */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-amber-500/30 bg-[#080b12] shadow-xl flex items-center justify-center group">
                {currentSlide.imageUrl ? (
                  <>
                    <img 
                      src={currentSlide.imageUrl} 
                      alt="Slide da Cena" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <span className="px-2 py-0.5 bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold rounded uppercase tracking-wider backdrop-blur-sm">
                          Slide {activeSlideIndex + 1} de {slides.length}
                        </span>
                        <h4 className="text-base font-extrabold text-white mt-1 drop-shadow-md font-serif">
                          {currentSlide.overlayText || title || `Slide ${activeSlideIndex + 1}`}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCurrentSlide({ imageUrl: '' })}
                        className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 backdrop-blur-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Arte</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">Slide {activeSlideIndex + 1}: Nenhuma Imagem 16:9 Gerada</p>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Gere uma arte panorâmica 16:9 para este slide com a IA ou informe uma URL direta abaixo.
                    </p>
                  </div>
                )}
              </div>

              {/* AI Slide Generator Panel */}
              <div className="bg-[#141a27] border border-[#252f44] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    Forjar Imagem para o Slide {activeSlideIndex + 1} com IA (16:9)
                  </span>
                  <span className="text-[10px] text-slate-500">Imagen 3 / Gemini Nano Banana</span>
                </div>

                {/* Art Style Presets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Estilo Artístico:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ART_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedArtPreset(preset.id)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
                          selectedArtPreset === preset.id
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'bg-[#0c1019] text-slate-400 border border-[#252f44] hover:text-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Prompt Específico do Slide {activeSlideIndex + 1} (Opcional):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slidePrompt}
                      onChange={(e) => setSlidePrompt(e.target.value)}
                      placeholder="Ex: Close no rosto do taverneiro elfo com uma cicatriz no olho, iluminação de velas..."
                      className="flex-1 bg-[#0a0e17] border border-[#252f44] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSlideAi}
                      disabled={isGeneratingSlide}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isGeneratingSlide ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Forjando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gerar Slide {activeSlideIndex + 1}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Direct Image URL & Overlay Text */}
                <div className="pt-2 border-t border-[#252f44]/80 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Legenda / Texto Overlay do Slide:</label>
                    <input
                      type="text"
                      value={currentSlide.overlayText || ''}
                      onChange={(e) => updateCurrentSlide({ overlayText: e.target.value })}
                      placeholder="Texto que surge sobre o slide para os jogadores..."
                      className="w-full bg-[#0a0e17] border border-[#252f44] rounded-lg px-3 py-1 text-xs text-slate-200 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ou URL Direta da Imagem:</label>
                    <input
                      type="text"
                      value={currentSlide.imageUrl || ''}
                      onChange={(e) => updateCurrentSlide({ imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-[#0a0e17] border border-[#252f44] rounded-lg px-3 py-1 text-xs text-slate-200 focus:border-amber-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATMOSFERA, ÁUDIO MAESTRO & MAPA */}
          {activeTab === 'atmosphere' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Audio Maestro Section */}
              <div className="bg-[#141a27] border border-[#252f44] p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#252f44] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Biblioteca de Músicas do Audio Maestro
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAudioMaestroModalOpen(true)}
                    className="px-3 py-1 bg-[#1a2233] hover:bg-[#252f44] border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span>Abrir Audio Maestro Studio</span>
                  </button>
                </div>

                {/* Track Selector Grid with Previews */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">
                      Trilhas Sonoras BGM (Playlist da Cena):
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-400 font-bold">
                        {selectedBgmTrackIds.length} faixa(s) selecionada(s)
                      </span>
                      {selectedBgmTrackIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBgmTrackIds([])}
                          className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {BGM_TRACKS.map((track) => {
                      const isSelected = selectedBgmTrackIds.includes(track.id);
                      const isPlayingThis = isPlayingBgm && activeBgm?.id === track.id;

                      return (
                        <div
                          key={track.id}
                          onClick={() => toggleBgmTrack(track.id, track.category)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50'
                              : 'bg-[#0a0d14] border-[#252f44] text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isPlayingThis) {
                                  pauseBgm();
                                } else {
                                  playBgm(track);
                                }
                              }}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isPlayingThis
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-[#161c28] text-amber-400 hover:bg-[#1f2738]'
                              }`}
                              title={isPlayingThis ? 'Pausar Prévia' : 'Ouvir Prévia'}
                            >
                              {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                            <div className="truncate">
                              <div className="text-xs font-bold truncate">{track.name}</div>
                              <div className="text-[10px] text-slate-500 uppercase">{track.category}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SFX Shortcuts Selection */}
                <div className="pt-3 border-t border-[#252f44] space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>Efeitos Sonoros Rápidos (SFX Shortcuts para o Mestre):</span>
                    <span className="text-[10px] text-amber-400 font-normal">{selectedSfxShortcuts.length} selecionados</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#0a0d14] border border-[#252f44] rounded-xl">
                    {SFX_BUTTONS.map((sfx) => {
                      const isChecked = selectedSfxShortcuts.includes(sfx.id);
                      return (
                        <div
                          key={sfx.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleSfxShortcut(sfx.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              toggleSfxShortcut(sfx.id);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-[#141a27] border-[#252f44] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{sfx.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSfx(sfx.url);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#252f44] transition-colors"
                            title="Testar Som"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Weather & Time of Day */}
              <div className="bg-[#141a27] border border-[#252f44] p-4 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-200">
                  Clima & Iluminação da Cena:
                </label>

                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'day', label: 'Dia', icon: Sun, color: 'text-amber-400' },
                    { id: 'sunset', label: 'Pôr do Sol', icon: Sunset, color: 'text-orange-400' },
                    { id: 'night', label: 'Noite', icon: Moon, color: 'text-blue-400' },
                    { id: 'storm', label: 'Tempestade', icon: CloudRain, color: 'text-cyan-400' },
                    { id: 'fog', label: 'Neblina', icon: CloudFog, color: 'text-slate-300' },
                  ].map((tod) => {
                    const Icon = tod.icon;
                    const isSelected = timeOfDay === tod.id;
                    return (
                      <button
                        key={tod.id}
                        type="button"
                        onClick={() => setTimeOfDay(tod.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-[#0a0d14] border-[#252f44] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${tod.color}`} />
                        <span className="text-[11px]">{tod.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-[#252f44]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasRain}
                      onChange={(e) => setHasRain(e.target.checked)}
                      className="rounded border-[#2a3449] bg-[#0a0d14] text-amber-500 focus:ring-0"
                    />
                    <span>Efeito de Chuva / Tempestade</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasFog}
                      onChange={(e) => setHasFog(e.target.checked)}
                      className="rounded border-[#2a3449] bg-[#0a0d14] text-amber-500 focus:ring-0"
                    />
                    <span>Neblina Densa / Atmosfera Sombria</span>
                  </label>
                </div>
              </div>

              {/* Map Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  Vincular Dungeon Map / Mapa de Batalha:
                </label>
                <select
                  value={associatedMapId}
                  onChange={(e) => setAssociatedMapId(e.target.value)}
                  className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Nenhum mapa vinculado...</option>
                  {campaignMaps.map((map) => (
                    <option key={map.id} value={map.id}>
                      {map.title}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          )}

          {/* TAB 4: ENCOUNTER BUILDER & COMBAT (Complete D&D 5e Encounter Studio) */}
          {activeTab === 'combat' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Medidor de Dificuldade de Encontro (D&D 5e) */}
              <EncounterDifficultyMeter
                party={encounterPartyList}
                monsters={encounterMonstersList}
                onRemoveMonster={(id) => setCombatants((prev) => prev.filter((c) => c.id !== id))}
              />

              {/* Gerador Rápido de Encontros por Dificuldade */}
              <div className="p-3 bg-[#141a27] border border-amber-500/30 rounded-xl space-y-2">
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
                  >
                    <Shield className="w-3 h-3" /> Fácil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoGenerateEncounter('medium')}
                    className="px-2 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 text-amber-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Swords className="w-3 h-3" /> Médio
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoGenerateEncounter('hard')}
                    className="px-2 py-1.5 bg-orange-950/60 hover:bg-orange-900/80 border border-orange-700/60 text-orange-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Flame className="w-3 h-3" /> Difícil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoGenerateEncounter('deadly')}
                    className="px-2 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Skull className="w-3 h-3" /> Mortal
                  </button>
                </div>
              </div>

              {/* Widget Unificado de Adição de Combatentes (SRD, Mundo, NPCs e Jogadores) */}
              <div className="p-3.5 bg-[#141a27] border border-[#252f44] hover:border-amber-500/30 rounded-xl space-y-2.5 relative transition-all">
                {/* Segmented Control Bar */}
                <div className="flex items-center justify-between border-b border-[#252f44] pb-2 gap-1 overflow-x-auto">
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setCombatAddTab('srd');
                        setCombatSearchQuery('');
                        setShowCombatDropdown(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
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
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
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
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
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
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
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
                      className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Adicionar todos os jogadores ao combate com 1 clique"
                    >
                      <Users className="w-3 h-3" /> Importar Grupo
                    </button>
                  )}
                </div>

                {/* Tab: Jogadores */}
                {combatAddTab === 'players' ? (
                  <div className="space-y-2">
                    {campaignMembers.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-xs">
                        Nenhum jogador conectado na campanha
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-0.5">
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
                  /* Tab: SRD, Mundo e NPCs (Campo de busca + Qtd + Dropdown) */
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
                          className="w-full bg-[#0a0d14] border border-[#252f44] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/40 font-sans"
                        />
                        {combatSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setCombatSearchQuery('');
                              setShowCombatDropdown(false);
                            }}
                            className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {combatAddTab !== 'npcs' && (
                        <div className="flex items-center gap-1 shrink-0 bg-[#0a0d14] border border-[#252f44] rounded-xl px-2 py-1 select-none">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={monsterQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setMonsterQty(isNaN(val) ? 1 : Math.max(1, Math.min(99, val)));
                            }}
                            className="w-8 bg-transparent text-xs text-slate-200 text-center font-bold focus:outline-none font-mono"
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
                      <div className="absolute left-0 right-0 mt-1.5 bg-[#121824] border border-[#2a3449] rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-800/60">
                        {combatAddTab === 'srd' && (
                          filteredMonsters.length === 0 ? (
                            <div className="p-3 text-center text-slate-500 text-xs">
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
                                  className="w-full px-3 py-2 text-left hover:bg-[#1c2436] flex items-center justify-between text-xs transition-colors group cursor-pointer gap-2"
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
                            <div className="p-3 text-center text-slate-500 text-xs">
                              Nenhum monstro/besta cadastrado no mundo
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
                                  className="w-full px-3 py-2 text-left hover:bg-[#1c2436] flex items-center justify-between text-xs transition-colors group cursor-pointer gap-2"
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
                              const npcCr = (npc.statSheet?.cr || '1/2') as string;
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
                                    {npc.subType && (
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        — {npc.subType}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded font-mono shrink-0">
                                      CR {npcCr} • {npcXp.toLocaleString()} XP
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
                                  </div>
                                  <span className="text-[10px] text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    + Adicionar NPC
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

              {/* Combatants Roster List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span>Combatentes da Cena ({combatants.length}):</span>
                  </label>
                  {combatants.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCombatants([])}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
                    >
                      Limpar Todos
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                  {combatants.length === 0 ? (
                    <div className="p-4 bg-[#0a0d14] border border-[#252f44] rounded-xl text-center text-slate-500 text-xs italic">
                      Nenhum combatente adicionado ainda. Use o Gerador Rápido acima ou pesquise monstros no Compêndio SRD.
                    </div>
                  ) : (
                    combatants.map((comb) => {
                      const isPlayer = comb.type === 'player';
                      const isNpc = comb.type === 'npc';
                      const xpVal = crToXp(comb.cr);

                      return (
                        <div
                          key={comb.id}
                          className="p-2.5 bg-[#0a0d14] border border-[#252f44] hover:border-slate-600 rounded-xl flex items-center justify-between gap-3 shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isPlayer
                                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                                : isNpc
                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                            }`}>
                              {isPlayer ? '🛡️' : isNpc ? '👤' : '💀'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-100">{comb.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  HP: {comb.hp}/{comb.maxHp} | CA: {comb.ac}
                                </span>
                                {comb.cr && (
                                  <span className="text-[9px] text-slate-400 bg-slate-800 px-1 py-0.2 rounded font-mono">
                                    CR {comb.cr} • {xpVal.toLocaleString()} XP
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              isPlayer
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                                : isNpc
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            }`}>
                              {isPlayer ? 'Jogador' : isNpc ? 'NPC' : 'Monstro'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const copy: Combatant = {
                                  ...comb,
                                  id: `comb-copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                                  name: `${comb.name} (Cópia)`,
                                };
                                setCombatants((prev) => [...prev, copy]);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-[#161c28] transition-colors"
                              title="Duplicar"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCombatants((prev) => prev.filter((c) => c.id !== comb.id))}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#161c28] transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Condição de Abertura do Combate */}
              <div className="bg-[#141a27] border border-[#252f44] p-3.5 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  Condição de Abertura do Combate:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: 'Iniciativa Padrão', desc: 'Ambos os lados cientes' },
                    { id: 'player_ambush', label: 'Emboscada dos Jogadores', desc: 'Inimigos Surpreendidos' },
                    { id: 'player_surprised', label: 'Emboscada Inimiga', desc: 'Heróis Surpreendidos' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setBattleSetupMode(mode.id as any)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        battleSetupMode === mode.id
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow'
                          : 'bg-[#0a0d14] border-[#252f44] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{mode.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#252f44] px-6 py-4 bg-[#161d2d]/90">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 bg-[#0c1019] hover:bg-[#1f2738] text-slate-300 text-xs font-medium rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {activeTab !== 'narrative' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'combat') setActiveTab('atmosphere');
                  else if (activeTab === 'atmosphere') setActiveTab('slides');
                  else if (activeTab === 'slides') setActiveTab('narrative');
                }}
                className="px-3 py-2 bg-[#1b2336] hover:bg-[#252f44] text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}

            {activeTab !== (sceneType === 'combat' ? 'combat' : 'atmosphere') ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'narrative') setActiveTab('slides');
                  else if (activeTab === 'slides') setActiveTab('atmosphere');
                  else if (activeTab === 'atmosphere' && sceneType === 'combat') setActiveTab('combat');
                }}
                className="px-4 py-2 bg-[#252f44] hover:bg-[#2f3b55] text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Forjando Cena...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Adicionar Cena à Sessão</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* AI Scene Generator Modal */}
      <SceneAiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApply={handleApplyAiScene}
        sessionTitle={activeSession?.title || 'Sessão Sem Título'}
        selectedWorld={activeWorld || null}
        worldEntities={worldEntities}
        currentSceneType={sceneType}
      />

      {/* Audio Maestro Modal Studio */}
      <AudioMaestroModal
        isOpen={isAudioMaestroModalOpen}
        onClose={() => setIsAudioMaestroModalOpen(false)}
      />
    </div>
  );
};
