'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Wand2,
  Image as ImageIcon,
  Shield,
  Heart,
  Zap,
  Plus,
  Trash2,
  BookOpen,
  Boxes,
  Loader2,
  Check,
  ShieldAlert,
  Copy,
} from 'lucide-react';
import { CustomMonster, CustomMonsterAction, CustomMonsterSpell, Combatant } from '@/lib/types';
import { customMonsterService } from '@/lib/services/customMonsterService';
import { storageService } from '@/lib/services/storageService';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { crToXp } from '@/lib/dnd5e-encounter-calculator';
import { DND5E_DAMAGE_TYPES } from '@/lib/dnd5e-damage-resolver';
import { toast } from 'sonner';

interface CreateMonsterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMonsterCreated: (monster: CustomMonster) => void;
  initialMonster?: Partial<CustomMonster> | Partial<Combatant>;
  activeCombatant?: Combatant | null;
  onUpdateCombatant?: (updatedCombatant: Combatant) => void;
}

export const CreateMonsterModal: React.FC<CreateMonsterModalProps> = ({
  isOpen,
  onClose,
  onMonsterCreated,
  initialMonster,
  activeCombatant,
  onUpdateCombatant,
}) => {
  const { settings } = useUserSettings();
  const [activeTab, setActiveTab] = useState<'token' | 'stats' | 'defenses' | 'actions' | 'lore'>('token');

  // Form State
  const [name, setName] = useState('');
  const [baseMonsterName, setBaseMonsterName] = useState('');
  const [variantTag, setVariantTag] = useState('');
  const [isCustomVariant, setIsCustomVariant] = useState(false);
  const [type, setType] = useState('Monstruosidade');
  const [size, setSize] = useState<any>('Médio');
  const [alignment, setAlignment] = useState('Neutro');
  const [cr, setCr] = useState('1');
  const [xp, setXp] = useState(200);

  // Stats
  const [ac, setAc] = useState(13);
  const [hp, setHp] = useState(22);
  const [speed, setSpeed] = useState('9m');

  // Attributes
  const [str, setStr] = useState(14);
  const [dex, setDex] = useState(12);
  const [con, setCon] = useState(14);
  const [int, setInt] = useState(6);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(6);

  // Defenses
  const [damageResistances, setDamageResistances] = useState<string[]>([]);
  const [damageImmunities, setDamageImmunities] = useState<string[]>([]);
  const [damageVulnerabilities, setDamageVulnerabilities] = useState<string[]>([]);
  const [conditionImmunities, setConditionImmunities] = useState<string[]>([]);

  // Token Config
  const [tokenType, setTokenType] = useState<'billboard' | '3d'>('billboard');
  const [tokenImageUrl, setTokenImageUrl] = useState('');
  const [modelUrl, setModelUrl] = useState('');

  // Lore & Text
  const [description, setDescription] = useState('');
  const [lore, setLore] = useState('');

  // Dynamic Lists
  const [abilities, setAbilities] = useState<{ name: string; desc: string }[]>([]);
  const [actions, setActions] = useState<CustomMonsterAction[]>([]);
  const [spells, setSpells] = useState<CustomMonsterSpell[]>([]);

  // Save targets
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [restoreFullHp, setRestoreFullHp] = useState(true);

  // AI & Upload Loading States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever modal is opened or initialMonster changes
  useEffect(() => {
    if (!isOpen) return;

    const source = (initialMonster || activeCombatant || {}) as any;
    const rawName = source.name || '';
    // Clean instance numbers like "Goblin (1)" or "Goblin 2"
    const cleanedBase = rawName.replace(/\s*\(\d+\)$/, '').replace(/\s+\d+$/, '').trim();

    let suggestedName = rawName;
    const isVariant = Boolean(source.isCustomVariant || source.baseMonsterName || (!source.id && cleanedBase));

    if (!source.id && cleanedBase) {
      suggestedName = `${cleanedBase} (Líder)`;
    } else if (cleanedBase) {
      suggestedName = cleanedBase;
    }

    setName(suggestedName || 'Novo Monstro');
    setBaseMonsterName(source.baseMonsterName || (isVariant ? cleanedBase : ''));
    setVariantTag(source.variantTag || (isVariant ? 'Líder' : ''));
    setIsCustomVariant(isVariant);

    setType(source.type || 'Monstruosidade');
    setSize(source.size || 'Médio');
    setAlignment(source.alignment || 'Neutro');

    const initialCr = String(source.cr || '1');
    setCr(initialCr);
    setXp(Number(source.xp) || crToXp(initialCr));

    setAc(Number(source.ac) || 13);
    setHp(Number(source.maxHp || source.hp) || 22);
    setSpeed(source.speed || '9m (30ft)');

    setStr(Number(source.str) || 10);
    setDex(Number(source.dex) || 10);
    setCon(Number(source.con) || 10);
    setInt(Number(source.int) || 10);
    setWis(Number(source.wis) || 10);
    setCha(Number(source.cha) || 10);

    setDamageResistances(Array.isArray(source.damageResistances) ? [...source.damageResistances] : []);
    setDamageImmunities(Array.isArray(source.damageImmunities) ? [...source.damageImmunities] : []);
    setDamageVulnerabilities(Array.isArray(source.damageVulnerabilities) ? [...source.damageVulnerabilities] : []);
    setConditionImmunities(Array.isArray(source.conditionImmunities) ? [...source.conditionImmunities] : []);

    const resolvedTokenType = source.tokenType || (source.tokenImageUrl ? 'billboard' : (source.modelUrl ? '3d' : 'billboard'));
    setTokenType(resolvedTokenType);
    setTokenImageUrl(source.tokenImageUrl || source.avatarUrl || '');
    setModelUrl(source.modelUrl || '');

    setDescription(source.description || '');
    setLore(source.lore || '');

    if (source.abilities && Array.isArray(source.abilities) && source.abilities.length > 0) {
      setAbilities([...source.abilities]);
    } else {
      setAbilities([{ name: 'Visão no Escuro', desc: 'Consegue enxergar na penumbra a até 18 metros.' }]);
    }

    if (source.actions && Array.isArray(source.actions) && source.actions.length > 0) {
      setActions(
        source.actions.map((act: any) => ({
          name: act.name || 'Ataque',
          attackBonus: act.attackBonus ?? 4,
          damage: act.damage || '1d6 + 2',
          desc: act.desc || '',
        }))
      );
    } else {
      setActions([
        {
          name: 'Ataque Corpo a Corpo',
          attackBonus: 4,
          damage: '1d6 + 2 de dano cortante',
          desc: 'Ataque corpo a corpo com arma: alcance 1,5m, um alvo.',
        },
      ]);
    }

    setSpells(Array.isArray(source.spells) ? [...source.spells] : []);
    setSaveToLibrary(true);
    setRestoreFullHp(true);
    setActiveTab('stats');
  }, [isOpen, initialMonster, activeCombatant]);

  if (!isOpen) return null;

  const calcMod = (val: number) => {
    const mod = Math.floor((val - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  // Handler for changing CR that automatically updates XP
  const handleCrChange = (newCr: string) => {
    setCr(newCr);
    const calculatedXp = crToXp(newCr);
    if (calculatedXp) {
      setXp(calculatedXp);
    }
  };

  // Toggle Defenses
  const handleToggleDefense = (
    typeKey: 'damageResistances' | 'damageImmunities' | 'damageVulnerabilities',
    dmgName: string
  ) => {
    const setterMap = {
      damageResistances: { state: damageResistances, set: setDamageResistances },
      damageImmunities: { state: damageImmunities, set: setDamageImmunities },
      damageVulnerabilities: { state: damageVulnerabilities, set: setDamageVulnerabilities },
    };

    const target = setterMap[typeKey];
    const exists = target.state.some((x) => x.toLowerCase() === dmgName.toLowerCase());
    if (exists) {
      target.set(target.state.filter((x) => x.toLowerCase() !== dmgName.toLowerCase()));
    } else {
      target.set([...target.state, dmgName]);
    }
  };

  // Upload local PNG file to Supabase Storage Bucket
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await storageService.uploadAsset(file, 'avatars');
      setTokenImageUrl(url);
      setTokenType('billboard');
      toast.success('Imagem enviada com sucesso!');
    } catch (err: any) {
      console.error('Erro no upload:', err);
      toast.error(err.message || 'Falha ao enviar arquivo de imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  // Generate Image via AI API and upload base64 blob to Supabase Storage
  const handleGenerateAiImage = async () => {
    const imagePromptText =
      aiPrompt.trim() ||
      `Full body illustration of ${name || 'fantasy monster'}, transparent isolated background, D&D 5e creature concept art`;
    try {
      setIsGeneratingImage(true);
      toast.info('Gerando imagem do monstro com IA...');

      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePromptText,
          userSettings: settings,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.base64) {
        throw new Error(data.error || 'Falha ao gerar imagem por IA.');
      }

      // Convert base64 to Blob File
      const byteCharacters = atob(data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const file = new File([blob], `ai-monster-${Date.now()}.png`, { type: 'image/png' });

      // Upload to bucket
      const uploadedUrl = await storageService.uploadAsset(file, 'avatars');
      setTokenImageUrl(uploadedUrl);
      setTokenType('billboard');
      toast.success('Imagem gerada e salva com sucesso!');
    } catch (err: any) {
      console.error('Erro ao gerar imagem:', err);
      toast.error(err?.message || 'Não foi possível gerar a imagem por IA.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Auto Fill entire monster sheet with AI
  const handleAutoFillWithAi = async () => {
    if (!aiPrompt.trim()) {
      toast.warning('Digite uma ideia ou descrição para o assistente de IA.');
      return;
    }

    try {
      setIsGeneratingAi(true);
      toast.info('Assistente de IA gerando estatísticas e história do monstro...');

      const res = await fetch('/api/ai/generate-monster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          userSettings: settings,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao gerar monstro por IA.');
      }

      if (data.name) setName(data.name);
      if (data.type) setType(data.type);
      if (data.size) setSize(data.size);
      if (data.alignment) setAlignment(data.alignment);
      if (data.cr) {
        setCr(data.cr);
        setXp(data.xp || crToXp(data.cr));
      }
      if (data.ac) setAc(data.ac);
      if (data.hp) setHp(data.hp);
      if (data.speed) setSpeed(data.speed);

      if (data.str != null) setStr(data.str);
      if (data.dex != null) setDex(data.dex);
      if (data.con != null) setCon(data.con);
      if (data.int != null) setInt(data.int);
      if (data.wis != null) setWis(data.wis);
      if (data.cha != null) setCha(data.cha);

      if (data.abilities && Array.isArray(data.abilities)) setAbilities(data.abilities);
      if (data.actions && Array.isArray(data.actions)) setActions(data.actions);
      if (data.spells && Array.isArray(data.spells)) setSpells(data.spells);
      if (data.description) setDescription(data.description);
      if (data.lore) setLore(data.lore);

      toast.success(`Ficha do monstro "${data.name || 'Customizado'}" gerada com IA!`);
      setActiveTab('stats');
    } catch (err: any) {
      console.error('Erro no assistente de IA:', err);
      toast.error(err?.message || 'Falha ao preencher com IA.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Submit & Save
  const handleSaveMonster = async () => {
    if (!name.trim()) {
      toast.warning('O nome do monstro é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);
      let savedMonster: CustomMonster | null = null;

      const monsterPayload = {
        id: (initialMonster as any)?.id,
        name: name.trim(),
        baseMonsterName: baseMonsterName.trim() || undefined,
        variantTag: variantTag.trim() || undefined,
        isCustomVariant: isCustomVariant || Boolean(baseMonsterName.trim()),
        type,
        size,
        alignment,
        cr,
        xp,
        ac,
        hp,
        maxHp: hp,
        speed,
        str,
        dex,
        con,
        int,
        wis,
        cha,
        tokenType,
        tokenImageUrl: tokenImageUrl.trim() || undefined,
        modelUrl: modelUrl.trim() || undefined,
        description,
        lore,
        abilities,
        actions,
        spells,
        damageResistances,
        damageImmunities,
        damageVulnerabilities,
        conditionImmunities,
      };

      if (saveToLibrary) {
        savedMonster = await customMonsterService.saveCustomMonster(monsterPayload);
        onMonsterCreated(savedMonster);
      }

      // If we are editing an active combatant from Live Cockpit
      if (activeCombatant && onUpdateCombatant) {
        const nextHp = restoreFullHp ? hp : Math.min(activeCombatant.hp, hp);
        const updatedCombatant: Combatant = {
          ...activeCombatant,
          name: name.trim(),
          ac,
          hp: nextHp,
          maxHp: hp,
          cr,
          size,
          speed,
          str,
          dex,
          con,
          int,
          wis,
          cha,
          tokenType,
          tokenImageUrl: tokenImageUrl.trim() || undefined,
          avatarUrl: tokenImageUrl.trim() || activeCombatant.avatarUrl,
          modelUrl: modelUrl.trim() || undefined,
          abilities,
          actions: actions.map((a) => ({ name: a.name, desc: a.desc || `${a.damage ? `Dano: ${a.damage}` : ''}` })),
          spells,
          damageResistances,
          damageImmunities,
          damageVulnerabilities,
          conditionImmunities,
          baseMonsterName: baseMonsterName.trim() || undefined,
          isCustomVariant: isCustomVariant || Boolean(baseMonsterName.trim()),
          variantTag: variantTag.trim() || undefined,
          customMonsterId: savedMonster?.id || activeCombatant.customMonsterId,
        };

        onUpdateCombatant(updatedCombatant);
        toast.success(`Combatente "${updatedCombatant.name}" atualizado no encontro!`);
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar monstro:', err);
      toast.error('Erro ao salvar o monstro.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-100">
                  {activeCombatant ? 'Tunar & Personalizar Criatura' : isCustomVariant ? 'Criar Variante Customizada' : 'Criar Monstro Customizado'}
                </h2>
                {baseMonsterName && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Base: {baseMonsterName}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Personalize estatísticas, ataques, defesas elementais e tokens para o Live Cockpit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Assistant Banner */}
        <div className="p-3 bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-zinc-950 border-b border-zinc-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ex: Torne este monstro um líder orc furioso com machado flamejante e grito de guerra..."
            className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
          />
          <button
            type="button"
            onClick={handleAutoFillWithAi}
            disabled={isGeneratingAi}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 text-xs font-bold rounded-lg hover:brightness-110 flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                Preencher com IA
              </>
            )}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'stats'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Estatísticas & Atributos
          </button>
          <button
            onClick={() => setActiveTab('defenses')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'defenses'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Defesas & Imunidades ({damageResistances.length + damageImmunities.length + damageVulnerabilities.length})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'actions'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            Ações & Habilidades ({actions.length + abilities.length})
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'token'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Token & Visual
          </button>
          <button
            onClick={() => setActiveTab('lore')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'lore'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Lore & Descrição
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ESTATÍSTICAS E ATRIBUTOS */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Nome do Monstro / Variante *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Goblin Líder, Dragão de Cristal Ancião"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Tipo da Criatura</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Ex: Humanoide (Goblinóide), Dragão"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Variante & Linhagem */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-amber-400 block mb-1">Monstro Base (Origem da Variante)</label>
                  <input
                    type="text"
                    value={baseMonsterName}
                    onChange={(e) => {
                      setBaseMonsterName(e.target.value);
                      setIsCustomVariant(Boolean(e.target.value));
                    }}
                    placeholder="Ex: Goblin, Orc, Esqueleto (Vazio para monstro único)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-purple-400 block mb-1">Tag / Especialidade da Variante</label>
                  <input
                    type="text"
                    value={variantTag}
                    onChange={(e) => setVariantTag(e.target.value)}
                    placeholder="Ex: Líder, Xamã, Campeão, Berserker"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Tamanho (D&D 5e)</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Miúdo">Miúdo (Tiny)</option>
                    <option value="Pequeno">Pequeno (Small)</option>
                    <option value="Médio">Médio (Medium)</option>
                    <option value="Grande">Grande (Large)</option>
                    <option value="Enorme">Enorme (Huge)</option>
                    <option value="Imenso">Imenso (Gargantuan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Alinhamento</label>
                  <input
                    type="text"
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    placeholder="Ex: Neutro e Mau"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Nível de Desafio (ND / CR)</label>
                  <input
                    type="text"
                    value={cr}
                    onChange={(e) => handleCrChange(e.target.value)}
                    placeholder="Ex: 1/4, 1/2, 2, 5"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">XP Concedido</label>
                  <input
                    type="number"
                    value={xp}
                    onChange={(e) => setXp(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              {/* Estatísticas Vitais */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-rose-400 flex items-center gap-1 mb-1">
                    <Heart className="w-3.5 h-3.5" /> Pontos de Vida (PV)
                  </label>
                  <input
                    type="number"
                    value={hp}
                    onChange={(e) => setHp(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-bold focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1">
                    <Shield className="w-3.5 h-3.5" /> Classe de Armadura (CA)
                  </label>
                  <input
                    type="number"
                    value={ac}
                    onChange={(e) => setAc(parseInt(e.target.value) || 10)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-bold focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1 mb-1">
                    <Zap className="w-3.5 h-3.5" /> Deslocamento
                  </label>
                  <input
                    type="text"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    placeholder="Ex: 9m (30ft), Voo 18m"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Atributos (6 Valores) */}
              <div>
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Atributos D&D 5e</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'FOR (Str)', val: str, set: setStr },
                    { label: 'DES (Dex)', val: dex, set: setDex },
                    { label: 'CON (Con)', val: con, set: setCon },
                    { label: 'INT (Int)', val: int, set: setInt },
                    { label: 'SAB (Wis)', val: wis, set: setWis },
                    { label: 'CAR (Cha)', val: cha, set: setCha },
                  ].map((attr) => (
                    <div key={attr.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                      <span className="text-[11px] font-bold text-zinc-400 block mb-1">{attr.label}</span>
                      <input
                        type="number"
                        value={attr.val}
                        onChange={(e) => attr.set(parseInt(e.target.value) || 10)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 text-center font-mono font-bold text-zinc-100 focus:outline-none focus:border-rose-500 text-sm"
                      />
                      <span className="text-[11px] font-mono text-rose-400 block mt-1 font-semibold">
                        {calcMod(attr.val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEFESAS ELEMENTAIS E IMUNIDADES */}
          {activeTab === 'defenses' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <h3 className="text-xs font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Configuração de Defesas D&D 5e
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Clique nos tipos de dano para alternar Resistências (metade do dano), Imunidades (0 dano) ou Vulnerabilidades (dano dobrado).
                </p>
              </div>

              {/* Resistências */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Resistências a Dano (50%)</span>
                  <span className="text-[10px] text-zinc-500">{damageResistances.length} selecionadas</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DND5E_DAMAGE_TYPES.map((dt) => {
                    const active = damageResistances.some((x) => x.toLowerCase() === dt.labelPt.toLowerCase());
                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => handleToggleDefense('damageResistances', dt.labelPt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {dt.labelPt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Imunidades */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Imunidades a Dano (0%)</span>
                  <span className="text-[10px] text-zinc-500">{damageImmunities.length} selecionadas</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DND5E_DAMAGE_TYPES.map((dt) => {
                    const active = damageImmunities.some((x) => x.toLowerCase() === dt.labelPt.toLowerCase());
                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => handleToggleDefense('damageImmunities', dt.labelPt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-500 text-zinc-950 border-indigo-400 shadow-md shadow-indigo-500/20'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {dt.labelPt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vulnerabilidades */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Vulnerabilidades a Dano (200%)</span>
                  <span className="text-[10px] text-zinc-500">{damageVulnerabilities.length} selecionadas</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DND5E_DAMAGE_TYPES.map((dt) => {
                    const active = damageVulnerabilities.some((x) => x.toLowerCase() === dt.labelPt.toLowerCase());
                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => handleToggleDefense('damageVulnerabilities', dt.labelPt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-rose-500 text-zinc-950 border-rose-400 shadow-md shadow-rose-500/20'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {dt.labelPt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AÇÕES & HABILIDADES */}
          {activeTab === 'actions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Características & Habilidades Passivas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Habilidades & Características</h3>
                  <button
                    type="button"
                    onClick={() => setAbilities([...abilities, { name: 'Nova Habilidade', desc: '' }])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Habilidade
                  </button>
                </div>

                <div className="space-y-3">
                  {abilities.map((ab, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={ab.name}
                          onChange={(e) => {
                            const updated = [...abilities];
                            updated[idx].name = e.target.value;
                            setAbilities(updated);
                          }}
                          placeholder="Nome da habilidade"
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-bold focus:outline-none focus:border-rose-500 flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setAbilities(abilities.filter((_, i) => i !== idx))}
                          className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={ab.desc}
                        onChange={(e) => {
                          const updated = [...abilities];
                          updated[idx].desc = e.target.value;
                          setAbilities(updated);
                        }}
                        placeholder="Descrição dos efeitos..."
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações & Ataques */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Ações & Ataques</h3>
                  <button
                    type="button"
                    onClick={() => setActions([...actions, { name: 'Novo Ataque', attackBonus: 4, damage: '1d8 + 2', desc: '' }])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Ação
                  </button>
                </div>

                <div className="space-y-3">
                  {actions.map((act, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={act.name}
                          onChange={(e) => {
                            const updated = [...actions];
                            updated[idx].name = e.target.value;
                            setActions(updated);
                          }}
                          placeholder="Nome do ataque"
                          className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-bold focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="number"
                          value={act.attackBonus ?? 0}
                          onChange={(e) => {
                            const updated = [...actions];
                            updated[idx].attackBonus = parseInt(e.target.value) || 0;
                            setActions(updated);
                          }}
                          placeholder="Bônus (+4)"
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={act.damage || ''}
                            onChange={(e) => {
                              const updated = [...actions];
                              updated[idx].damage = e.target.value;
                              setActions(updated);
                            }}
                            placeholder="Dano (ex: 2d6 + 3)"
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none flex-1 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setActions(actions.filter((_, i) => i !== idx))}
                            className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={act.desc}
                        onChange={(e) => {
                          const updated = [...actions];
                          updated[idx].desc = e.target.value;
                          setActions(updated);
                        }}
                        placeholder="Descrição do alcance e efeito..."
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TOKEN & VISUAL */}
          {activeTab === 'token' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Token Representation Mode Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-2">Estilo de Pino no Battle Grid</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTokenType('billboard')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                      tokenType === 'billboard'
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/5'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <div>
                      <span className="text-sm font-bold block">Pino Billboard 2D (PNG)</span>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        Imagem sem fundo que **sempre vira na direção da câmera** no grid 3D
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTokenType('3d')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                      tokenType === '3d'
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/5'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Boxes className="w-6 h-6" />
                    <div>
                      <span className="text-sm font-bold block">Modelo 3D (GLB)</span>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        Modelo 3D tridimensional com malha e textura completas em 360°
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Image Upload & AI Generator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Imagem PNG Transparente</label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-xs text-zinc-300 transition-colors">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Upload className="w-4 h-4 text-rose-400" />}
                        <span>{isUploading ? 'Enviando...' : 'Fazer Upload de PNG'}</span>
                        <input type="file" accept="image/png,image/webp,image/jpeg" onChange={handleFileUpload} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={handleGenerateAiImage}
                        disabled={isGeneratingImage}
                        className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-rose-600 hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                      >
                        {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Gerar com IA
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">URL Direta da Imagem</label>
                    <input
                      type="url"
                      value={tokenImageUrl}
                      onChange={(e) => setTokenImageUrl(e.target.value)}
                      placeholder="https://exemplo.com/monstro.png ou /assets/2d/Monstros/Goblin.png"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {tokenType === '3d' && (
                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">URL do Modelo 3D (GLB)</label>
                      <input
                        type="url"
                        value={modelUrl}
                        onChange={(e) => setModelUrl(e.target.value)}
                        placeholder="https://exemplo.com/monstro.glb"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Preview Box */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[180px]">
                  {tokenImageUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-28 h-28 relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/80 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 p-2 shadow-inner overflow-hidden">
                        <img
                          src={tokenImageUrl}
                          alt="Preview Monstro"
                          className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                        {tokenType === 'billboard' ? 'Pino Billboard PNG Pronto' : 'Modelo 3D Definido'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-zinc-600">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Nenhuma imagem enviada ainda</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Faça upload de um PNG transparente ou gere via IA</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LORE & DESCRIÇÃO */}
          {activeTab === 'lore' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Aparência Física & Estética</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a aparência marcante da criatura, silhueta, cicatrizes, armas..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Lore, Hábitos & Notas do Mestre</label>
                <textarea
                  value={lore}
                  onChange={(e) => setLore(e.target.value)}
                  placeholder="História de origem, táticas de combate, segredos e ganchos para a aventura..."
                  rows={6}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Options: Save to Library / HP options if in Combat */}
          <div className="flex items-center gap-4 text-xs text-zinc-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-0 cursor-pointer"
              />
              <span className="font-semibold text-zinc-200">Salvar na Biblioteca de Monstros Customizados</span>
            </label>

            {activeCombatant && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={restoreFullHp}
                  onChange={(e) => setRestoreFullHp(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-zinc-400">Restaurar PV cheio no combate</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveMonster}
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {activeCombatant ? 'Aplicar & Salvar Criatura' : 'Salvar Monstro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
