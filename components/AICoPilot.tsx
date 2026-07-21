'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Coins, 
  Copy, 
  Check, 
  Compass, 
  Crown,
  Save,
  Cpu
} from 'lucide-react';
import { BattleLog } from '@/components/BattleLog';
import { useWorld } from '@/context/WorldContext';
import { useSession } from '@/context/SessionContext';
import { useLiveCockpit } from '@/context/LiveCockpitContext';

interface AICoPilotProps {
  generatedLootResult?: string | null;
}

export const AICoPilot: React.FC<AICoPilotProps> = ({ generatedLootResult }) => {
  const [activeTab, setActiveTab] = useState<'refine' | 'generator' | 'loot' | 'log'>('refine');
  const [draftInput, setDraftInput] = useState('');
  const [aesthetic, setAesthetic] = useState('Sword and Sorcery, Sombrio e Cru');
  const [enhancedOutput, setEnhancedOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [appliedToScene, setAppliedToScene] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  // Smart Loot state
  const [lootCr, setLootCr] = useState('1/4 - 4');
  const [lootBiome, setLootBiome] = useState('Caverna Úmida / Masmorra');
  const [lootResultText, setLootResultText] = useState(generatedLootResult || '');

  // RAG Context Hooks
  const { activeWorld, worldEntities } = useWorld();
  const { activeScene, updateScene } = useSession();
  const { combatants } = useLiveCockpit();

  const handleEnhanceText = async () => {
    if (!draftInput.trim()) return;
    setIsGenerating(true);
    setAppliedToScene(false);

    try {
      const prompt = `Estética Desejada: [${aesthetic}]. Rascunho/Ideia do Mestre: "${draftInput}". Gere uma narração sensorial imersiva e completa para os jogadores.`;

      const response = await fetch('/api/ai/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          world: activeWorld,
          scene: activeScene,
          entities: worldEntities,
          combatants: combatants,
          actionType: 'narrate',
          userPrompt: prompt,
        }),
      });

      const data = await response.json();
      if (data.text) {
        setEnhancedOutput(data.text);
        if (data.provider) setActiveProvider(data.provider);
      } else {
        setEnhancedOutput('Erro ao gerar narração: ' + (data.error || 'Resposta inválida.'));
      }
    } catch (e: any) {
      setEnhancedOutput('Erro de conexão com o servidor de IA: ' + e?.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLoot = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Gere uma tabela detalhada de tesouros e saques (Loot) para o bioma "${lootBiome}" com Nível de Dificuldade (CR) "${lootCr}". Inclua moedas D&D 5e e itens mágicos/consumíveis.`;

      const response = await fetch('/api/ai/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          world: activeWorld,
          scene: activeScene,
          entities: worldEntities,
          combatants: combatants,
          actionType: 'loot',
          userPrompt: prompt,
        }),
      });

      const data = await response.json();
      if (data.text) {
        setLootResultText(data.text);
        if (data.provider) setActiveProvider(data.provider);
      }
    } catch (e: any) {
      setLootResultText('Erro ao gerar tesouro: ' + e?.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToActiveScene = async () => {
    if (!activeScene || !enhancedOutput) return;
    try {
      await updateScene({
        ...activeScene,
        sensoryText: enhancedOutput,
      });
      setAppliedToScene(true);
      setTimeout(() => setAppliedToScene(false), 2500);
    } catch (e) {
      console.error('Erro ao aplicar narração na cena:', e);
    }
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
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-purple-300">RAG Contextualizado</span>
              {activeProvider && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-purple-950/80 border border-purple-500/30 text-purple-300 rounded flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" />
                  {activeProvider}
                </span>
              )}
            </div>
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
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Gerando Narração IA...' : 'Aprimorar com Gemini/OpenRouter'}</span>
            </button>

            {enhancedOutput && (
              <div className="p-3 bg-[#0a0d14] border border-purple-500/30 rounded-xl relative group space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-purple-500/20">
                  <span className="text-[10px] uppercase font-bold text-purple-400 font-mono">
                    PROVADO & PRONTO PARA LER:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(enhancedOutput)}
                      className="p-1 text-slate-400 hover:text-purple-300 rounded"
                      title="Copiar texto"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {activeScene && (
                      <button
                        onClick={handleApplyToActiveScene}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                          appliedToScene
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/40'
                        }`}
                        title="Salvar narração na cena atual"
                      >
                        <Save className="w-3 h-3" />
                        <span>{appliedToScene ? 'Aplicado!' : 'Aplicar na Cena'}</span>
                      </button>
                    )}
                  </div>
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
                onClick={() => {
                  setDraftInput('Descreva uma taverna rústica no porto com rumores locais');
                  setActiveTab('refine');
                }}
                className="p-3 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-purple-500/40 rounded-xl text-left transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-amber-400 mb-1" />
                <div className="text-xs font-bold text-slate-200">Gerar Taverna</div>
                <div className="text-[10px] text-slate-500">Nome, clima & rumores</div>
              </button>

              <button
                onClick={() => {
                  setDraftInput('Descreva um NPC nobre com segredo sombrio');
                  setActiveTab('refine');
                }}
                className="p-3 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-purple-500/40 rounded-xl text-left transition-all cursor-pointer"
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
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>{isGenerating ? 'Gerando Loot...' : 'Gerar Tesouro Contextual'}</span>
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
