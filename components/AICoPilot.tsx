'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Feather, 
  MessageSquare, 
  Coins, 
  Copy, 
  Check, 
  Compass, 
  Crown,
  Database
} from 'lucide-react';
import { BattleLog } from '@/components/BattleLog';

interface AICoPilotProps {
  generatedLootResult?: string | null;
}

export const AICoPilot: React.FC<AICoPilotProps> = ({ generatedLootResult }) => {
  const [activeTab, setActiveTab] = useState<'refine' | 'generator' | 'loot' | 'log'>('refine');
  const [draftInput, setDraftInput] = useState('');
  const [aesthetic, setAesthetic] = useState('Sword and Sorcery, Sombrio e Cru');
  const [enhancedOutput, setEnhancedOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Smart Loot state
  const [lootCr, setLootCr] = useState('1/4 - 4');
  const [lootBiome, setLootBiome] = useState('Caverna Úmida / Masmorra');
  const [lootResultText, setLootResultText] = useState(generatedLootResult || '');

  const sampleDescriptions: Record<string, string> = {
    caverna: 'O cheiro impregnante de calcário úmido e musgo podre preenche o ar frio. O eco compassado de gotas d\'água ressoa nas paredes escuras de pedra vulcânica, enquanto sombras grotescas parecem se mover no limite da sua visão...',
    taverna: 'O calor sufocante da lareira central mistura-se ao odor acre de hidromel derramado e ensopado de javali. Canecas de estanho se chocam com estrépito enquanto mercenários de rostos marcados trocam sussurros desconfiados nas mesas de madeira carcomida...',
    castelo: 'Estandartes de veludo roído pelo tempo balançam suavemente com o vento uivante que passa pelas frestas das janelas ogivais. O chão de mármore refletivo ecoa cada passo com severidade real, sob o olhar silencioso de antigas armaduras de placas...'
  };

  const handleEnhanceText = () => {
    if (!draftInput.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      let text = '';
      if (draftInput.toLowerCase().includes('taverna')) text = sampleDescriptions.taverna;
      else if (draftInput.toLowerCase().includes('castelo')) text = sampleDescriptions.castelo;
      else text = sampleDescriptions.caverna;

      setEnhancedOutput(
        `[Estilo: ${aesthetic}]\n\n"${text}"`
      );
      setIsGenerating(false);
    }, 800);
  };

  const handleGenerateLoot = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = `💰 TEASOURO GERADO (${lootBiome} - CR ${lootCr}):
• 14 Moedas de Cobre (CP) enferrujadas e 8 Moedas de Prata (SP).
• 1x Adaga Tosca de Osso de Goblin (+1 Dano contra bestas).
• 2x Frascos com Cogumelo Luminescente (Emite luz azul suave por 1 hora).
• 1x Poção de Cura Menor (Recupera 2d4+2 HP).
• Um diário de paminho mofado contendo um mapa parcial do 2º nível da dungeon!`;

      setLootResultText(result);
      setIsGenerating(false);
    }, 600);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-80 lg:w-96 bg-[#0f141d] border-l border-[#2a3449] flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#2a3449] bg-[#161c28] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">IA Co-Mestre Narrativo</h3>
            <p className="text-[10px] text-purple-300">Assistente & Refinador (Gemini / RAG)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a3449] bg-[#0a0d14]">
        <button
          onClick={() => setActiveTab('refine')}
          className={`flex-1 py-2 text-[10px] font-semibold transition-all border-b-2 ${
            activeTab === 'refine'
              ? 'border-purple-400 text-purple-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Refinar
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex-1 py-2 text-[10px] font-semibold transition-all border-b-2 ${
            activeTab === 'generator'
              ? 'border-purple-400 text-purple-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Worldbuilder
        </button>
        <button
          onClick={() => setActiveTab('loot')}
          className={`flex-1 py-2 text-[10px] font-semibold transition-all border-b-2 ${
            activeTab === 'loot'
              ? 'border-purple-400 text-purple-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Smart Loot
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-2 text-[10px] font-semibold transition-all border-b-2 ${
            activeTab === 'log'
              ? 'border-amber-400 text-amber-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Log Partida
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'refine' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Estética da Narrativa:</label>
              <select
                value={aesthetic}
                onChange={(e) => setAesthetic(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Sword and Sorcery, Sombrio e Cru">Sword & Sorcery (Sombrio & Cru)</option>
                <option value="Alta Fantasia Heróica">Alta Fantasia Heróica</option>
                <option value="Terror Cósmico Eldritch">Terror Cósmico (Eldritch)</option>
                <option value="Mistério Investigativo Gritty">Mistério Investigativo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Rascunho Rápido do DM:</label>
              <textarea
                rows={3}
                value={draftInput}
                onChange={(e) => setDraftInput(e.target.value)}
                placeholder="Ex: uma caverna escura com agua pingando..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
              ></textarea>
            </div>

            <button
              onClick={handleEnhanceText}
              disabled={isGenerating || !draftInput.trim()}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Aprimorando...' : 'Aprimorar Descrição Sensorial'}</span>
            </button>

            {enhancedOutput && (
              <div className="p-3 bg-[#0a0d14] border border-purple-500/30 rounded-xl relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-purple-400">Pronto para Ler em Voz Alta:</span>
                  <button
                    onClick={() => copyToClipboard(enhancedOutput)}
                    className="p-1 text-slate-400 hover:text-purple-300 rounded"
                    title="Copiar texto"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic whitespace-pre-wrap font-serif">
                  {enhancedOutput}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Gere elementos de mundo instantâneos coerentes com a lore da campanha:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDraftInput('taverna rústica no porto')}
                className="p-3 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-purple-500/40 rounded-xl text-left transition-all"
              >
                <Compass className="w-4 h-4 text-amber-400 mb-1" />
                <div className="text-xs font-bold text-slate-200">Gerar Taverna</div>
                <div className="text-[10px] text-slate-500">Nome, clima & rumores</div>
              </button>

              <button
                onClick={() => setDraftInput('castelo real de mármore')}
                className="p-3 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-purple-500/40 rounded-xl text-left transition-all"
              >
                <Crown className="w-4 h-4 text-cyan-400 mb-1" />
                <div className="text-xs font-bold text-slate-200">Gerar NPC Único</div>
                <div className="text-[10px] text-slate-500">Aparência & segredo</div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'loot' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nível de Dificuldade (CR):</label>
              <select
                value={lootCr}
                onChange={(e) => setLootCr(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="1/4 - 4">ND 1/4 a 4 (Bando / Iniciantes)</option>
                <option value="5 - 10">ND 5 a 10 (Veteranos)</option>
                <option value="11 - 16">ND 11 a 16 (Lendários)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Bioma / Localização:</label>
              <input
                type="text"
                value={lootBiome}
                onChange={(e) => setLootBiome(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            <button
              onClick={handleGenerateLoot}
              disabled={isGenerating}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Coins className="w-4 h-4" />
              <span>Gerar Tesouro Contextual</span>
            </button>

            {(lootResultText || generatedLootResult) && (
              <div className="p-3 bg-[#0a0d14] border border-amber-500/30 rounded-xl">
                <p className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                  {lootResultText || generatedLootResult}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="h-full -m-4">
            <BattleLog logs={[]} />
          </div>
        )}
      </div>
    </div>
  );
};
