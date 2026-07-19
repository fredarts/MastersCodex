'use client';

import React, { useState, useEffect } from 'react';
import { X, Crown, Plus, Sparkles, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { World } from '@/lib/types';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWorldForCampaign?: World | null;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  selectedWorldForCampaign,
}) => {
  const { createCampaign, userWorlds, activeWorld } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [worldId, setWorldId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedWorldForCampaign) {
        setWorldId(selectedWorldForCampaign.id);
      } else if (activeWorld) {
        setWorldId(activeWorld.id);
      } else if (userWorlds.length > 0) {
        setWorldId(userWorlds[0].id);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    await createCampaign(title, worldId || undefined, description);
    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">Criar Nova Campanha de RPG</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Mundo Base (Worldbuilding):</label>
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-amber-400 absolute left-3" />
              <select
                value={worldId}
                onChange={(e) => setWorldId(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">Nenhum (Campanha Avulsa / One-Shot)</option>
                {userWorlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title} ({w.genre})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              A campanha herdará os mapas, NPCs e lore do mundo selecionado.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Título da Mesa/Campanha:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Campanha 1: A Queda do Império"
              className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição / Sinopse da Sessão:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Grupo de sexta-feira explorando as masmorras subterrâneas..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-serif"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs font-medium rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Iniciar Mesa de Jogo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
