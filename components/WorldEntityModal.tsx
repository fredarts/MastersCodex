'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, User, MapPin, Shield, Zap, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WorldEntityCategory } from '@/lib/types';

interface WorldEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: WorldEntityCategory;
}

export const WorldEntityModal: React.FC<WorldEntityModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'npc',
}) => {
  const { activeWorld, createWorldEntity } = useAuth();
  const [category, setCategory] = useState<WorldEntityCategory>(defaultCategory);
  const [name, setName] = useState('');
  const [subType, setSubType] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [extraAttr1, setExtraAttr1] = useState('');
  const [extraAttr2, setExtraAttr2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  if (!isOpen || !activeWorld) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const attributes: Record<string, any> = {};
    if (extraAttr1.trim()) attributes[getAttrKey1()] = extraAttr1;
    if (extraAttr2.trim()) attributes[getAttrKey2()] = extraAttr2;

    await createWorldEntity({
      worldId: activeWorld.id,
      category,
      name,
      subType: subType || undefined,
      status: 'active',
      shortDesc,
      fullContent: fullContent || undefined,
      attributes,
    });

    setIsSubmitting(false);
    setName('');
    setSubType('');
    setShortDesc('');
    setFullContent('');
    setExtraAttr1('');
    setExtraAttr2('');
    onClose();
  };

  // Dynamic Text Helpers per Category
  const getCategoryTitle = () => {
    switch (category) {
      case 'npc': return 'Adicionar Novo NPC / Personagem';
      case 'location': return 'Adicionar Nova Cidade, Reino ou Geografia';
      case 'faction': return 'Adicionar Nova Facção ou Guilda';
      case 'religion': return 'Adicionar Nova Religião, Deus ou Panteão';
      case 'lore_event': return 'Adicionar Novo Evento Histórico ou Lore';
    }
  };

  const getSubmitButtonText = () => {
    switch (category) {
      case 'npc': return '+ Adicionar NPC ao Mundo';
      case 'location': return '+ Adicionar Local ao Mundo';
      case 'faction': return '+ Adicionar Facção ao Mundo';
      case 'religion': return '+ Adicionar Religião ao Mundo';
      case 'lore_event': return '+ Adicionar Evento de Lore ao Mundo';
    }
  };

  const getNamePlaceholder = () => {
    switch (category) {
      case 'npc': return 'Ex: Rei Aris III / Kraag, o Devastador';
      case 'location': return 'Ex: Cidade Real de Valíria / Floresta das Sombras';
      case 'faction': return 'Ex: Guilda das Sombras / Ordem dos Cavaleiros de Prata';
      case 'religion': return 'Ex: Caminho dos Oito Deuses / Culto da Névoa';
      case 'lore_event': return 'Ex: A Queda do Império Solaria / A Guerra do Sol';
    }
  };

  const getSubTypePlaceholder = () => {
    switch (category) {
      case 'npc': return 'Ex: Monarca, Taverneiro, Arquimago, Mercenário';
      case 'location': return 'Ex: Capital, Cidade Portuária, Masmorra, Reino';
      case 'faction': return 'Ex: Sindicato de Ladrões, Ordem Religiosa, Aliança';
      case 'religion': return 'Ex: Panteão Principal, Culto Proibido, Religião Solitarista';
      case 'lore_event': return 'Ex: Grande Guerra, Cataclismo, Criação do Artefato';
    }
  };

  const getShortDescPlaceholder = () => {
    switch (category) {
      case 'npc': return 'Ex: Monarca idoso e precavido que tenta manter a paz a qualquer custo...';
      case 'location': return 'Ex: Capital majestosa cercada por muralhas brancas de mármore...';
      case 'faction': return 'Ex: Organização secreta operando nos subterrâneos da cidade...';
      case 'religion': return 'Ex: Culto dedicado à luz sagrada e proteção dos reinos do norte...';
      case 'lore_event': return 'Ex: Conflito secular que destruiu as antigas torres de conjuração...';
    }
  };

  const getAttrLabel1 = () => {
    switch (category) {
      case 'npc': return 'Alinhamento / Papel:';
      case 'location': return 'População Estimada:';
      case 'faction': return 'Líder / Representante:';
      case 'religion': return 'Domínio Sagrado:';
      case 'lore_event': return 'Era / Data Histórica:';
    }
  };

  const getAttrPlaceholder1 = () => {
    switch (category) {
      case 'npc': return 'Ex: Leal e Bom / Guarda Real';
      case 'location': return 'Ex: 45.000 habitantes';
      case 'faction': return 'Ex: Mestre Kraag';
      case 'religion': return 'Ex: Luz, Justiça & Guerra';
      case 'lore_event': return 'Ex: Ano 420 da Segunda Era';
    }
  };

  const getAttrKey1 = () => {
    switch (category) {
      case 'npc': return 'alinhamento';
      case 'location': return 'populacao';
      case 'faction': return 'lider';
      case 'religion': return 'dominio';
      case 'lore_event': return 'era';
    }
  };

  const getAttrLabel2 = () => {
    switch (category) {
      case 'npc': return 'Raça / Classe:';
      case 'location': return 'Clima & Terreno:';
      case 'faction': return 'Influência / Postura:';
      case 'religion': return 'Símbolo Sagrado:';
      case 'lore_event': return 'Impacto no Mundo:';
    }
  };

  const getAttrPlaceholder2 = () => {
    switch (category) {
      case 'npc': return 'Ex: Humano Guerreiro Nível 10';
      case 'location': return 'Ex: Frio e Montanhoso';
      case 'faction': return 'Ex: Alta / Hostil ao Rei';
      case 'religion': return 'Ex: Sol de Prata com Espada';
      case 'lore_event': return 'Ex: Divisão dos 4 Reinos';
    }
  };

  const getAttrKey2 = () => {
    switch (category) {
      case 'npc': return 'raca';
      case 'location': return 'clima';
      case 'faction': return 'influencia';
      case 'religion': return 'simbolo';
      case 'lore_event': return 'impacto';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">{getCategoryTitle()}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Categoria do Worldbuilding:</label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#0a0d14] rounded-lg border border-[#2a3449]">
              <button
                type="button"
                onClick={() => setCategory('npc')}
                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                  category === 'npc' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                NPC
              </button>
              <button
                type="button"
                onClick={() => setCategory('location')}
                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                  category === 'location' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Local
              </button>
              <button
                type="button"
                onClick={() => setCategory('faction')}
                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                  category === 'faction' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Facção
              </button>
              <button
                type="button"
                onClick={() => setCategory('religion')}
                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                  category === 'religion' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Religião
              </button>
              <button
                type="button"
                onClick={() => setCategory('lore_event')}
                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                  category === 'lore_event' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lore
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nome:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={getNamePlaceholder()}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Sub-tipo / Título:</label>
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder={getSubTypePlaceholder()}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição Curta / Resumo:</label>
            <input
              type="text"
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder={getShortDescPlaceholder()}
              className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-serif"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{getAttrLabel1()}</label>
              <input
                type="text"
                value={extraAttr1}
                onChange={(e) => setExtraAttr1(e.target.value)}
                placeholder={getAttrPlaceholder1()}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{getAttrLabel2()}</label>
              <input
                type="text"
                value={extraAttr2}
                onChange={(e) => setExtraAttr2(e.target.value)}
                placeholder={getAttrPlaceholder2()}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">História Detalhada & Segredos (Opcional):</label>
            <textarea
              rows={3}
              value={fullContent}
              onChange={(e) => setFullContent(e.target.value)}
              placeholder="Notas completas do Mestre sobre esta entidade para usar no jogo..."
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
              <span>{getSubmitButtonText()}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
