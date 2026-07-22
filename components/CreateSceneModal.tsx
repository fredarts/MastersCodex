'use client';

import React, { useState } from 'react';
import { X, Plus, Sparkles, Swords, MessageSquare, Beer, Compass } from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';
import { useWorld } from '@/lib/hooks/useWorld';
import { SceneType, Combatant } from '@/lib/types';

interface CreateSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSceneModal: React.FC<CreateSceneModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeSession, createScene, scenes } = useSession();
  const { worldEntities } = useWorld();
  const [sceneType, setSceneType] = useState<SceneType>('social');
  const [title, setTitle] = useState('');
  const [npcName, setNpcName] = useState('');
  const [sensoryText, setSensoryText] = useState('');
  const [bgmCategory, setBgmCategory] = useState<'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao'>('taverna');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !activeSession) return null;

  const npcs = worldEntities.filter((e) => e.category === 'npc');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    let defaultCombatants: Combatant[] = [];
    if (sceneType === 'combat') {
      defaultCombatants = [
        { id: `m-${Date.now()}-1`, name: 'Líder Hobgoblin', type: 'monster', hp: 11, maxHp: 11, ac: 18, initiative: 14, conditions: [], cr: '1/2' },
        { id: `m-${Date.now()}-2`, name: 'Goblin Arqueiro', type: 'monster', hp: 7, maxHp: 7, ac: 15, initiative: 10, conditions: [], cr: '1/4' },
      ];
    }

    await createScene({
      sessionId: activeSession.id,
      orderIndex: scenes.length + 1,
      title: `${getTypeEmoji(sceneType)} ${title}`,
      sceneType,
      npcName: npcName || undefined,
      sensoryText: sensoryText || undefined,
      bgmCategory,
      bgmTracks: [`bgm-${bgmCategory}`],
      combatants: defaultCombatants,
    });

    setIsSubmitting(false);
    setTitle('');
    setNpcName('');
    setSensoryText('');
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">Criar Nova Cena para a {activeSession.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Cena Narrativa:</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSceneType('social');
                  setBgmCategory('taverna');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  sceneType === 'social'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Beer className="w-4 h-4 text-amber-400" />
                <span className="text-[11px]">🍺 Social / Taverna</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSceneType('dialogue');
                  setBgmCategory('tensao');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  sceneType === 'dialogue'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px]">🗣️ Diálogo NPC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSceneType('combat');
                  setBgmCategory('combate');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  sceneType === 'combat'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Swords className="w-4 h-4 text-rose-400" />
                <span className="text-[11px]">⚔️ Combate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSceneType('exploration');
                  setBgmCategory('masmorra');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  sceneType === 'exploration'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">🗺️ Exploração</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Título da Cena:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Chegada à Taverna do Dragão / Emboscada na Ponte"
              className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {sceneType === 'dialogue' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Vincular NPC do Mundo:</label>
              <select
                value={npcName}
                onChange={(e) => setNpcName(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">Selecione um NPC cadastrado no Mundo...</option>
                {npcs.map((npc) => (
                  <option key={npc.id} value={npc.name}>
                    {npc.name} ({npc.subType || 'NPC'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Trilha Sonora BGM Pré-Carregada:</label>
            <select
              value={bgmCategory}
              onChange={(e) => setBgmCategory(e.target.value as any)}
              className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="taverna">🍺 Taverna Acolhedora</option>
              <option value="combate">⚔️ Combate Épico</option>
              <option value="masmorra">🏰 Masmorra Sombria</option>
              <option value="tensao">⚡ Mistério & Tensão</option>
              <option value="exploracao">🌲 Exploração da Natureza</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Texto Sensorial para Ler em Voz Alta:</label>
            <textarea
              rows={3}
              value={sensoryText}
              onChange={(e) => setSensoryText(e.target.value)}
              placeholder="Ex: O som da chuva bate forte nas janelas de madeira. O taverneiro limpa uma caneca com olhar desconfiado..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-serif"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Cena à Sessão</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
