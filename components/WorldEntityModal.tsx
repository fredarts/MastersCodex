'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Layers, BookOpen, FileText, Image as ImageIcon, Trash2, Upload, AlertCircle, Wand2, Network, Target, CheckSquare, Award, Coins, MapPin, Users, Check, ZoomIn, RefreshCw, Loader2, Star, Crown, Heart, Skull, Shield, Swords, EyeOff, Lock, User, Palette, Package, Activity, Zap, Play, Camera } from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { WorldEntityCategory, WorldEntity, EntityConnection, ConnectionType, EntityStatSheet, QuestObjective, QuestReward, QuestStatus, QuestDifficulty, QuestType, CharacterSheet } from '@/lib/types';
import { getEntityPortraitUrl, getEntityCombatPinUrl } from '@/lib/world/entityHelpers';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { WorldEntityAiGeneratorModal } from '@/components/WorldEntityAiGeneratorModal';
import { worldService } from '@/lib/services/worldService';
import { CharacterSheetModal } from '@/components/character-sheet/CharacterSheetModal';
import { CharacterBuilderWizardModal } from '@/components/character-sheet/Modals/CharacterBuilderWizardModal';
import { NPC_EQUIPMENT_PRESETS, applyNpcEquipmentPreset } from '@/lib/npc-equipment-presets';
import { createEmptyCharacterSheet } from '@/lib/dnd5e-data';
import { recalculateSheetDerivedStats, getEffectiveAttributeScore, getAttributeModifier } from '@/lib/dnd5e-calculator';
import { merchantService } from '@/lib/merchant/merchantService';

import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { WikiTextRenderer } from '@/components/ui/WikiTextRenderer';
import { Eye, Edit3 } from 'lucide-react';

export const RPG_IMAGE_STYLES = [
  { id: 'none', label: '🎨 Estilo Padrão / Automático', prompt: '' },
  { id: 'dark_fantasy', label: '🌑 Dark Fantasy & Grimdark (Elden Ring / Souls)', prompt: 'Dark fantasy art, gritty atmosphere, shadows, high contrast oil painting, Elden Ring and Dark Souls aesthetic, moody chiaroscuro lighting, highly detailed' },
  { id: 'classic_dnd', label: '⚔️ D&D Clássico & MTG (Pintura a Óleo)', prompt: 'Classic high fantasy oil painting, Magic The Gathering card art style, rich pigments, master brushwork, detailed textures, heroic composition' },
  { id: 'cyberpunk', label: '🌆 Cyberpunk & Shadowrun (Arcanopunk)', prompt: 'Cyberpunk fantasy, neon reflections, holographic arcane glyphs, high-tech cybernetics, volumetric rain, dynamic cinematic lighting' },
  { id: 'anime_jrpg', label: '✨ Anime & JRPG Fantasia (Ghibli / Final Fantasy)', prompt: 'High quality anime fantasy concept art, vibrant colors, detailed cel shading, expressive character design, cinematic anime lighting' },
  { id: 'watercolor_parchment', label: '📜 Aquarela em Pergaminho Nobre', prompt: 'Delicate vintage watercolor illustration, aged parchment paper texture, ink wash accents, medieval illuminated manuscript style' },
  { id: 'hyper_cinematic', label: '🎬 Arte Conceitual Hiper-Realista 8K', prompt: 'Cinematic concept art, hyper-realistic, 8k Unreal Engine 5 render, raytraced subsurface scattering, IMAX lighting, photorealistic textures' },
  { id: 'cosmic_horror', label: '🐙 Terror Cósmico / Lovecraftiano (Bloodborne)', prompt: 'Eldritch cosmic horror, sanity-draining atmosphere, eerie glowing runes, tentacles, deep abyss shadows, Bloodborne aesthetic' },
  { id: 'steampunk', label: '⚙️ Steampunk & Engenhocas de Éter (Eberron)', prompt: 'Arcanopunk steampunk fantasy, brass gears, glowing aether crystals, leather and copper mechanisms, smoky Victorian lighting' },
  { id: 'medieval_woodcut', label: '✒️ Gravura Medieval em Madeira / Xilogravura', prompt: 'Black ink linework, medieval woodcut engraving style, hatching cross-hatch shading, gothic grimoire illustration' },
  { id: 'high_epic_fantasy', label: '👑 Alta Fantasia Radiante / Épica', prompt: 'High epic fantasy, radiant golden sunlight, ethereal aura, heroic majestic lighting, pristine crystalline elements, legendary atmosphere' },
  { id: 'gothic_victorian', label: '🦇 Gótico Vitoriano & Vampírico (Castlevania)', prompt: 'Victorian gothic fantasy, Castlevania aesthetic, moonlit velvet textures, wrought iron, crimson accents, baroque architecture' },
  { id: 'nordic_viking', label: '❄️ Nórdico / Mitologia Viking & Gélida', prompt: 'Norse mythology pagan fantasy, frosty blizzard, carved ancient runes, furs, cold blue tones, raw barbaric atmosphere' },
  { id: 'spelljammer_astral', label: '🌌 Mar Astral & Spelljammer Cósmico', prompt: 'Space opera fantasy, astral sea, stardust nebula backdrop, cosmic arcane energies, glowing planetary horizons' },
  { id: 'retro_80s', label: '🛡️ Retrô Fantasia Anos 80 (Frazetta / Elmore)', prompt: 'Retro 1980s fantasy book cover art, Frank Frazetta and Larry Elmore style, dramatic acrylic painting, heroic fantasy' },
  { id: 'solarpunk_druidic', label: '🌿 Druídico Solarpunk & Bio-Mágico', prompt: 'Druidic Solarpunk fantasy, bioluminescent flora, living moss, sun-dappled ancient forest, harmonious nature magic' },
  { id: 'pixel_art', label: '👾 Pixel Art HD-2D / 16-Bit RPG', prompt: 'HD-2D Octopath style pixel art, modern dynamic lighting, retro fantasy aesthetic, rich pixel depth, detailed sprites' },
  { id: 'renaissance_portrait', label: '🕯️ Retrato Renascentista (Rembrandt)', prompt: 'Renaissance master portrait, Rembrandt style chiaroscuro, warm candlelight, dramatic deep shadows, velvet texture' },
  { id: 'synthwave_retro', label: '🔮 Synthwave / Synth-Fantasy Arcano', prompt: 'Synthwave fantasy, vibrant magenta and cyan neon glow, retrofuturistic arcane grid, 80s aesthetic' },
];

const generateTimestampId = (prefix: string) => `${prefix}-${Date.now()}`;

interface WorldEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: WorldEntityCategory;
  editingEntity?: WorldEntity | null;
}

export const WorldEntityModal: React.FC<WorldEntityModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'npc',
  editingEntity = null,
}) => {
  const { activeWorld, worldEntities, createWorldEntity, updateWorldEntity } = useWorld();
  const { settings } = useUserSettings();
  const [category, setCategory] = useState<WorldEntityCategory>(defaultCategory);
  const [name, setName] = useState('');
  const [subType, setSubType] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [isPreviewFullContent, setIsPreviewFullContent] = useState(false);
  const [extraAttr1, setExtraAttr1] = useState('');
  const [extraAttr2, setExtraAttr2] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [connections, setConnections] = useState<EntityConnection[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Dedicated NPC & Genealogy States
  const [npcRace, setNpcRace] = useState('');
  const [npcClass, setNpcClass] = useState('');
  const [npcAlignment, setNpcAlignment] = useState('Neutro');
  const [npcHouseOrClan, setNpcHouseOrClan] = useState('');
  const [npcGeneration, setNpcGeneration] = useState(0);
  const [npcGender, setNpcGender] = useState<'male' | 'female' | 'other'>('male');
  const [npcIsAlive, setNpcIsAlive] = useState(true);
  const [npcBirthEra, setNpcBirthEra] = useState('');
  const [npcDeathEra, setNpcDeathEra] = useState('');
  const [npcSuccessionStatus, setNpcSuccessionStatus] = useState<string>('none');
  const [npcCustomBadge, setNpcCustomBadge] = useState('');
  const [npcSecrets, setNpcSecrets] = useState('');

  // Quest Tracker States
  const [questStatus, setQuestStatus] = useState<QuestStatus>('not_started');
  const [questDifficulty, setQuestDifficulty] = useState<QuestDifficulty>('medium');
  const [questType, setQuestType] = useState<QuestType>('main');
  const [questXpReward, setQuestXpReward] = useState<number>(100);
  const [questGoldReward, setQuestGoldReward] = useState<number>(50);
  const [questItemReward, setQuestItemReward] = useState<string>('');
  const [questGiverNpcId, setQuestGiverNpcId] = useState<string>('');
  const [questTargetLocationId, setQuestTargetLocationId] = useState<string>('');
  const [questObjectives, setQuestObjectives] = useState<QuestObjective[]>([]);
  const [newObjectiveDesc, setNewObjectiveDesc] = useState<string>('');
  const [newObjectiveOptional, setNewObjectiveOptional] = useState<boolean>(false);
  
  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Tab and Stat Sheet States
  const [activeTab, setActiveTab] = useState<'description' | 'stats'>('description');
  const [ac, setAc] = useState(10);
  const [hp, setHp] = useState(10);
  const [maxHp, setMaxHp] = useState(10);
  const [speed, setSpeed] = useState('9m (30ft)');
  const [cr, setCr] = useState('0');
  const [xp, setXp] = useState(0);
  const [str, setStr] = useState(10);
  const [dex, setDex] = useState(10);
  const [con, setCon] = useState(10);
  const [int, setInt] = useState(10);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(10);
  const [abilities, setAbilities] = useState<{ name: string; desc: string }[]>([]);
  const [actions, setActions] = useState<{ name: string; desc: string }[]>([]);
  const [newAbilityName, setNewAbilityName] = useState('');
  const [newAbilityDesc, setNewAbilityDesc] = useState('');
  const [newActionName, setNewActionName] = useState('');
  const [newActionDesc, setNewActionDesc] = useState('');

  // Full D&D 5e Character Sheet states for NPCs
  const [npcSheetMode, setNpcSheetMode] = useState<'statblock' | 'full'>('full');
  const [npcCharacterSheet, setNpcCharacterSheet] = useState<CharacterSheet | null>(null);
  const [isNpcSheetModalOpen, setIsNpcSheetModalOpen] = useState(false);
  const [isNpcWizardModalOpen, setIsNpcWizardModalOpen] = useState(false);
  const [selectedPresetKit, setSelectedPresetKit] = useState<string>(NPC_EQUIPMENT_PRESETS[0]?.id || 'guard_soldier');
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null);

  const resetStatSheetDefaults = () => {
    setAc(10);
    setHp(10);
    setMaxHp(10);
    setSpeed('9m (30ft)');
    setCr('0');
    setXp(0);
    setStr(10);
    setDex(10);
    setCon(10);
    setInt(10);
    setWis(10);
    setCha(10);
    setAbilities([]);
    setActions([]);
    setNpcCharacterSheet(null);
    setNpcSheetMode('full');
    setPresetFeedback(null);
  };

  const handleClose = () => {
    setActiveTab('description');
    resetStatSheetDefaults();
    onClose();
  };

  // AI Image Generator states (Nano Banana)
  const [extraPrompt, setExtraPrompt] = useState('');
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [aiWarningMessage, setAiWarningMessage] = useState<string | null>(null);

  // AI Image Edit states
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>('none');
  const [editSelectedArtStyle, setEditSelectedArtStyle] = useState<string>('none');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9' | '3:4' | '4:3'>('9:16');
  const [editAspectRatio, setEditAspectRatio] = useState<'1:1' | '9:16' | '16:9' | '3:4' | '4:3'>('9:16');
  const [isCombatPinMode, setIsCombatPinMode] = useState(false);
  const [isPortraitMode, setIsPortraitMode] = useState(false);
  const [combatPinIndex, setCombatPinIndex] = useState<number | null>(null);
  const [portraitIndex, setPortraitIndex] = useState<number | null>(null);
  const [useCoverAsReference, setUseCoverAsReference] = useState(true);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [isGeneratingAiEdit, setIsGeneratingAiEdit] = useState(false);
  const [editMode, setEditMode] = useState<'replace' | 'add_new'>('add_new');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    if (editingEntity) {
      setCategory(editingEntity.category);
      setName(editingEntity.name);
      setSubType(editingEntity.subType || '');
      setShortDesc(editingEntity.shortDesc || '');
      setFullContent(editingEntity.fullContent || '');
      setImages(editingEntity.images || []);
      setConnections(editingEntity.connections || []);
      
      const attrs = editingEntity.attributes || {};
      const resolvedTags = (editingEntity.tags && editingEntity.tags.length > 0)
        ? editingEntity.tags
        : (attrs.tags ? (typeof attrs.tags === 'string' ? JSON.parse(attrs.tags) : attrs.tags) : []);
      setTags(Array.isArray(resolvedTags) ? resolvedTags : []);
      setCombatPinIndex(typeof attrs.combatPinIndex === 'number' ? attrs.combatPinIndex : null);
      setPortraitIndex(typeof attrs.portraitIndex === 'number' ? attrs.portraitIndex : null);

      if (editingEntity.category === 'npc') {
        setNpcRace(attrs.npcRace || attrs.race || '');
        setNpcClass(attrs.npcClass || attrs.class || '');
        setNpcAlignment(attrs.npcAlignment || attrs.alignment || 'Neutro');
        setNpcHouseOrClan(attrs.houseOrDynasty || attrs.house || attrs.clan || '');
        setNpcGeneration(Number(attrs.generation ?? 0));
        setNpcGender((attrs.gender as any) || 'male');
        setNpcIsAlive(editingEntity.status === 'active' || editingEntity.status === 'allied' || attrs.isAlive === 'true' || attrs.isAlive === true || (attrs.isAlive === undefined && editingEntity.status !== 'dead'));
        setNpcBirthEra(attrs.birthEra || '');
        setNpcDeathEra(attrs.deathEra || '');
        setNpcSuccessionStatus(attrs.successionStatus || 'none');
        setNpcCustomBadge(attrs.customBadge || '');
        setNpcSecrets(attrs.secrets || attrs.dmSecrets || '');
        setExtraAttr1('');
        setExtraAttr2('');
      } else {
        const k1 = getAttrKey1();
        const k2 = getAttrKey2();
        setExtraAttr1(String(attrs[k1] || ''));
        setExtraAttr2(String(attrs[k2] || ''));
      }

      if (editingEntity.category === 'quest') {
        const qData = editingEntity.attributes || {};
        setQuestStatus((qData.questStatus as QuestStatus) || 'not_started');
        setQuestDifficulty((qData.questDifficulty as QuestDifficulty) || 'medium');
        setQuestType((qData.questType as QuestType) || 'main');
        setQuestXpReward(Number(qData.questXpReward || 100));
        setQuestGoldReward(Number(qData.questGoldReward || 50));
        setQuestItemReward(String(qData.questItemReward || ''));
        setQuestGiverNpcId(String(qData.questGiverNpcId || ''));
        setQuestTargetLocationId(String(qData.questTargetLocationId || ''));
        try {
          const parsed = typeof qData.questObjectives === 'string'
            ? JSON.parse(qData.questObjectives)
            : (Array.isArray(qData.questObjectives) ? qData.questObjectives : []);
          setQuestObjectives(parsed);
        } catch {
          setQuestObjectives([]);
        }
      }

      // Fetch combat stats if entity has them
      const hasStats = ['npc', 'monster', 'beast'].includes(editingEntity.category);
      if (hasStats) {
        worldService.fetchEntityStatSheet(editingEntity.id).then((res) => {
          if (res.ok && res.value) {
            const sheet = res.value;
            setAc(sheet.ac);
            setHp(sheet.hp);
            setMaxHp(sheet.maxHp);
            setSpeed(sheet.speed || '9m (30ft)');
            setCr(sheet.cr || '0');
            setXp(sheet.xp || 0);
            setStr(sheet.str);
            setDex(sheet.dex);
            setCon(sheet.con);
            setInt(sheet.int);
            setWis(sheet.wis);
            setCha(sheet.cha);
            setAbilities(sheet.abilities || []);
            setActions(sheet.actions || []);
          } else {
            resetStatSheetDefaults();
          }
        });
      } else {
        resetStatSheetDefaults();
      }

      // Initialize full character sheet for NPCs if available
      const rawSheet = editingEntity.characterSheet || attrs.characterSheet;
      if (rawSheet) {
        setNpcCharacterSheet(rawSheet);
        setNpcSheetMode(editingEntity.statSheetMode || attrs.statSheetMode || 'full');
      } else if (editingEntity.category === 'npc') {
        const initSheet = createEmptyCharacterSheet('dm', activeWorld?.id);
        initSheet.characterName = editingEntity.name;
        initSheet.race = attrs.npcRace || attrs.race || 'Humano';
        initSheet.className = attrs.npcClass || attrs.class || 'Guerreiro';
        initSheet.alignment = attrs.npcAlignment || attrs.alignment || 'Neutro';
        initSheet.avatarUrl = getEntityPortraitUrl(editingEntity) || '';
        setNpcCharacterSheet(initSheet);
        setNpcSheetMode(editingEntity.statSheetMode || attrs.statSheetMode || 'full');
      } else {
        setNpcCharacterSheet(null);
        setNpcSheetMode('statblock');
      }
    } else {
      setCategory(defaultCategory);
      setName('');
      setSubType('');
      setShortDesc('');
      setFullContent('');
      setExtraAttr1('');
      setExtraAttr2('');
      setImages([]);
      setConnections([]);
      setTags([]);
      setNpcRace('');
      setNpcClass('');
      setNpcAlignment('Neutro');
      setNpcHouseOrClan('');
      setNpcGeneration(0);
      setNpcGender('male');
      setNpcIsAlive(true);
      setNpcBirthEra('');
      setNpcDeathEra('');
      setNpcSuccessionStatus('none');
      setNpcCustomBadge('');
      setNpcSecrets('');
      setQuestStatus('not_started');
      setQuestDifficulty('medium');
      setQuestType('main');
      setQuestXpReward(100);
      setQuestGoldReward(50);
      setQuestItemReward('');
      setQuestGiverNpcId('');
      setQuestTargetLocationId('');
      setQuestObjectives([]);
      setNewObjectiveDesc('');
      setNewObjectiveOptional(false);
      resetStatSheetDefaults();
    }
  }, [editingEntity, defaultCategory, isOpen]);

  if (!isOpen || !activeWorld) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const publicUrl = await storageService.uploadAsset(file, 'avatars');
      setImages((prev) => [...prev, publicUrl]);
    } catch (err) {
      console.error('Failed to upload entity image:', err);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleDeleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setCombatPinIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
    setPortraitIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
    setCombatPinIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return 0;
      if (prev === 0) return 1;
      if (prev < index) return prev + 1;
      return prev;
    });
    setPortraitIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return 0;
      if (prev === 0) return 1;
      if (prev < index) return prev + 1;
      return prev;
    });
  };

  const handleSetCombatPinImage = (index: number) => {
    setCombatPinIndex((prev) => (prev === index ? null : index));
  };

  const handleSetPortraitImage = (index: number) => {
    setPortraitIndex((prev) => (prev === index ? null : index));
  };

  // IA Image Generator (Gemini/Nano Banana ou modelo selecionado)
  const handleGenerateAiImage = async () => {
    // Description validation check as requested
    if (!shortDesc.trim() && !fullContent.trim()) {
      setAiWarningMessage('Preencha primeiro a descrição da entrada antes de gerar a imagem com IA!');
      return;
    }
    setAiWarningMessage(null);
    setIsGeneratingAiImage(true);

    try {
      const baseDescription = shortDesc.trim() || fullContent.trim();
      const categoryName = getCategoryTitle().replace('Adicionar Novo ', '').replace('Adicionar Nova ', '');
      
      const referenceCoverImage = (images.length > 0 && useCoverAsReference) ? images[0] : undefined;

      const chosenStyle = RPG_IMAGE_STYLES.find((s) => s.id === selectedArtStyle);
      const stylePromptPart = chosenStyle?.prompt ? `Art style & aesthetic: ${chosenStyle.prompt}.` : '';

      const noTextRule = 'No text, no typography, no letters, no words, no watermark, no signatures, no UI borders.';

      // Determine the actual aspect ratio (combat pin and portrait always use 1:1)
      const effectiveAspectRatio = (isCombatPinMode || isPortraitMode) ? '1:1' as const : aspectRatio;

      let promptText: string;

      if (isCombatPinMode) {
        // Combat Pin Mode: front-facing, combat stance, pure white background
        const pinConsistency = referenceCoverImage
          ? `Maintain exact facial features, skin tone, hair style, race, physical identity, armor, clothing and aesthetic style from the provided reference image.`
          : '';
        promptText = `Full body character art of ${name.trim() || categoryName}, facing directly forward toward the viewer, in a dynamic combat ready stance, holding their weapon or preparing a spell. ${pinConsistency} Character details: ${baseDescription}. The character must be centered in the frame with the entire body visible from head to feet. MANDATORY: Pure clean solid white background (#FFFFFF), absolutely no environment, no scenery, no ground, no shadows on background, no props behind the character. The character should look like a tabletop RPG miniature token. ${stylePromptPart} ${extraPrompt.trim() ? `Additional details: ${extraPrompt.trim()}` : ''} High quality, sharp details, clean edges for easy cutout. ${noTextRule}`;
      } else if (isPortraitMode) {
        // Portrait / Profile Mode: Close-up facial portrait / head-and-shoulders, expressive eyes, atmospheric lighting
        const portraitConsistency = referenceCoverImage
          ? `Maintain exact facial features, skin tone, eye color, facial hair, hairstyle and color, race, scars and visual identity from the provided reference image.`
          : '';
        promptText = `High detail close-up head-and-shoulders face portrait of ${name.trim() || categoryName}. Direct frontal eye contact or subtle 3/4 angle, highly detailed expressive eyes, clear and sharp facial features, beautiful framing of face and hair/headwear. ${portraitConsistency} Character details: ${baseDescription}. Genre: ${activeWorld.genre}. ${stylePromptPart} ${extraPrompt.trim() ? `Additional details: ${extraPrompt.trim()}` : 'Cinematic character portrait lighting, dramatic shadows, shallow depth of field, 8k resolution, masterpiece digital art.'} ${noTextRule}`;
      } else if (referenceCoverImage) {
        promptText = `Character visual consistency artwork of ${name.trim() || categoryName}. Maintain exact facial features, skin tone, hair style, race, physical identity and aesthetic style from the provided reference image. Scene, pose or context details: ${baseDescription}. ${stylePromptPart} ${extraPrompt.trim() ? `Additional custom details: ${extraPrompt.trim()}` : ''}. High quality fantasy RPG concept art, cinematic lighting, 8k resolution. ${noTextRule}`;
      } else {
        promptText = `High detailed fantasy RPG concept art of ${name.trim() || categoryName}: ${baseDescription}. Genre: ${activeWorld.genre}. ${stylePromptPart} ${extraPrompt.trim() ? `Additional style details: ${extraPrompt.trim()}` : 'Digital painting, atmospheric lighting, 8k resolution, cinematic composition.'} ${noTextRule}`;
      }

      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptText,
          sourceImage: referenceCoverImage,
          aspectRatio: effectiveAspectRatio,
          userSettings: settings,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao gerar imagem.');

      const base64Data = data.base64;
      let finalUrl = `data:image/jpeg;base64,${base64Data}`;

      const fileSuffix = isCombatPinMode ? '-combat-pin' : isPortraitMode ? '-portrait' : '';
      if (isSupabaseConfigured()) {
        try {
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          const file = new File([blob], generateTimestampId(categoryName.toLowerCase().replace(/\s+/g, '-') + fileSuffix) + '.png', { type: 'image/png' });
          const publicUrl = await storageService.uploadAsset(file, 'avatars');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Failed to upload entity image, falling back to base64', uploadErr);
        }
      }

      setImages((prev) => {
        const newImages = [...prev, finalUrl];
        if (isCombatPinMode) {
          setCombatPinIndex(newImages.length - 1);
        } else if (isPortraitMode) {
          setPortraitIndex(newImages.length - 1);
        }
        return newImages;
      });

    } catch (err: unknown) {
      console.error('Failed to generate AI image', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiWarningMessage(errMsg || 'Erro ao gerar imagem.');
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  // IA Image Editor (Image-to-Image / Prompt Modification)
  const handleGenerateAiEditImage = async () => {
    if (editingImageIndex === null || !images[editingImageIndex]) return;
    if (!aiEditPrompt.trim()) {
      setAiWarningMessage('Descreva o que deseja alterar na imagem com a IA.');
      return;
    }

    setIsGeneratingAiEdit(true);
    setAiWarningMessage(null);

    try {
      const sourceImage = images[editingImageIndex];
      const categoryName = getCategoryTitle().replace('Adicionar Novo ', '').replace('Adicionar Nova ', '');
      const chosenEditStyle = RPG_IMAGE_STYLES.find((s) => s.id === editSelectedArtStyle);
      const editStylePromptPart = chosenEditStyle?.prompt ? `Art style & aesthetic: ${chosenEditStyle.prompt}.` : '';

      const promptText = `Modify and transform this image of ${name.trim() || categoryName}. Required alterations and visual changes: ${aiEditPrompt.trim()}. ${editStylePromptPart} Keep fantasy RPG style, high quality digital painting, atmospheric lighting. No text, no typography, no words, no letters, no watermark.`;

      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          sourceImage,
          aspectRatio: editAspectRatio,
          userSettings: settings,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao editar imagem com IA.');

      const base64Data = data.base64;
      let finalUrl = `data:image/jpeg;base64,${base64Data}`;

      if (isSupabaseConfigured()) {
        try {
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          const file = new File([blob], generateTimestampId(categoryName.toLowerCase().replace(/\s+/g, '-') + '-edited') + '.jpg', { type: 'image/jpeg' });
          const publicUrl = await storageService.uploadAsset(file, 'avatars');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Failed to upload edited image, falling back to base64', uploadErr);
        }
      }

      if (editMode === 'replace') {
        setImages((prev) => prev.map((img, i) => (i === editingImageIndex ? finalUrl : img)));
      } else {
        setImages((prev) => [...prev, finalUrl]);
      }

      setEditingImageIndex(null);
      setAiEditPrompt('');
    } catch (err: unknown) {
      console.error('Failed to generate AI image edit', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiWarningMessage(errMsg || 'Erro ao editar imagem com IA.');
    } finally {
      setIsGeneratingAiEdit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    const attributes: Record<string, any> = { ...(editingEntity?.attributes || {}) };
    if (combatPinIndex !== null) {
      attributes.combatPinIndex = combatPinIndex;
    } else {
      delete attributes.combatPinIndex;
    }

    if (portraitIndex !== null) {
      attributes.portraitIndex = portraitIndex;
      if (images[portraitIndex]) {
        attributes.portraitUrl = images[portraitIndex];
      }
    } else {
      delete attributes.portraitIndex;
      delete attributes.portraitUrl;
    }

    if (category === 'npc') {
      attributes.npcRace = npcRace.trim();
      attributes.npcClass = npcClass.trim();
      attributes.npcAlignment = npcAlignment.trim();
      attributes.houseOrDynasty = npcHouseOrClan.trim();
      attributes.generation = String(npcGeneration);
      attributes.gender = npcGender;
      attributes.birthEra = npcBirthEra.trim();
      attributes.deathEra = !npcIsAlive ? npcDeathEra.trim() : '';
      attributes.successionStatus = npcSuccessionStatus;
      attributes.customBadge = npcCustomBadge.trim();
      attributes.secrets = npcSecrets.trim();

      if (npcCharacterSheet) {
        const resolvedAvatar = (portraitIndex !== null && images[portraitIndex])
          ? images[portraitIndex]
          : (images[0] || npcCharacterSheet.avatarUrl);

        const synchedSheet: CharacterSheet = {
          ...npcCharacterSheet,
          characterName: name.trim() || npcCharacterSheet.characterName,
          race: npcRace.trim() || npcCharacterSheet.race,
          className: npcClass.trim() || npcCharacterSheet.className,
          alignment: npcAlignment || npcCharacterSheet.alignment,
          avatarUrl: resolvedAvatar,
          backstory: shortDesc.trim() || npcCharacterSheet.backstory,
        };
        const recalculated = recalculateSheetDerivedStats(synchedSheet);
        attributes.characterSheet = recalculated;
        attributes.statSheetMode = npcSheetMode;
      }
    } else if (category === 'quest') {
      attributes.questStatus = questStatus;
      attributes.questDifficulty = questDifficulty;
      attributes.questType = questType;
      attributes.questXpReward = String(questXpReward);
      attributes.questGoldReward = String(questGoldReward);
      attributes.questItemReward = questItemReward;
      attributes.questGiverNpcId = questGiverNpcId;
      attributes.questTargetLocationId = questTargetLocationId;
      attributes.questObjectives = JSON.stringify(questObjectives);
    } else {
      if (extraAttr1.trim()) attributes[getAttrKey1()] = extraAttr1.trim();
      if (extraAttr2.trim()) attributes[getAttrKey2()] = extraAttr2.trim();
    }

    const finalConnections = [...connections];
    if (category === 'quest') {
      if (questGiverNpcId && !finalConnections.some((c) => c.targetId === questGiverNpcId)) {
        finalConnections.push({ targetId: questGiverNpcId, type: 'allied' });
      }
      if (questTargetLocationId && !finalConnections.some((c) => c.targetId === questTargetLocationId)) {
        finalConnections.push({ targetId: questTargetLocationId, type: 'location' });
      }
    }

    let savedEntity: WorldEntity | null = null;

    if (editingEntity) {
      const updated: WorldEntity = {
        ...editingEntity,
        category,
        name: name.trim(),
        subType: subType.trim() || undefined,
        status: category === 'npc' ? (npcIsAlive ? 'active' : 'dead') : (editingEntity.status || 'active'),
        shortDesc: shortDesc.trim(),
        fullContent: fullContent.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        connections: finalConnections,
        attributes,
        characterSheet: (attributes.characterSheet as CharacterSheet) || undefined,
        statSheetMode: (attributes.statSheetMode as 'statblock' | 'full') || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };
      await updateWorldEntity(updated);
      savedEntity = updated;
    } else {
      const created = await createWorldEntity({
        worldId: activeWorld.id,
        category,
        name: name.trim(),
        subType: subType.trim() || undefined,
        status: category === 'npc' ? (npcIsAlive ? 'active' : 'dead') : 'active',
        shortDesc: shortDesc.trim(),
        fullContent: fullContent.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        connections: finalConnections,
        attributes,
        tags: tags.length > 0 ? tags : undefined,
      });
      savedEntity = created;
    }

    if (savedEntity && ['npc', 'monster', 'beast'].includes(category)) {
      let finalAc = ac;
      let finalHp = hp;
      let finalMaxHp = maxHp;
      let finalSpeed = speed;
      let finalStr = str;
      let finalDex = dex;
      let finalCon = con;
      let finalInt = int;
      let finalWis = wis;
      let finalCha = cha;
      let finalActions = actions;
      let finalAbilities = abilities;

      if (category === 'npc' && attributes.characterSheet) {
        const cs: CharacterSheet = attributes.characterSheet as CharacterSheet;
        finalAc = cs.armorClass || ac;
        finalHp = cs.currentHp || hp;
        finalMaxHp = cs.maxHp || maxHp;
        finalSpeed = cs.speed || speed;
        finalStr = getEffectiveAttributeScore(cs, 'str');
        finalDex = getEffectiveAttributeScore(cs, 'dex');
        finalCon = getEffectiveAttributeScore(cs, 'con');
        finalInt = getEffectiveAttributeScore(cs, 'int');
        finalWis = getEffectiveAttributeScore(cs, 'wis');
        finalCha = getEffectiveAttributeScore(cs, 'cha');

        if (cs.attacks && cs.attacks.length > 0) {
          finalActions = cs.attacks.map((atk) => ({
            name: atk.name,
            desc: `Ataque: ${atk.atkBonus} para acertar. Dano: ${atk.damage} (${atk.type || 'Físico'}).`
          }));
        }
      }

      const sheet: EntityStatSheet = {
        id: editingEntity?.statSheet?.id || generateTimestampId('sheet'),
        entityId: savedEntity.id,
        ac: finalAc,
        hp: finalHp,
        maxHp: finalMaxHp,
        speed: finalSpeed,
        cr,
        xp,
        str: finalStr,
        dex: finalDex,
        con: finalCon,
        int: finalInt,
        wis: finalWis,
        cha: finalCha,
        abilities: finalAbilities,
        actions: finalActions,
      };
      const res = await worldService.saveEntityStatSheet(sheet);
      if (!res.ok) {
        console.error('Failed to save entity stat sheet:', res.error);
      }
    }

    // Sincronização Automática: Atualiza instantaneamente quaisquer lojas vinculadas a este NPC em todo o sistema
    if (category === 'npc' && savedEntity) {
      const currentPortrait = getEntityPortraitUrl(savedEntity);
      if (currentPortrait) {
        const entityId = savedEntity.id;
        const entityName = (savedEntity.name || name).toLowerCase().trim();

        // 1. Atualização direta em todos os registros do LocalStorage
        if (typeof window !== 'undefined') {
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('codex_merchant_shops_') || key.startsWith('masters_merchant_shops_'))) {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const shops = JSON.parse(raw);
                  if (Array.isArray(shops)) {
                    let changed = false;
                    const updated = shops.map((sh: any) => {
                      const matchesId = sh.npcEntityId === entityId;
                      const sName = (sh.merchantName || '').toLowerCase().trim();
                      const matchesName = Boolean(sName && (sName === entityName || sName.includes(entityName) || entityName.includes(sName)));
                      if (matchesId || matchesName) {
                        changed = true;
                        return {
                          ...sh,
                          npcEntityId: entityId,
                          merchantAvatarUrl: currentPortrait,
                          updatedAt: new Date().toISOString(),
                        };
                      }
                      return sh;
                    });
                    if (changed) {
                      localStorage.setItem(key, JSON.stringify(updated));
                    }
                  }
                }
              }
            }
          } catch (lsErr) {
            console.warn('Erro ao atualizar localStorage de lojas:', lsErr);
          }
        }

        // 2. Atualização via Supabase se configurado
        if (isSupabaseConfigured()) {
          try {
            supabase
              .from('campaign_shops')
              .select('*')
              .then(async (res: any) => {
                const dbShops = res.data;
                if (dbShops && dbShops.length > 0) {
                  for (const d of dbShops) {
                    const matchesId = d.npc_entity_id === entityId;
                    const sName = (d.merchant_name || '').toLowerCase().trim();
                    const matchesName = Boolean(sName && (sName === entityName || sName.includes(entityName) || entityName.includes(sName)));
                    if (matchesId || matchesName) {
                      await supabase
                        .from('campaign_shops')
                        .update({
                          npc_entity_id: entityId,
                          merchant_avatar_url: currentPortrait,
                          updated_at: new Date().toISOString(),
                        })
                        .eq('id', d.id);
                    }
                  }
                }
              });
          } catch (sbErr) {
            console.warn('Erro ao atualizar lojas no Supabase:', sbErr);
          }
        }
      }
    }

    setIsSubmitting(false);
    setName('');
    setSubType('');
    setShortDesc('');
    setFullContent('');
    setExtraAttr1('');
    setExtraAttr2('');
    setImages([]);
    setConnections([]);
    setTags([]);
    setTagInput('');
    setExtraPrompt('');
    setAiWarningMessage(null);
    resetStatSheetDefaults();
    handleClose();
  };

  // Dynamic Text Helpers per Category
  const getCategoryTitle = () => {
    switch (category) {
      case 'npc': return 'Adicionar Novo NPC / Personagem';
      case 'location': return 'Adicionar Nova Cidade, Masmorra, Ruína ou Geografia';
      case 'faction': return 'Adicionar Nova Facção ou Guilda';
      case 'religion': return 'Adicionar Nova Religião ou Deus';
      case 'lore_event': return 'Adicionar Novo Evento Histórico / Lore';
      case 'species': return 'Adicionar Nova Espécie / Raça';
      case 'ethnicity': return 'Adicionar Nova Etnia / Cultura';
      case 'tradition': return 'Adicionar Nova Tradição ou Ritual';
      case 'profession': return 'Adicionar Nova Profissão ou Título';
      case 'natural_law': return 'Adicionar Nova Lei Natural / Fenômeno';
      case 'spell': return 'Adicionar Novo Feitiço ou Magia';
      case 'disease': return 'Adicionar Nova Doença ou Condição';
      case 'item': return 'Adicionar Novo Item ou Artefato';
      case 'material': return 'Adicionar Novo Recurso, Material ou Minério';
      case 'technology': return 'Adicionar Nova Tecnologia ou Veículo';
      case 'document': return 'Adicionar Novo Documento ou Registro';
      case 'language': return 'Adicionar Novo Idioma ou Dialeto';
      case 'military_conflict': return 'Adicionar Novo Conflito Militar';
      case 'military_unit': return 'Adicionar Nova Unidade Militar';
      case 'currency': return 'Adicionar Sistema Monetário ou Moeda';
      case 'trade_route': return 'Adicionar Rota Comercial ou Mercado';
      case 'beast': return 'Adicionar Fera ou Criatura Selvagem';
      case 'monster': return 'Adicionar Novo Monstro ou Besta';
      case 'flora': return 'Adicionar Flora Extraordinária ou Planta';
      case 'magic_system': return 'Adicionar Sistema de Magia ou Lei Física';
      case 'plane': return 'Adicionar Plano de Existência ou Dimensão';
      case 'cosmology': return 'Adicionar Mito de Criação ou Cosmologia';
      case 'quest': return 'Adicionar Nova Missão / Quest';
    }
  };

  const getSubmitButtonText = () => {
    return `+ Salvar ${getCategoryTitle().replace('Adicionar Novo ', '').replace('Adicionar Nova ', '').replace('Adicionar ', '')}`;
  };

  const getNamePlaceholder = () => {
    switch (category) {
      case 'npc': return 'Ex: Rei Aris III / Kraag, o Devastador';
      case 'location': return 'Ex: Cidade Real de Valíria / Masmorra Obscura dos Ventos / Taverna do Dragão';
      case 'faction': return 'Ex: Guilda das Sombras / Ordem dos Cavaleiros de Prata';
      case 'religion': return 'Ex: Caminho dos Oito Deuses / Culto da Névoa Ancestral';
      case 'lore_event': return 'Ex: A Queda do Império Solaria / Cataclisma Solar';
      case 'species': return 'Ex: Elfos Astrais do Crepúsculo / Draconídeos / Fungos Conscientes';
      case 'ethnicity': return 'Ex: Nômades das Dunas de Ouro / Clãs da Montanha do Norte';
      case 'tradition': return 'Ex: Festival do Eclipse / Ritual de Passagem Solar';
      case 'profession': return 'Ex: Caçador de Quimeras / Arquimago da Corte Imperial';
      case 'natural_law': return 'Ex: Gravidade Invertida dos Picos / Anomalia Temporal';
      case 'spell': return 'Ex: Esfera de Aniquilação Arcana / Ritual de Selamento';
      case 'disease': return 'Ex: Praga de Cristal / Maldição do Sangue Negro';
      case 'item': return 'Ex: Cetro de Fogo Ancestral / Moeda de Mithral Encantada';
      case 'material': return 'Ex: Adamantite Negro / Essência de Éter / Madeira de Ferro';
      case 'technology': return 'Ex: Autômato a Vapor / Carruagem Voadora Arcana';
      case 'document': return 'Ex: Tratado de Paz dos Sete Reinos / Tomo de Alquimia';
      case 'language': return 'Ex: Alto Élfico / Dialeto das Sombras / Rúnico Anão';
      case 'military_conflict': return 'Ex: Guerra dos Três Tronos / Cerco de Valíria';
      case 'military_unit': return 'Ex: Legião de Ferro / Batalhão de Grifos do Sol';
      case 'currency': return 'Ex: Padrão Ouro Imperial / Fragmentos de Cristal Astral / Escambo de Peles';
      case 'trade_route': return 'Ex: Rota das Caravanas do Deserto / Mercado Negro de Porto Real';
      case 'beast': return 'Ex: Lobo Gigante / Pantera Deslocadora';
      case 'monster': return 'Ex: Dragão Vermelho Jovem / Observador (Beholder)';
      case 'flora': return 'Ex: Flor Solar Curativa / Cogumelo Luminescente das Profundezas';
      case 'magic_system': return 'Ex: Magia Rúnica Ancestral / Canalização Cósmica de Éter';
      case 'plane': return 'Ex: Plano das Sombras Reais / Dimensão das Nuvens Astral';
      case 'cosmology': return 'Ex: Mito da Grande Forja Elemental / Deuses Primordiais do Vazio';
      case 'quest': return 'Ex: O Segredo da Mina Abandonada / Resgate em Valíria / Caçada ao Basilisco';
    }
  };

  const getAttrLabel1 = () => {
    switch (category) {
      case 'npc': return 'Alinhamento / Papel:';
      case 'location': return 'População / Tipo de Local:';
      case 'faction': return 'Líder / Representante:';
      case 'religion': return 'Domínio Sagrado:';
      case 'lore_event': return 'Era / Data Histórica:';
      case 'species': return 'Expectativa de Vida / Origem:';
      case 'ethnicity': return 'Valores Culturais / Idioma Principal:';
      case 'tradition': return 'Frequência / Época do Ano:';
      case 'profession': return 'Requisito / Classe Social:';
      case 'natural_law': return 'Região Afetada / Escala:';
      case 'spell': return 'Círculo / Escola de Magia:';
      case 'disease': return 'Forma de Contágio / Sintoma:';
      case 'item': return 'Raridade / Tipo de Item:';
      case 'material': return 'Região de Origem / Abundância:';
      case 'technology': return 'Fonte de Energia / Nível Tech:';
      case 'document': return 'Autor / Idioma Escrito:';
      case 'language': return 'Família Linguística / Alfabeto:';
      case 'military_conflict': return 'Comandantes / Facções Envolvidas:';
      case 'military_unit': return 'Tamanho da Força / Armamento:';
      case 'currency': return 'Taxa de Conversão / Material Base:';
      case 'trade_route': return 'Regiões Conectadas / Periculosidade:';
      case 'beast': return 'Nível de Perigo / Hábitat:';
      case 'monster': return 'Nível de Perigo / Hábitat:';
      case 'flora': return 'Propriedades Medicinais / Hábitat:';
      case 'magic_system': return 'Fonte de Poder / Custo ou Limitação:';
      case 'plane': return 'Acessibilidade / Leis Físicas:';
      case 'cosmology': return 'Era da Criação / Forças Primordiais:';
      case 'quest': return 'Dificuldade / Tipo da Missão:';
    }
  };

  const getAttrKey1 = () => {
    switch (category) {
      case 'npc': return 'alinhamento';
      case 'location': return 'populacao';
      case 'faction': return 'lider';
      case 'religion': return 'dominio';
      case 'lore_event': return 'era';
      case 'species': return 'expectativa_vida';
      case 'ethnicity': return 'valores';
      case 'tradition': return 'frequencia';
      case 'profession': return 'requisito';
      case 'natural_law': return 'plano';
      case 'spell': return 'escola_magia';
      case 'disease': return 'contagio';
      case 'item': return 'raridade';
      case 'material': return 'abundancia';
      case 'technology': return 'fonte_energia';
      case 'document': return 'autor';
      case 'language': return 'alfabeto';
      case 'military_conflict': return 'comandantes';
      case 'military_unit': return 'tamanho_forca';
      case 'currency': return 'conversao';
      case 'trade_route': return 'periculosidade';
      case 'beast': return 'nivel_perigo';
      case 'monster': return 'nivel_perigo';
      case 'flora': return 'propriedades';
      case 'magic_system': return 'fonte_poder';
      case 'plane': return 'acessibilidade';
      case 'cosmology': return 'forcas_primordiais';
      case 'quest': return 'dificuldade_tipo';
    }
  };

  const getAttrLabel2 = () => {
    switch (category) {
      case 'npc': return 'Raça / Classe:';
      case 'location': return 'Clima & Terreno:';
      case 'faction': return 'Influência / Postura:';
      case 'religion': return 'Símbolo Sagrado:';
      case 'lore_event': return 'Impacto no Mundo:';
      case 'species': return 'Características Biológicas:';
      case 'ethnicity': return 'Vestimentas & Costumes:';
      case 'tradition': return 'Significado / Crença:';
      case 'profession': return 'Ferramentas / Equipamentos:';
      case 'natural_law': return 'Efeito nas Criaturas / Regra Física:';
      case 'spell': return 'Componentes Arcanos / Conjuração:';
      case 'disease': return 'Cura Conhecida / Efeito de Status:';
      case 'item': return 'Propriedades Mágicas / Efeito:';
      case 'material': return 'Uso Alquímico / Importação & Exportação:';
      case 'technology': return 'Fabricante / Complexidade:';
      case 'document': return 'Localização do Original / Status:';
      case 'language': return 'Nº de Falantes / Dificuldade:';
      case 'military_conflict': return 'Vencedor / Baixas Estimadas:';
      case 'military_unit': return 'Base Operacional / Especialidade:';
      case 'currency': return 'Região de Circulação / Aceitação:';
      case 'trade_route': return 'Principais Produtos / Guildas Envolvidas:';
      case 'beast': return 'Comportamento / Fraqueza:';
      case 'monster': return 'Comportamento / Fraqueza:';
      case 'flora': return 'Efeitos / Rara ou Comum:';
      case 'magic_system': return 'Regras Físicas / Consequências de Uso:';
      case 'plane': return 'Habitantes Primordiais / Clima:';
      case 'cosmology': return 'Verdade vs Lenda / Registros:';
      case 'quest': return 'Recompensas (XP / Ouro):';
    }
  };

  const getAttrKey2 = () => {
    switch (category) {
      case 'npc': return 'raca';
      case 'location': return 'clima';
      case 'faction': return 'influencia';
      case 'religion': return 'simbolo';
      case 'lore_event': return 'impacto';
      case 'species': return 'biologia';
      case 'ethnicity': return 'costumes';
      case 'tradition': return 'significado';
      case 'profession': return 'ferramentas';
      case 'natural_law': return 'efeito';
      case 'spell': return 'componentes';
      case 'disease': return 'cura';
      case 'item': return 'propriedades';
      case 'material': return 'uso';
      case 'technology': return 'fabricante';
      case 'document': return 'localizacao';
      case 'language': return 'falantes';
      case 'military_conflict': return 'vencedor';
      case 'military_unit': return 'especialidade';
      case 'currency': return 'circulacao';
      case 'trade_route': return 'produtos_guildas';
      case 'beast': return 'comportamento';
      case 'monster': return 'comportamento';
      case 'flora': return 'efeitos';
      case 'magic_system': return 'consequencias';
      case 'plane': return 'habitantes';
      case 'cosmology': return 'verdade_lenda';
      case 'quest': return 'recompensas';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in select-none">
      {/* Widescreen PC Modal Container */}
      <form onSubmit={handleSubmit} className="bg-[#121722] border-2 border-amber-500/50 rounded-2xl w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] px-6 py-4 border-b border-[#2a3449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                {activeWorld.title} • WORLD STUDIO
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">{getCategoryTitle()}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingEntity ? '✓ Salvar Alterações' : getSubmitButtonText()}</span>
            </button>
            <div className="h-8 w-px bg-[#2a3449] mx-1"></div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Category Dropdown Selector & AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Categoria de Worldbuilding:</span>
              </label>
              
              {/* AI Auto-Fill Button */}
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 text-xs font-bold rounded-lg transition-all shadow-inner group"
              >
                <Wand2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                <span>Gerar Textos com IA</span>
              </button>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorldEntityCategory)}
              className="w-full bg-[#0a0d14] border-2 border-[#2a3449] focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-amber-300 font-bold focus:outline-none transition-all cursor-pointer shadow-inner"
            >
              <optgroup label="Aventuras & Campanhas">
                <option value="quest">Missão & Quest (Objetivos & Recompensas)</option>
              </optgroup>
              <optgroup label="Economia & Comércio">
                <option value="currency">Sistemas Monetários & Moedas</option>
                <option value="trade_route">Rotas Comercial & Mercados</option>
                <option value="material">Recursos & Produtos de Exportação</option>
              </optgroup>
              <optgroup label="Bestiário & Natureza">
                <option value="monster">Monstro (Criatura / Bestiário)</option>
                <option value="beast">Fera & Besta (Predador / Montaria)</option>
                <option value="flora">Flora Extraordinária (Plantas Curativas / Fungos)</option>
                <option value="species">Espécie / Raça / Biologia</option>
              </optgroup>
              <optgroup label="Magia & Cosmologia">
                <option value="magic_system">Sistema de Magia (Regras & Limitações)</option>
                <option value="spell">Feitiço & Magia Individual</option>
                <option value="plane">Reino, Plano & Dimensão de Existência</option>
                <option value="cosmology">Cosmologia, Mitos & Deuses Primordiais</option>
                <option value="natural_law">Lei Natural / Fenômeno Físico</option>
                <option value="disease">Doença / Mutação / Condição</option>
              </optgroup>
              <optgroup label="Pessoas & Sociedades">
                <option value="npc">NPC / Personagem</option>
                <option value="faction">Facção / Guilda / Ordem Mercantil</option>
                <option value="religion">Religião / Culto Mortal</option>
                <option value="ethnicity">Etnia / Cultura / Povo</option>
                <option value="tradition">Tradição / Ritual / Festival</option>
                <option value="profession">Profissão / Título / Ocupação</option>
              </optgroup>
              <optgroup label="Geografia & Marcos">
                <option value="location">Geografia, Masmorras, Ruínas & Tavernas</option>
              </optgroup>
              <optgroup label="Material, Itens & Tecnologia">
                <option value="item">Item / Artefato Mágico</option>
                <option value="technology">Tecnologia / Veículo / Autômato</option>
              </optgroup>
              <optgroup label="História & Cronologia">
                <option value="lore_event">Lore & Eventos Marcantes / Eras</option>
                <option value="document">Documento / Registro / Tratado</option>
                <option value="language">Idioma / Dialeto / Runa</option>
                <option value="military_conflict">Conflito Militar / Guerra</option>
                <option value="military_unit">Unidade Militar / Exército</option>
              </optgroup>
            </select>
          </div>

          {/* Grid Row 1: Name & SubType Textarea Textboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome da Entidade:
              </label>
              <textarea
                rows={2}
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (aiWarningMessage) setAiWarningMessage(null);
                }}
                placeholder={getNamePlaceholder()}
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 font-bold focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Sub-tipo / Rótulo / Título:
              </label>
              <textarea
                rows={2}
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder="Ex: Lendário, Raro, Antigo, Secreto, Monarca, Cidade Portuária..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-sm text-slate-200 focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
              />
            </div>
          </div>

          {/* Dedicated Quest Tracker Form Fields when category === 'quest' */}
          {category === 'quest' && (
            <div className="p-4 bg-[#0a0d14]/90 border-2 border-amber-500/40 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Configuração da Missão / Quest
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Objetivos: {questObjectives.filter((o) => o.isCompleted).length}/{questObjectives.length} concluídos
                </span>
              </div>

              {/* Status, Dificuldade e Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Status da Missão:
                  </label>
                  <select
                    value={questStatus}
                    onChange={(e) => setQuestStatus(e.target.value as QuestStatus)}
                    className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="not_started">⚪ Não Iniciada / Disponível</option>
                    <option value="in_progress">🟡 Em Progresso</option>
                    <option value="completed">🟢 Concluída</option>
                    <option value="failed">🔴 Falhou</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Dificuldade Estimada:
                  </label>
                  <select
                    value={questDifficulty}
                    onChange={(e) => setQuestDifficulty(e.target.value as QuestDifficulty)}
                    className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="easy">🟢 Fácil</option>
                    <option value="medium">🟡 Média</option>
                    <option value="hard">🟠 Difícil</option>
                    <option value="deadly">🔴 Mortal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Tipo de Missão:
                  </label>
                  <select
                    value={questType}
                    onChange={(e) => setQuestType(e.target.value as QuestType)}
                    className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="main">⭐ Missão Principal</option>
                    <option value="side">📜 Missão Secundária</option>
                    <option value="faction">🛡️ Missão de Facção</option>
                    <option value="personal">👤 Missão Pessoal</option>
                  </select>
                </div>
              </div>

              {/* Recompensas: XP, PO e Itens */}
              <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Recompensas da Missão:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      ⭐ Recompensa em XP:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={questXpReward}
                      onChange={(e) => setQuestXpReward(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      🪙 Recompensa em Ouro (PO):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={questGoldReward}
                      onChange={(e) => setQuestGoldReward(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      🎁 Itens / Artefatos / Espólios:
                    </label>
                    <input
                      type="text"
                      value={questItemReward}
                      onChange={(e) => setQuestItemReward(e.target.value)}
                      placeholder="Ex: Poção de Cura, Mapa Antigo..."
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Vínculos: NPC Doador e Local de Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> NPC Doador da Missão:
                  </label>
                  <select
                    value={questGiverNpcId}
                    onChange={(e) => setQuestGiverNpcId(e.target.value)}
                    className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Nenhum NPC Vinculado --</option>
                    {worldEntities.filter((e) => e.category === 'npc').map((npc) => (
                      <option key={npc.id} value={npc.id}>{npc.name} {npc.subType ? `(${npc.subType})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Local de Destino / Masmorra:
                  </label>
                  <select
                    value={questTargetLocationId}
                    onChange={(e) => setQuestTargetLocationId(e.target.value)}
                    className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Nenhum Local Vinculado --</option>
                    {worldEntities.filter((e) => e.category === 'location').map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name} {loc.subType ? `(${loc.subType})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist Dinâmico de Objetivos */}
              <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Checklist de Objetivos:
                  </div>
                </div>

                {/* Lista de Objetivos */}
                <div className="space-y-1.5">
                  {questObjectives.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs italic">
                      Nenhum objetivo cadastrado ainda. Adicione abaixo o passo a passo da missão.
                    </div>
                  ) : (
                    questObjectives.map((obj, idx) => (
                      <div
                        key={obj.id}
                        className="flex items-center justify-between gap-2 p-2 bg-[#0a0d14] border border-[#2a3449] rounded-xl hover:border-amber-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={obj.isCompleted}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setQuestObjectives((prev) => prev.map((o, i) => (i === idx ? { ...o, isCompleted: checked } : o)));
                            }}
                            className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                          />
                          <span className={`text-xs font-sans truncate ${obj.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {obj.description}
                          </span>
                          {obj.optional && (
                            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-500/30 shrink-0">
                              Opcional
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuestObjectives((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 p-1 text-xs cursor-pointer"
                          title="Remover objetivo"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Adicionar Novo Objetivo */}
                <div className="flex gap-2 items-center pt-1 border-t border-[#2a3449]/60">
                  <input
                    type="text"
                    value={newObjectiveDesc}
                    onChange={(e) => setNewObjectiveDesc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!newObjectiveDesc.trim()) return;
                        setQuestObjectives((prev) => [
                          ...prev,
                          {
                            id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                            description: newObjectiveDesc.trim(),
                            isCompleted: false,
                            optional: newObjectiveOptional,
                          },
                        ]);
                        setNewObjectiveDesc('');
                        setNewObjectiveOptional(false);
                      }
                    }}
                    placeholder="Descrição do novo objetivo (ex: Resgatar o prisioneiro)..."
                    className="flex-1 bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                  <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 cursor-pointer shrink-0 select-none">
                    <input
                      type="checkbox"
                      checked={newObjectiveOptional}
                      onChange={(e) => setNewObjectiveOptional(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-cyan-500 cursor-pointer"
                    />
                    <span>Opcional</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newObjectiveDesc.trim()) return;
                      setQuestObjectives((prev) => [
                        ...prev,
                        {
                          id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                          description: newObjectiveDesc.trim(),
                          isCompleted: false,
                          optional: newObjectiveOptional,
                        },
                      ]);
                      setNewObjectiveDesc('');
                      setNewObjectiveOptional(false);
                    }}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer shrink-0"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tags Chips Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Etiquetas & Tags Personalizadas:</span>
              <span className="text-[10px] text-slate-500 font-normal">Pressione Enter ou vírgula para adicionar</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-[#0a0d14] border border-[#2a3449] focus-within:border-amber-500 rounded-xl min-h-[44px]">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((_, i) => i !== idx))}
                    className="hover:text-rose-400 font-bold ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const trimmed = tagInput.trim().replace(/^#/, '');
                    if (trimmed && !tags.includes(trimmed)) {
                      setTags((prev) => [...prev, trimmed]);
                      setTagInput('');
                    }
                  }
                }}
                placeholder={tags.length === 0 ? "Ex: nobreza, dragao, perigoso, quest..." : "Nova tag..."}
                className="bg-transparent text-xs text-slate-200 focus:outline-none flex-1 min-w-[120px]"
              />
            </div>
          </div>
          {/* Tabs Selector for Narrative vs. Stats */}
          {['npc', 'monster', 'beast'].includes(category) && (
            <div className="flex gap-2 border-b border-[#2a3449] pb-px">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'description'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Descrição Narrativa</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'stats'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ficha de Estatísticas</span>
              </button>
            </div>
          )}

          {(!['npc', 'monster', 'beast'].includes(category) || activeTab === 'description') ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Descrição Curta / Resumo Rápido:</span>
                  <span className="text-[10px] text-amber-400/80 font-mono font-normal">Digite @ para mencionar entidades</span>
                </label>
                <MentionTextarea
                  rows={3}
                  required
                  value={shortDesc}
                  worldEntities={worldEntities}
                  onChangeValue={(val) => {
                    setShortDesc(val);
                    if (aiWarningMessage) setAiWarningMessage(null);
                  }}
                  placeholder="Resumo de fácil leitura em poucas frases para consulta rápida. Digite @ para vincular NPCs, locais, monstros..."
                  className="font-serif leading-relaxed"
                />
              </div>

              {/* Grid Row 3: Dedicated NPC & Genealogy Panel vs. Dynamic Attribute Textboxes */}
              {category === 'npc' ? (
                <div className="space-y-4 p-4 bg-[#0a0d14]/90 border-2 border-amber-500/40 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Perfil de NPC & Dados Genealógicos
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Integrado com a Árvore Genealógica e LoreGraph
                    </span>
                  </div>

                  {/* Row 1: Raça, Classe, Alinhamento e Gênero */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Raça / Espécie:
                      </label>
                      <input
                        type="text"
                        value={npcRace}
                        onChange={(e) => setNpcRace(e.target.value)}
                        placeholder="Ex: Humano, Alto Elfo, Anão..."
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Classe / Ocupação / Papel:
                      </label>
                      <input
                        type="text"
                        value={npcClass}
                        onChange={(e) => setNpcClass(e.target.value)}
                        placeholder="Ex: Mago Eremita, Lorde, Comandante..."
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Alinhamento Moral:
                      </label>
                      <select
                        value={npcAlignment}
                        onChange={(e) => setNpcAlignment(e.target.value)}
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="Leal e Bom">Leal e Bom (Lawful Good)</option>
                        <option value="Neutro e Bom">Neutro e Bom (Neutral Good)</option>
                        <option value="Caótico e Bom">Caótico e Bom (Chaotic Good)</option>
                        <option value="Leal e Neutro">Leal e Neutro (Lawful Neutral)</option>
                        <option value="Neutro">Neutro Puro (True Neutral)</option>
                        <option value="Caótico e Neutro">Caótico e Neutro (Chaotic Neutral)</option>
                        <option value="Leal e Mau">Leal e Mau (Lawful Evil)</option>
                        <option value="Neutro e Mau">Neutro e Mau (Neutral Evil)</option>
                        <option value="Caótico e Mau">Caótico e Mau (Chaotic Evil)</option>
                        <option value="Não Alinhado">Não Alinhado (Unaligned)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Gênero:
                      </label>
                      <select
                        value={npcGender}
                        onChange={(e) => setNpcGender(e.target.value as any)}
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro / Indefinido</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Casa/Clã, Geração, Status de Vida e Eras */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Casa / Clã / Família Nobre:
                      </label>
                      <input
                        type="text"
                        value={npcHouseOrClan}
                        onChange={(e) => setNpcHouseOrClan(e.target.value)}
                        placeholder="Ex: Casa Eldoria, Clã Martelo de Ferro..."
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Geração (Tier Hierárquico):
                      </label>
                      <input
                        type="number"
                        value={npcGeneration}
                        onChange={(e) => setNpcGeneration(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Status de Vida:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNpcIsAlive(true)}
                          className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            npcIsAlive
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                              : 'bg-[#121824] hover:bg-slate-800 text-slate-400 border border-[#2a3449]'
                          }`}
                        >
                          <Heart className="w-3 h-3" />
                          <span>Vivo(a)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNpcIsAlive(false)}
                          className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            !npcIsAlive
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                              : 'bg-[#121824] hover:bg-slate-800 text-slate-400 border border-[#2a3449]'
                          }`}
                        >
                          <Skull className="w-3 h-3" />
                          <span>Falecido(a)</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 truncate" title="Nascimento (Ano/Era)">
                          Nascimento:
                        </label>
                        <input
                          type="text"
                          value={npcBirthEra}
                          onChange={(e) => setNpcBirthEra(e.target.value)}
                          placeholder="Ex: Ano 20 da 3ª Era"
                          className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 truncate" title="Morte (se falecido)">
                          Morte:
                        </label>
                        <input
                          type="text"
                          disabled={npcIsAlive}
                          value={npcIsAlive ? '' : npcDeathEra}
                          onChange={(e) => setNpcDeathEra(e.target.value)}
                          placeholder={npcIsAlive ? '-- Vivo --' : 'Ex: Ano 50 da 3ª Era'}
                          className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono focus:outline-none disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Linha de Sucessão e Distintivo Customizado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Posição na Linha de Sucessão:</span>
                      </label>
                      <select
                        value={npcSuccessionStatus}
                        onChange={(e) => setNpcSuccessionStatus(e.target.value)}
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="none">⚪ Nenhum / Cidadão Comum</option>
                        <option value="ruling">👑 Monarca / Líder Atual</option>
                        <option value="heir_apparent">🛡️ 1º Herdeiro Direto (Heir Apparent)</option>
                        <option value="heir_presumptive">⚔️ Linha de Sucessão (Heir Presumptive)</option>
                        <option value="claimant">🔥 Reivindicante / Pretendente ao Trono</option>
                        <option value="disinherited">❌ Deserdado(a)</option>
                        <option value="exiled">🚪 No Exílio</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Tag / Distintivo Customizado:
                      </label>
                      <input
                        type="text"
                        value={npcCustomBadge}
                        onChange={(e) => setNpcCustomBadge(e.target.value)}
                        placeholder="Ex: 👁️ Vidente Oculto, 💀 Assassinado, 🧙 Arquimago..."
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 4: Segredos do Mestre */}
                  <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Segredos do Personagem / Genealógicos (Visível apenas para o Mestre):</span>
                    </label>
                    <textarea
                      rows={2}
                      value={npcSecrets}
                      onChange={(e) => setNpcSecrets(e.target.value)}
                      placeholder="Segredos de linhagem, pactos proibidos, crimes ocultos ou revelações da campanha..."
                      className="w-full bg-[#0a0d14] border border-rose-900/60 focus:border-rose-500 rounded-xl p-2.5 text-xs text-rose-200 focus:outline-none resize-none font-serif leading-relaxed shadow-inner"
                    />
                  </div>
                </div>
              ) : (
                /* Grid Row 3: Dynamic Attribute Textboxes para outras categorias (Local, Facção, Item, etc.) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {getAttrLabel1()}
                    </label>
                    <textarea
                      rows={3}
                      value={extraAttr1}
                      onChange={(e) => setExtraAttr1(e.target.value)}
                      placeholder="Descreva detalhadamente o valor deste atributo..."
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner font-mono leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {getAttrLabel2()}
                    </label>
                    <textarea
                      rows={3}
                      value={extraAttr2}
                      onChange={(e) => setExtraAttr2(e.target.value)}
                      placeholder="Descreva detalhadamente o valor deste atributo..."
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner font-mono leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Row 4: Full Lore & Master Secrets Large Textarea Textbox with Wiki Preview Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Conteúdo Completo, Lore Detalhada & Segredos (Opcional):</span>
                  </label>
                  {fullContent && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewFullContent(!isPreviewFullContent)}
                      className="px-2 py-0.5 rounded-lg bg-[#161f30] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-[#2a3449] hover:border-amber-500/40 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {isPreviewFullContent ? (
                        <>
                          <Edit3 className="w-3 h-3 text-amber-400" />
                          <span>Modo Editor</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>Preview Wiki Links</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isPreviewFullContent && fullContent ? (
                  <div className="w-full min-h-[120px] bg-[#0a0d14] border border-amber-500/40 rounded-xl p-4 text-xs text-slate-200 font-serif leading-relaxed shadow-inner">
                    <WikiTextRenderer text={fullContent} worldEntities={worldEntities} />
                  </div>
                ) : (
                  <MentionTextarea
                    rows={5}
                    value={fullContent}
                    worldEntities={worldEntities}
                    onChangeValue={(val) => {
                      setFullContent(val);
                      if (aiWarningMessage) setAiWarningMessage(null);
                    }}
                    placeholder="Aprofundamento de história, regras de RPG, segredos do Mestre... Digite @ para linkar qualquer entidade ou magia/item."
                    className="font-serif leading-relaxed"
                  />
                )}
              </div>

              {/* Row 5: Connections & Relationships */}
              <div className="bg-[#0a0d14] border-2 border-[#2a3449] p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#2a3449] pb-3">
                  <Network className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Conexões na Lore</h4>
                    <p className="text-[11px] text-slate-400">Associe esta entidade a outras do mundo e defina a natureza da relação.</p>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {worldEntities.filter(e => e.id !== editingEntity?.id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhuma outra entidade encontrada neste mundo.</p>
                  ) : (
                    worldEntities.filter(e => e.id !== editingEntity?.id).map(entity => {
                      const existingConn = connections.find(c => c.targetId === entity.id);
                      const isConnected = !!existingConn;
                      
                      return (
                        <div key={entity.id} className={`flex items-center justify-between p-3 rounded-xl border ${isConnected ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#121824] border-[#2a3449]'}`}>
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input 
                              type="checkbox"
                              checked={isConnected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConnections([...connections, { targetId: entity.id, type: 'neutral' }]);
                                } else {
                                  setConnections(connections.filter(c => c.targetId !== entity.id));
                                }
                              }}
                              className="w-4 h-4 rounded bg-[#0a0d14] border-[#2a3449] text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${isConnected ? 'text-amber-400' : 'text-slate-300'}`}>{entity.name}</span>
                              <span className="text-[10px] text-slate-500 uppercase">{entity.category}</span>
                            </div>
                          </label>
                          
                          {isConnected && (
                            <select
                              value={existingConn.type}
                              onChange={(e) => {
                                const newType = e.target.value as ConnectionType;
                                setConnections(connections.map(c => c.targetId === entity.id ? { ...c, type: newType } : c));
                              }}
                              className="bg-[#0a0d14] border border-amber-500/30 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="neutral">Neutro / Relacionado</option>
                              <option value="allied">Aliado / Amigo</option>
                              <option value="hostile">Inimigo / Hostil</option>
                              <option value="family">Família / Sangue</option>
                              <option value="member">Membro / Pertence a</option>
                              <option value="location">Localizado em</option>
                            </select>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Row 6: Media Gallery & AI Generator Section (Nano Banana) */}
              <div className="bg-[#0a0d14] border-2 border-amber-500/30 p-5 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a3449] pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Galeria de Imagens & Conceito Visual</h4>
                      <p className="text-[11px] text-slate-400">Adicione uploads, URLs ou gere ilustrações por IA para esta entrada.</p>
                    </div>
                  </div>

                  {/* Upload & Add URL buttons */}
                  <div className="flex items-center gap-2">
                    <label className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] rounded-xl text-xs font-bold text-slate-200 cursor-pointer transition-all ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className={`w-3.5 h-3.5 text-amber-400 ${isUploadingImage ? 'animate-bounce' : ''}`} />
                      <span>{isUploadingImage ? 'Enviando...' : 'Upload de Arquivo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploadingImage} />
                    </label>
                  </div>
                </div>

                {/* AI Image Generation Panel */}
                <div className="bg-[#121824] border border-[#2a3449] p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-slate-200">Gerar Ilustração com IA</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">Modelo ativo:</span>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded font-bold">
                        {settings.imageModel || 'imagen-3.0-generate-002'}
                      </span>
                    </div>
                  </div>

                  {/* Style & Aspect Ratio Controls */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                    {/* Art Style Preset Dropdown */}
                    <div className="flex items-center gap-2 bg-[#0a0d14] p-2 rounded-lg border border-[#2a3449]/80 min-w-0">
                      <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono shrink-0">
                        Estilo RPG:
                      </span>
                      <select
                        value={selectedArtStyle}
                        onChange={(e) => setSelectedArtStyle(e.target.value)}
                        className="flex-1 min-w-0 bg-[#121824] border border-[#2a3449] focus:border-purple-500 rounded-md px-2.5 py-1 text-xs text-slate-100 font-bold focus:outline-none cursor-pointer truncate"
                      >
                        {RPG_IMAGE_STYLES.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Aspect Ratio Selector */}
                    <div className="flex items-center gap-1.5 flex-wrap bg-[#0a0d14] p-2 rounded-lg border border-[#2a3449]/80">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1 shrink-0">
                        Proporção:
                      </span>
                      {(
                        [
                          { id: '9:16', label: '9:16 Retrato', desc: 'Vertical / Celular' },
                          { id: '3:4', label: '3:4 Retrato', desc: 'Retrato Clássico' },
                          { id: '1:1', label: '1:1 Quadrado', desc: 'Avatar' },
                          { id: '4:3', label: '4:3 Paisagem', desc: 'Cenário Padrão' },
                          { id: '16:9', label: '16:9 Widescreen', desc: 'Cinemático' },
                        ] as const
                      ).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setAspectRatio(r.id); setIsCombatPinMode(false); setIsPortraitMode(false); }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all ${
                            aspectRatio === r.id && !isCombatPinMode && !isPortraitMode
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                              : 'bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449]'
                          }`}
                          title={r.desc}
                        >
                          {r.label}
                        </button>
                      ))}
                      {/* Combat Pin Button - Special mode */}
                      <button
                        type="button"
                        onClick={() => { setIsCombatPinMode(true); setIsPortraitMode(false); }}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
                          isCombatPinMode
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400 animate-pulse'
                            : 'bg-[#161c28] hover:bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400'
                        }`}
                        title="Gera imagem frontal em posição de combate com fundo branco (1:1), ideal para usar como pino/token no mapa 3D de batalha"
                      >
                        🎯 Pino de Combate
                      </button>
                      {/* Portrait / Porta-retrato Button - Special mode */}
                      <button
                        type="button"
                        onClick={() => { setIsPortraitMode(true); setIsCombatPinMode(false); }}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
                          isPortraitMode
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400 animate-pulse'
                            : 'bg-[#161c28] hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400'
                        }`}
                        title="Gera close-up do rosto do personagem (1:1), ideal para foto de perfil em lojas, mural de pistas, árvore genealógica e fichas"
                      >
                        👤 Porta-retrato
                      </button>
                    </div>

                    {/* Combat Pin Mode Info Banner */}
                    {isCombatPinMode && (
                      <div className="flex items-center gap-2.5 p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl animate-fade-in">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-emerald-200 block">
                            Modo Pino de Combate Ativo
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Gera o personagem de frente, em posição de combate, com fundo branco limpo (1:1). Ideal para token/pino no mapa 3D de batalha.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Portrait Mode Info Banner */}
                    {isPortraitMode && (
                      <div className="flex items-center gap-2.5 p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl animate-fade-in">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                          <Camera className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-cyan-200 block">
                            Modo Porta-retrato / Foto de Rosto Ativo (1:1)
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Gera um close-up focado no rosto e traços do personagem (1:1). Usado automaticamente em Lojas, Mural de Pistas, Árvore Genealógica e Fichas.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visual Consistency Anchor Banner */}
                  {images.length > 0 && (
                    <div className="flex items-center justify-between p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-500/50 bg-slate-900 flex-shrink-0 relative">
                          <img src={images[0]} alt="Referência da Capa" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/85 text-[7px] font-mono text-amber-300 text-center font-bold">
                            CAPA
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-purple-200 block truncate">
                            Consistência Visual de Personagem/Entidade
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            A capa (1ª foto) será usada como âncora de referência visual para manter traços, rosto e estética idênticos.
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer select-none ml-2 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={useCoverAsReference}
                          onChange={(e) => setUseCoverAsReference(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-[#0a0d14] border-slate-700"
                        />
                        <span className={`text-xs font-bold ${useCoverAsReference ? 'text-purple-300' : 'text-slate-500'}`}>
                          {useCoverAsReference ? 'Referência Ativa' : 'Desativada'}
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Description Required Alert Warning Banner */}
                  {aiWarningMessage && (
                    <div className="bg-rose-950/90 border border-rose-500/60 p-3 rounded-xl flex items-center gap-2.5 text-rose-200 text-xs font-semibold shadow-lg animate-pulse">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{aiWarningMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <textarea
                        rows={2}
                        value={extraPrompt}
                        onChange={(e) => setExtraPrompt(e.target.value)}
                        placeholder="Adicionar prompt de texto extra (Ex: pintura a óleo estilo dark fantasy, iluminação dramática, alta definição)..."
                        className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isGeneratingAiImage}
                      onClick={handleGenerateAiImage}
                      className="h-full min-h-[48px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-200" />
                      <span>{isGeneratingAiImage ? 'Gerando Imagem...' : 'Gerar Imagem com IA'}</span>
                    </button>
                  </div>
                </div>

                {/* Manual URL Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Cole a URL da imagem aqui (https://...)..."
                    className="flex-1 bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-300 font-bold text-xs rounded-xl"
                  >
                    + Adicionar URL
                  </button>
                </div>

                {/* Image Thumbnails Gallery */}
                {images.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                        Imagens da Galeria ({images.length})
                      </span>
                      <span className="text-[10px] text-amber-400/90 font-mono">
                        ⭐ Capa • 🎯 Pino • 👤 Retrato • 🔍 Zoom • ✨ Edição • 🗑️ Excluir
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square rounded-xl overflow-hidden border-2 border-amber-500/40 bg-[#0a0d14] cursor-pointer hover:border-amber-400 transition-all shadow-md"
                          onClick={() => {
                            setLightboxIndex(idx);
                            setLightboxOpen(true);
                          }}
                        >
                          <img src={imgUrl} alt={`Mídia ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          
                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-1.5 p-1.5 backdrop-blur-[2px]">
                            {/* Set as Cover Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCoverImage(idx);
                              }}
                              className={`p-1.5 rounded-lg shadow transition-all active:scale-95 ${
                                idx === 0
                                  ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300 pointer-events-none'
                                  : 'bg-amber-950/90 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/60'
                              }`}
                              title={idx === 0 ? 'Imagem já é a Capa Principal' : 'Definir como Capa Principal'}
                            >
                              <Star className={`w-3.5 h-3.5 ${idx === 0 ? 'fill-slate-950' : 'fill-amber-400/30'}`} />
                            </button>

                            {/* Set as Combat Pin Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCombatPinImage(idx);
                              }}
                              className={`p-1.5 rounded-lg shadow transition-all active:scale-95 ${
                                combatPinIndex === idx
                                  ? 'bg-emerald-500 text-slate-950 ring-1 ring-emerald-300'
                                  : 'bg-emerald-950/90 hover:bg-emerald-600 hover:text-white text-emerald-300 border border-emerald-500/60'
                              }`}
                              title={combatPinIndex === idx ? 'Desmarcar como Pino de Combate' : 'Definir como Pino de Combate (Token 3D)'}
                            >
                              <Target className="w-3.5 h-3.5" />
                            </button>

                            {/* Set as Portrait Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetPortraitImage(idx);
                              }}
                              className={`p-1.5 rounded-lg shadow transition-all active:scale-95 ${
                                portraitIndex === idx
                                  ? 'bg-cyan-500 text-slate-950 ring-1 ring-cyan-300'
                                  : 'bg-cyan-950/90 hover:bg-cyan-600 hover:text-white text-cyan-300 border border-cyan-500/60'
                              }`}
                              title={portraitIndex === idx ? 'Desmarcar como Porta-retrato' : 'Definir como Porta-retrato (Foto de Rosto 1:1)'}
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>

                            {/* Zoom Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(idx);
                                setLightboxOpen(true);
                              }}
                              className="p-1.5 bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-lg shadow transition-all active:scale-95"
                              title="Dar Zoom / Tela Cheia"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>

                            {/* AI Edit / Variation Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingImageIndex(idx);
                                setAiEditPrompt('');
                              }}
                              className="p-1.5 bg-purple-950/90 hover:bg-purple-600 text-purple-200 border border-purple-700/60 rounded-lg shadow transition-all active:scale-95"
                              title="Editar / Modificar com IA"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(idx);
                              }}
                              className="p-1.5 bg-rose-950/90 hover:bg-rose-600 text-rose-200 border border-rose-800/60 rounded-lg shadow transition-all active:scale-95"
                              title="Excluir Imagem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow font-mono pointer-events-none flex items-center gap-1 z-10">
                              <Star className="w-2.5 h-2.5 fill-slate-950" /> CAPA
                            </span>
                          )}
                          {combatPinIndex === idx && (
                            <span className="absolute top-1 right-1 bg-emerald-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow font-mono pointer-events-none flex items-center gap-1 z-10">
                              <Target className="w-2.5 h-2.5" /> PINO
                            </span>
                          )}
                          {portraitIndex === idx && (
                            <span className="absolute bottom-1 left-1 bg-cyan-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow font-mono pointer-events-none flex items-center gap-1 z-10">
                              <Camera className="w-2.5 h-2.5" /> RETRATO
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Stats sheet block */
            <div className="space-y-6 animate-fade-in pb-4">
              {/* Sheet Mode Selector Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a0d14] border border-[#2a3449] p-3.5 rounded-2xl shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                      <span>Modo da Ficha de Estatísticas</span>
                      {category === 'npc' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                          Recomendado: Ficha Completa
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {npcSheetMode === 'full'
                        ? 'Ficha Completa D&D 5e: Classes, Níveis, Inventário, Equipamentos com CA dinâmica, Magias e Perícias.'
                        : 'Bloco Rápido de Atributos: Estatísticas diretas estilo Monster Manual / SRD.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center bg-[#121824] p-1 rounded-xl border border-[#2a3449] shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setNpcSheetMode('full');
                      if (!npcCharacterSheet) {
                        const init = createEmptyCharacterSheet('dm', activeWorld?.id);
                        init.characterName = name || 'Novo NPC';
                        init.race = npcRace || 'Humano';
                        init.className = npcClass || 'Guerreiro';
                        init.alignment = npcAlignment || 'Neutro';
                        setNpcCharacterSheet(recalculateSheetDerivedStats(init));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      npcSheetMode === 'full'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Ficha Completa D&D 5e</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNpcSheetMode('statblock')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      npcSheetMode === 'statblock'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Bloco Simplificado</span>
                  </button>
                </div>
              </div>

              {npcSheetMode === 'full' ? (
                /* FULL D&D 5E CHARACTER SHEET DASHBOARD FOR NPCS */
                <div className="space-y-5 animate-fade-in">
                  {/* HERO BANNER & PRIMARY ACTIONS */}
                  <div className="bg-gradient-to-br from-[#121827] via-[#0d131f] to-[#0a0d14] border-2 border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#0b0f19] border-2 border-amber-500/40 overflow-hidden shrink-0 flex items-center justify-center shadow-lg relative group">
                          {images.length > 0 ? (
                            <img src={(portraitIndex !== null && images[portraitIndex]) ? images[portraitIndex] : images[0]} alt={name || 'NPC'} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-amber-400/60" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-slate-100 font-serif">
                              {name.trim() || npcCharacterSheet?.characterName || 'Personagem NPC'}
                            </h3>
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                              Nv. {npcCharacterSheet?.level || 1} • {npcCharacterSheet?.className || npcClass || 'Guerreiro'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {npcCharacterSheet?.race || npcRace || 'Humano'} {npcCharacterSheet?.subrace ? `(${npcCharacterSheet.subrace})` : ''} • {npcAlignment} • {npcCharacterSheet?.background || 'Antecedente Personalizado'}
                          </p>
                        </div>
                      </div>

                      {/* Primary Buttons */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setIsNpcWizardModalOpen(true)}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Wand2 className="w-4 h-4" />
                          <span>Assistente de Criação (Wizard)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!npcCharacterSheet) {
                              const init = createEmptyCharacterSheet('dm', activeWorld?.id);
                              init.characterName = name || 'Novo NPC';
                              init.race = npcRace || 'Humano';
                              init.className = npcClass || 'Guerreiro';
                              init.alignment = npcAlignment || 'Neutro';
                              init.avatarUrl = images[0] || '';
                              setNpcCharacterSheet(recalculateSheetDerivedStats(init));
                            }
                            setIsNpcSheetModalOpen(true);
                          }}
                          className="px-4 py-2.5 bg-[#162032] hover:bg-[#1f2d47] border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Abrir Ficha Completa (8 Abas)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* QUICK EQUIPMENT PRESETS TOOLBAR */}
                  <div className="bg-[#0a0d14] border border-[#2a3449] p-4 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Kits Rápidos de Equipamento & Armas
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Aplica armas, armaduras e itens com 1 clique
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <select
                        value={selectedPresetKit}
                        onChange={(e) => setSelectedPresetKit(e.target.value)}
                        className="flex-1 bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none cursor-pointer"
                      >
                        {NPC_EQUIPMENT_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.icon} {preset.name} ({preset.category})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            let current = npcCharacterSheet;
                            if (!current) {
                              current = createEmptyCharacterSheet('dm', activeWorld?.id);
                              current.characterName = name || 'Novo NPC';
                              current.race = npcRace || 'Humano';
                              current.className = npcClass || 'Guerreiro';
                            }
                            const updated = applyNpcEquipmentPreset(current, selectedPresetKit, false);
                            setNpcCharacterSheet(updated);
                            setAc(updated.armorClass);
                            setHp(updated.currentHp);
                            setMaxHp(updated.maxHp);
                            setSpeed(updated.speed);
                            setStr(getEffectiveAttributeScore(updated, 'str'));
                            setDex(getEffectiveAttributeScore(updated, 'dex'));
                            setCon(getEffectiveAttributeScore(updated, 'con'));
                            setInt(getEffectiveAttributeScore(updated, 'int'));
                            setWis(getEffectiveAttributeScore(updated, 'wis'));
                            setCha(getEffectiveAttributeScore(updated, 'cha'));
                            if (updated.attacks && updated.attacks.length > 0) {
                              setActions(updated.attacks.map((atk) => ({
                                name: atk.name,
                                desc: `Ataque: ${atk.atkBonus} para acertar. Dano: ${atk.damage} (${atk.type || 'Físico'}).`
                              })));
                            }
                            const pName = NPC_EQUIPMENT_PRESETS.find(p => p.id === selectedPresetKit)?.name || 'Kit';
                            setPresetFeedback(`Kit "${pName}" equipado com sucesso! CA e Ataques recalculados.`);
                            setTimeout(() => setPresetFeedback(null), 4000);
                          }}
                          className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Equipar Kit no NPC</span>
                        </button>
                      </div>
                    </div>

                    {presetFeedback && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{presetFeedback}</span>
                      </div>
                    )}
                  </div>

                  {/* COMBAT VITALS & DERIVED STATS GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-[#0a0d14] border border-[#2a3449] p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-cyan-400" /> Classe Armadura (CA)
                      </span>
                      <span className="text-xl font-black text-cyan-300 font-mono">
                        {npcCharacterSheet?.armorClass || ac}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5 truncate max-w-full">
                        {npcCharacterSheet?.equippedArmor ? `${npcCharacterSheet.equippedArmor}` : 'Sem armadura'}
                        {npcCharacterSheet?.hasShield ? ' + Escudo' : ''}
                      </span>
                    </div>

                    <div className="bg-[#0a0d14] border border-[#2a3449] p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400" /> Pontos de Vida (PV)
                      </span>
                      <span className="text-xl font-black text-rose-400 font-mono">
                        {npcCharacterSheet?.currentHp || hp} / {npcCharacterSheet?.maxHp || maxHp}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Dados de Vida: {npcCharacterSheet?.hitDiceTotal || '1d8'}
                      </span>
                    </div>

                    <div className="bg-[#0a0d14] border border-[#2a3449] p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" /> Deslocamento
                      </span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        {npcCharacterSheet?.speed || speed}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Padrão D&D 5e
                      </span>
                    </div>

                    <div className="bg-[#0a0d14] border border-[#2a3449] p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Swords className="w-3 h-3 text-amber-400" /> Bônus Iniciativa
                      </span>
                      <span className="text-xl font-black text-amber-400 font-mono">
                        {npcCharacterSheet ? (
                          (() => {
                            const dexM = getAttributeModifier(npcCharacterSheet, 'dex');
                            return dexM >= 0 ? `+${dexM}` : `${dexM}`;
                          })()
                        ) : '+0'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Mod. Destreza
                      </span>
                    </div>

                    <div className="bg-[#0a0d14] border border-[#2a3449] p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Target className="w-3 h-3 text-indigo-400" /> Percepção Passiva
                      </span>
                      <span className="text-xl font-black text-indigo-300 font-mono">
                        {npcCharacterSheet ? (10 + getAttributeModifier(npcCharacterSheet, 'wis')) : 10}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        10 + Mod. SAB
                      </span>
                    </div>

                    <div className="bg-[#0a0d14] border border-[#2a3449] p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-400" /> Proficiência
                      </span>
                      <span className="text-xl font-black text-purple-300 font-mono">
                        +{npcCharacterSheet ? Math.floor(((npcCharacterSheet.level || 1) - 1) / 4) + 2 : 2}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Bônus de Batalha
                      </span>
                    </div>
                  </div>

                  {/* 6 ABILITY SCORES GRID */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                      Atributos Principais (D&D 5e)
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {(
                        [
                          { key: 'str', label: 'FOR (STR)', fallback: str },
                          { key: 'dex', label: 'DES (DEX)', fallback: dex },
                          { key: 'con', label: 'CON (CON)', fallback: con },
                          { key: 'int', label: 'INT (INT)', fallback: int },
                          { key: 'wis', label: 'SAB (WIS)', fallback: wis },
                          { key: 'cha', label: 'CAR (CHA)', fallback: cha },
                        ] as const
                      ).map(({ key, label, fallback }) => {
                        const val = npcCharacterSheet ? getEffectiveAttributeScore(npcCharacterSheet, key) : fallback;
                        const mod = Math.floor((val - 10) / 2);
                        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

                        return (
                          <div key={key} className="bg-[#0a0d14] border border-[#2a3449] p-3 rounded-xl flex flex-col items-center justify-between shadow-inner">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => {
                                const newScore = Math.max(1, Math.min(30, parseInt(e.target.value) || 10));
                                if (npcCharacterSheet) {
                                  const updated = {
                                    ...npcCharacterSheet,
                                    attributes: {
                                      ...npcCharacterSheet.attributes,
                                      [key]: { score: newScore, baseScore: newScore }
                                    }
                                  };
                                  const recalced = recalculateSheetDerivedStats(updated);
                                  setNpcCharacterSheet(recalced);
                                  setAc(recalced.armorClass);
                                  setHp(recalced.currentHp);
                                  setMaxHp(recalced.maxHp);
                                }
                                if (key === 'str') setStr(newScore);
                                if (key === 'dex') setDex(newScore);
                                if (key === 'con') setCon(newScore);
                                if (key === 'int') setInt(newScore);
                                if (key === 'wis') setWis(newScore);
                                if (key === 'cha') setCha(newScore);
                              }}
                              className="w-16 bg-[#121722] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2 py-1 text-center text-sm text-slate-100 font-bold focus:outline-none my-1.5"
                            />
                            <span className={`text-xs font-black font-mono ${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {modStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* WEAPONS & EQUIPMENT SUMMARY PREVIEW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Weapons & Attacks */}
                    <div className="bg-[#0a0d14] border border-[#2a3449] p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
                        <div className="flex items-center gap-2">
                          <Swords className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            Ataques & Armas Equipadas
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {npcCharacterSheet?.attacks?.length || 0} ataque(s)
                        </span>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {(!npcCharacterSheet?.attacks || npcCharacterSheet.attacks.length === 0) ? (
                          <p className="text-xs text-slate-500 italic">Nenhuma arma equipada. Use um Kit Rápido acima ou abra a Ficha Completa.</p>
                        ) : (
                          npcCharacterSheet.attacks.map((atk, idx) => (
                            <div key={idx} className="bg-[#121824] border border-[#2a3449] p-2.5 rounded-lg flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-amber-300 block">{atk.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Dano: {atk.damage} ({atk.type || 'Físico'})</span>
                              </div>
                              <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-xs font-mono font-bold">
                                {atk.atkBonus} Acerto
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Inventory Items Summary */}
                    <div className="bg-[#0a0d14] border border-[#2a3449] p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            Inventário & Itens ({npcCharacterSheet?.equipment?.length || 0})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsNpcSheetModalOpen(true)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        >
                          Gerenciar no Inventário →
                        </button>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {(!npcCharacterSheet?.equipment || npcCharacterSheet.equipment.length === 0) ? (
                          <p className="text-xs text-slate-500 italic">Nenhum item no inventário. Aplique um Kit ou adicione itens do SRD na Ficha Completa.</p>
                        ) : (
                          npcCharacterSheet.equipment.slice(0, 6).map((item, idx) => (
                            <div key={idx} className="bg-[#121824] border border-[#2a3449] p-2 rounded-lg flex items-center justify-between text-xs">
                              <span className={`font-semibold ${item.equipped ? 'text-cyan-300' : 'text-slate-300'}`}>
                                {item.equipped ? '🛡️ ' : ''}{item.name} {item.quantity > 1 ? `(${item.quantity}x)` : ''}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">{item.weight || '—'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* CLASSIC STATBLOCK EDITOR */
                <div className="space-y-6 animate-fade-in">
                  {/* Combat Values Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-[#0a0d14] border border-[#2a3449] p-4 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Classe de Armadura (CA):</label>
                      <input
                        type="number"
                        value={ac}
                        onChange={(e) => setAc(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#121722] border border-[#2a3449] focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PV Atuais (HP):</label>
                      <input
                        type="number"
                        value={hp}
                        onChange={(e) => setHp(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#121722] border border-[#2a3449] focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PV Máximos (Max HP):</label>
                      <input
                        type="number"
                        value={maxHp}
                        onChange={(e) => setMaxHp(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#121722] border border-[#2a3449] focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Velocidade (Speed):</label>
                      <input
                        type="text"
                        value={speed}
                        onChange={(e) => setSpeed(e.target.value)}
                        className="w-full bg-[#121722] border border-[#2a3449] focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ND (CR):</label>
                        <input
                          type="text"
                          value={cr}
                          onChange={(e) => setCr(e.target.value)}
                          className="w-full bg-[#121722] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2 py-2 text-sm text-slate-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">XP:</label>
                        <input
                          type="number"
                          value={xp}
                          onChange={(e) => setXp(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-[#121722] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2 py-2 text-sm text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ability Scores Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Atributos de Habilidade</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {[
                        { label: 'FOR (STR)', val: str, set: setStr },
                        { label: 'DES (DEX)', val: dex, set: setDex },
                        { label: 'CON (CON)', val: con, set: setCon },
                        { label: 'INT (INT)', val: int, set: setInt },
                        { label: 'SAB (WIS)', val: wis, set: setWis },
                        { label: 'CAR (CHA)', val: cha, set: setCha }
                      ].map((attr, idx) => {
                        const mod = Math.floor((attr.val - 10) / 2);
                        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                        return (
                          <div key={idx} className="bg-[#0a0d14] border border-[#2a3449] p-3 rounded-xl flex flex-col items-center justify-between shadow-inner">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{attr.label}</span>
                            <input
                              type="number"
                              value={attr.val}
                              onChange={(e) => attr.set(Math.max(1, Math.min(30, parseInt(e.target.value) || 0)))}
                              className="w-16 bg-[#121722] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2 py-1.5 text-center text-sm text-slate-100 font-bold focus:outline-none my-1.5"
                            />
                            <span className={`text-xs font-bold ${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{modStr}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Abilities & Actions Split Column */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Special Abilities */}
                    <div className="bg-[#0a0d14] border border-[#2a3449] p-4 rounded-xl space-y-4 flex flex-col">
                      <div className="border-b border-[#2a3449] pb-2 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Habilidades Especiais / Passivas</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{abilities.length}</span>
                      </div>
                      
                      {/* List */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-60 pr-1">
                        {abilities.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Nenhuma habilidade especial adicionada.</p>
                        ) : (
                          abilities.map((ab, idx) => (
                            <div key={idx} className="bg-[#121722] border border-[#2a3449] p-3 rounded-lg flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <span className="text-xs font-bold text-amber-400 block">{ab.name}</span>
                                <span className="text-[11px] text-slate-300 block mt-1 leading-relaxed">{ab.desc}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAbilities(prev => prev.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1 hover:bg-[#1a2234] rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Form to add */}
                      <div className="bg-[#121722] border border-[#2a3449] p-3 rounded-lg space-y-2">
                        <input
                          type="text"
                          placeholder="Nome da Habilidade (Ex: Percepção Cega)"
                          value={newAbilityName}
                          onChange={(e) => setNewAbilityName(e.target.value)}
                          className="w-full bg-[#0a0d14] border border-[#2a3449] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                        <textarea
                          placeholder="Descrição do Efeito..."
                          value={newAbilityDesc}
                          onChange={(e) => setNewAbilityDesc(e.target.value)}
                          rows={2}
                          className="w-full bg-[#0a0d14] border border-[#2a3449] rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newAbilityName.trim() || !newAbilityDesc.trim()) return;
                            setAbilities(prev => [...prev, { name: newAbilityName.trim(), desc: newAbilityDesc.trim() }]);
                            setNewAbilityName('');
                            setNewAbilityDesc('');
                          }}
                          className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Adicionar Habilidade
                        </button>
                      </div>
                    </div>

                    {/* Actions / Attacks */}
                    <div className="bg-[#0a0d14] border border-[#2a3449] p-4 rounded-xl space-y-4 flex flex-col">
                      <div className="border-b border-[#2a3449] pb-2 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ações / Ataques</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{actions.length}</span>
                      </div>
                      
                      {/* List */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-60 pr-1">
                        {actions.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Nenhuma ação ou ataque adicionado.</p>
                        ) : (
                          actions.map((ac, idx) => (
                            <div key={idx} className="bg-[#121722] border border-[#2a3449] p-3 rounded-lg flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <span className="text-xs font-bold text-amber-400 block">{ac.name}</span>
                                <span className="text-[11px] text-slate-300 block mt-1 leading-relaxed">{ac.desc}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActions(prev => prev.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1 hover:bg-[#1a2234] rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Form to add */}
                      <div className="bg-[#121722] border border-[#2a3449] p-3 rounded-lg space-y-2">
                        <input
                          type="text"
                          placeholder="Nome da Ação (Ex: Garra / Sopro de Fogo)"
                          value={newActionName}
                          onChange={(e) => setNewActionName(e.target.value)}
                          className="w-full bg-[#0a0d14] border border-[#2a3449] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                        <textarea
                          placeholder="Descrição do Ataque (Alvo, bônus, dano...)"
                          value={newActionDesc}
                          onChange={(e) => setNewActionDesc(e.target.value)}
                          rows={2}
                          className="w-full bg-[#0a0d14] border border-[#2a3449] rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newActionName.trim() || !newActionDesc.trim()) return;
                            setActions(prev => [...prev, { name: newActionName.trim(), desc: newActionDesc.trim() }]);
                            setNewActionName('');
                            setNewActionDesc('');
                          }}
                          className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Adicionar Ação
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lightbox / Zoom Carousel Modal */}
        <ImageLightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={images}
          initialIndex={lightboxIndex}
        />
        
        {/* AI Entity Generator Modal */}
        <WorldEntityAiGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          worldEntities={worldEntities}
          currentEntityId={editingEntity?.id}
          categoryContext={{
            categoryTitle: getCategoryTitle(),
            namePlaceholder: getNamePlaceholder(),
            attr1Label: getAttrLabel1(),
            attr2Label: getAttrLabel2()
          }}
          onApply={(data) => {
            setName(data.name || name);
            setSubType(data.subType || subType);
            setShortDesc(data.shortDesc || shortDesc);
            setFullContent(data.fullContent || fullContent);
            setExtraAttr1(data.extraAttr1 || extraAttr1);
            setExtraAttr2(data.extraAttr2 || extraAttr2);
            // We do not overwrite images here.
          }}
        />

        {/* AI Image Edit / Transform Modal */}
        {editingImageIndex !== null && images[editingImageIndex] && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-[#0e131f] border border-purple-500/50 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141a29]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/40">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Editar Imagem com IA
                    </h3>
                    <p className="text-xs text-slate-400">
                      Transforme ou altere detalhes visuais desta ilustração.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingImageIndex(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Source image preview */}
                <div className="flex items-center gap-3 p-3 bg-[#161c2b] border border-slate-800 rounded-xl">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-purple-500/30 bg-slate-900 flex-shrink-0">
                    <img
                      src={images[editingImageIndex]}
                      alt="Imagem Base"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-purple-300 block mb-0.5">Imagem de Origem #{editingImageIndex + 1}</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      A IA usará a composição e características desta imagem como base para aplicar suas alterações.
                    </p>
                  </div>
                </div>

                {/* Modification prompt textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Quais alterações você deseja aplicar? *
                  </label>
                  <textarea
                    rows={3}
                    value={aiEditPrompt}
                    onChange={(e) => setAiEditPrompt(e.target.value)}
                    placeholder="Ex: adicionar elmo com asas douradas, olhos brilhando em chamas arcanas, manto com capuz rasgado, cicatriz de batalha..."
                    className="w-full bg-[#121722] border border-[#2a3449] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Art Style Selector for Edited Image */}
                <div className="bg-[#121722] p-2.5 rounded-xl border border-[#2a3449] space-y-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Direção de Estilo Artístico RPG:
                    </span>
                  </div>
                  <select
                    value={editSelectedArtStyle}
                    onChange={(e) => setEditSelectedArtStyle(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none cursor-pointer"
                  >
                    {RPG_IMAGE_STYLES.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio Selector for Edited Image */}
                <div className="bg-[#121722] p-2.5 rounded-xl border border-[#2a3449]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Proporção da Imagem Gerada:
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/40 px-1.5 py-0.5 rounded">
                      {settings.imageModel || 'imagen-3.0-generate-002'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(
                      [
                        { id: '9:16', label: '9:16 Retrato' },
                        { id: '3:4', label: '3:4 Retrato' },
                        { id: '1:1', label: '1:1 Quadrado' },
                        { id: '4:3', label: '4:3 Paisagem' },
                        { id: '16:9', label: '16:9 Widescreen' },
                      ] as const
                    ).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setEditAspectRatio(r.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                          editAspectRatio === r.id
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                            : 'bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449]'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save mode */}
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editMode"
                      checked={editMode === 'add_new'}
                      onChange={() => setEditMode('add_new')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Adicionar como nova variação na galeria</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editMode"
                      checked={editMode === 'replace'}
                      onChange={() => setEditMode('replace')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Substituir imagem atual</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-800 bg-[#141a29]">
                <button
                  type="button"
                  onClick={() => setEditingImageIndex(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isGeneratingAiEdit || !aiEditPrompt.trim()}
                  onClick={handleGenerateAiEditImage}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all font-mono"
                >
                  {isGeneratingAiEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando Alteração...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gerar com Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated NPC Full Character Sheet Modal */}
        {isNpcSheetModalOpen && npcCharacterSheet && (
          <CharacterSheetModal
            isOpen={isNpcSheetModalOpen}
            sheet={npcCharacterSheet}
            onClose={() => setIsNpcSheetModalOpen(false)}
            onSave={(updatedSheet) => {
              const recalculated = recalculateSheetDerivedStats(updatedSheet);
              setNpcCharacterSheet(recalculated);
              setAc(recalculated.armorClass);
              setHp(recalculated.currentHp);
              setMaxHp(recalculated.maxHp);
              setSpeed(recalculated.speed);
              setStr(getEffectiveAttributeScore(recalculated, 'str'));
              setDex(getEffectiveAttributeScore(recalculated, 'dex'));
              setCon(getEffectiveAttributeScore(recalculated, 'con'));
              setInt(getEffectiveAttributeScore(recalculated, 'int'));
              setWis(getEffectiveAttributeScore(recalculated, 'wis'));
              setCha(getEffectiveAttributeScore(recalculated, 'cha'));
              if (recalculated.attacks && recalculated.attacks.length > 0) {
                setActions(
                  recalculated.attacks.map((atk) => ({
                    name: atk.name,
                    desc: `Ataque: ${atk.atkBonus} para acertar. Dano: ${atk.damage} (${atk.type || 'Físico'}).`,
                  }))
                );
              }
            }}
          />
        )}

        {/* Dedicated NPC Character Builder Wizard Modal */}
        {isNpcWizardModalOpen && (
          <CharacterBuilderWizardModal
            isOpen={isNpcWizardModalOpen}
            userId="dm"
            campaignId={activeWorld?.id}
            initialValues={{
              characterName: name.trim() || 'Novo NPC',
              race: npcRace.trim() || 'Humano',
              className: npcClass.trim() || 'Guerreiro',
              alignment: npcAlignment || 'Neutro',
            }}
            onClose={() => setIsNpcWizardModalOpen(false)}
            onCharacterCreated={(createdSheet) => {
              const recalculated = recalculateSheetDerivedStats(createdSheet);
              setNpcCharacterSheet(recalculated);
              setName(recalculated.characterName);
              setNpcRace(recalculated.race);
              setNpcClass(recalculated.className);
              setNpcAlignment(recalculated.alignment);
              setAc(recalculated.armorClass);
              setHp(recalculated.currentHp);
              setMaxHp(recalculated.maxHp);
              setSpeed(recalculated.speed);
              setStr(getEffectiveAttributeScore(recalculated, 'str'));
              setDex(getEffectiveAttributeScore(recalculated, 'dex'));
              setCon(getEffectiveAttributeScore(recalculated, 'con'));
              setInt(getEffectiveAttributeScore(recalculated, 'int'));
              setWis(getEffectiveAttributeScore(recalculated, 'wis'));
              setCha(getEffectiveAttributeScore(recalculated, 'cha'));
              if (recalculated.attacks && recalculated.attacks.length > 0) {
                setActions(
                  recalculated.attacks.map((atk) => ({
                    name: atk.name,
                    desc: `Ataque: ${atk.atkBonus} para acertar. Dano: ${atk.damage} (${atk.type || 'Físico'}).`,
                  }))
                );
              }
            }}
          />
        )}
      </form>
    </div>
  );
};
