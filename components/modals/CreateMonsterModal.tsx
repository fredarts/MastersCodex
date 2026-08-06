'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { CustomMonster, CustomMonsterAction, CustomMonsterSpell } from '@/lib/types';
import { customMonsterService } from '@/lib/services/customMonsterService';
import { storageService } from '@/lib/services/storageService';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { toast } from 'sonner';

interface CreateMonsterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMonsterCreated: (monster: CustomMonster) => void;
  initialMonster?: Partial<CustomMonster>;
}

export const CreateMonsterModal: React.FC<CreateMonsterModalProps> = ({
  isOpen,
  onClose,
  onMonsterCreated,
  initialMonster,
}) => {
  const { settings } = useUserSettings();
  const [activeTab, setActiveTab] = useState<'token' | 'stats' | 'actions' | 'lore'>('token');

  // Form State
  const [name, setName] = useState(initialMonster?.name || '');
  const [type, setType] = useState(initialMonster?.type || 'Monstruosidade');
  const [size, setSize] = useState<any>(initialMonster?.size || 'Médio');
  const [alignment, setAlignment] = useState(initialMonster?.alignment || 'Neutro');
  const [cr, setCr] = useState(initialMonster?.cr || '1');
  const [xp, setXp] = useState(initialMonster?.xp || 200);

  // Stats
  const [ac, setAc] = useState(initialMonster?.ac || 13);
  const [hp, setHp] = useState(initialMonster?.hp || 22);
  const [speed, setSpeed] = useState(initialMonster?.speed || '9m');

  // Attributes
  const [str, setStr] = useState(initialMonster?.str || 14);
  const [dex, setDex] = useState(initialMonster?.dex || 12);
  const [con, setCon] = useState(initialMonster?.con || 14);
  const [int, setInt] = useState(initialMonster?.int || 6);
  const [wis, setWis] = useState(initialMonster?.wis || 10);
  const [cha, setCha] = useState(initialMonster?.cha || 6);

  // Token Config
  const [tokenType, setTokenType] = useState<'billboard' | '3d'>(initialMonster?.tokenType || 'billboard');
  const [tokenImageUrl, setTokenImageUrl] = useState(initialMonster?.tokenImageUrl || '');
  const [modelUrl, setModelUrl] = useState(initialMonster?.modelUrl || '');

  // Lore & Text
  const [description, setDescription] = useState(initialMonster?.description || '');
  const [lore, setLore] = useState(initialMonster?.lore || '');

  // Dynamic Lists
  const [abilities, setAbilities] = useState<{ name: string; desc: string }[]>(
    initialMonster?.abilities || [{ name: 'Visão no Escuro', desc: 'Consegue enxergar na penumbra a até 18 metros.' }]
  );
  const [actions, setActions] = useState<CustomMonsterAction[]>(
    initialMonster?.actions || [
      { name: 'Garra', attackBonus: 4, damage: '1d6 + 2 de dano cortante', desc: 'Ataque corpo a corpo com arma: +4 para atingir, alcance 1,5m, um alvo.' },
    ]
  );
  const [spells, setSpells] = useState<CustomMonsterSpell[]>(initialMonster?.spells || []);

  // AI & Upload Loading States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const calcMod = (val: number) => {
    const mod = Math.floor((val - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
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
    const imagePromptText = aiPrompt.trim() || `Full body illustration of ${name || 'fantasy monster'}, transparent isolated background, D&D 5e creature concept art`;
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
        throw new Error(data.error || 'Erro na resposta da IA.');
      }

      if (data.name) setName(data.name);
      if (data.type) setType(data.type);
      if (data.size) setSize(data.size);
      if (data.alignment) setAlignment(data.alignment);
      if (data.cr) setCr(data.cr);
      if (data.xp) setXp(data.xp);
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
      const saved = await customMonsterService.saveCustomMonster({
        id: initialMonster?.id,
        name: name.trim(),
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
      });

      onMonsterCreated(saved);
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Criar Novo Monstro Customizado</h2>
              <p className="text-xs text-zinc-400">Crie pinos Billboard PNG transparentes ou modelos 3D com auxílio de IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
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
            placeholder="Ex: Dragão de Cristal Caótico com asas de vidro e sopro de plasma..."
            className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
          />
          <button
            type="button"
            onClick={handleAutoFillWithAi}
            disabled={isGeneratingAi}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 text-xs font-bold rounded-lg hover:brightness-110 flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
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
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-4">
          <button
            onClick={() => setActiveTab('token')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'token'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Imagem & Pino 3D
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Estatísticas & Atributos
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'actions'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            Ações & Habilidades ({actions.length + abilities.length})
          </button>
          <button
            onClick={() => setActiveTab('lore')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
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
          {/* TAB 1: TOKEN & IMAGEM */}
          {activeTab === 'token' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Token Representation Mode Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-2">Estilo de Pino no Battle Grid</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTokenType('billboard')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                      tokenType === 'billboard'
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/5'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <div>
                      <span className="text-sm font-bold block">Pino Billboard 2D (PNG)</span>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        Imagem sem fundo que **sempre vira na direção do jogador** ao orbitar a câmera 3D
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTokenType('3d')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
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
                {/* Image Upload/Generate */}
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
                        className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-rose-600 hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
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
                      placeholder="https://exemplo.com/monstro.png"
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

                {/* Live Preview */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden bg-grid-pattern">
                  {tokenImageUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-36 h-36 relative flex items-center justify-center bg-black/40 rounded-full border border-rose-500/30 p-2 shadow-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {/* TAB 2: ESTATÍSTICAS E ATRIBUTOS */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Nome do Monstro *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Dragão de Fogo Ancião"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Tipo da Criatura</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Ex: Dragão, Morto-vivo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
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
                    placeholder="Ex: Caótico e Mau"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">ND (Challenge Rating)</label>
                  <input
                    type="text"
                    value={cr}
                    onChange={(e) => setCr(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">XP Concedido</label>
                  <input
                    type="number"
                    value={xp}
                    onChange={(e) => setXp(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-bold focus:outline-none focus:border-rose-500"
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
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
                    placeholder="Ex: 9m, voo 18m"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Atributos Principais (6 Stats) */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Atributos de Habilidade</h3>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { label: 'FOR', val: str, set: setStr },
                    { label: 'DES', val: dex, set: setDex },
                    { label: 'CON', val: con, set: setCon },
                    { label: 'INT', val: int, set: setInt },
                    { label: 'SAB', val: wis, set: setWis },
                    { label: 'CAR', val: cha, set: setCha },
                  ].map((item) => (
                    <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-center">
                      <span className="text-[10px] font-bold text-zinc-400 block">{item.label}</span>
                      <input
                        type="number"
                        value={item.val}
                        onChange={(e) => item.set(parseInt(e.target.value) || 10)}
                        className="w-full bg-transparent text-center font-bold text-sm text-zinc-100 focus:outline-none"
                      />
                      <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 inline-block mt-0.5">
                        {calcMod(item.val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AÇÕES E HABILIDADES */}
          {activeTab === 'actions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Habilidades Passivas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Habilidades Passivas & Traços</h3>
                  <button
                    type="button"
                    onClick={() => setAbilities([...abilities, { name: 'Nova Habilidade', desc: '' }])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
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
                          className="text-zinc-500 hover:text-rose-400 p-1"
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
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
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
                          value={act.attackBonus || 0}
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
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setActions(actions.filter((_, i) => i !== idx))}
                            className="text-zinc-500 hover:text-rose-400 p-1"
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

          {/* TAB 4: LORE & DESCRIÇÃO */}
          {activeTab === 'lore' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Aparência Física & Estética</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a aparência marcante da criatura, silhueta, olhos, armadura natural..."
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
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveMonster}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Salvar Monstro
          </button>
        </div>
      </div>
    </div>
  );
};
