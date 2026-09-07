'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Sparkles,
  Command,
  X,
  Dice5,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Shield,
  Activity,
  BookOpen,
  ArrowRight,
  Flame,
  Skull,
  Backpack,
  AlertTriangle,
} from 'lucide-react';
import { useOmnibarShortcuts } from '@/lib/hooks/useOmnibarShortcuts';
import {
  evaluateOmnibarQuery,
  OmnibarActionItem,
  Dnd5eRuleSnippet,
  CONDITION_DETAILS,
} from '@/lib/omnibar-engine';
import { OmnibarItem } from './OmnibarItem';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useAudio } from '@/context/AudioContext';
import { useCampaign } from '@/context/CampaignContext';
import { useCampaignCalendar } from '@/context/CalendarContext';
import { useAuth } from '@/context/AuthContext';
import { parseDiceCommand } from '@/lib/chat-dice-parser';
import { SRDSpell, SRDMonster, SRDItem, ConditionType, CustomMonster } from '@/lib/types';
import { customMonsterService } from '@/lib/services/customMonsterService';
import { toast } from 'sonner';

interface DmCommandPaletteProps {
  onNavigateTab?: (tabKey: string) => void;
}

export const DmCommandPalette: React.FC<DmCommandPaletteProps> = ({ onNavigateTab }) => {
  const { isOpen, closeOmnibar, openOmnibar } = useOmnibarShortcuts();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Contextos da Aplicação
  const { user } = useAuth();
  const {
    combatants,
    setCombatants,
    updateCombatantState,
    currentTurnIndex,
    setCurrentTurnIndex,
    broadcastPlayerRoll,
    broadcastCombatLogEntry,
    setActiveXCardAlert,
    openSheet,
  } = useLiveCockpit();

  const {
    isPlayingBgm,
    activeBgm,
    pauseBgm,
    resumeBgm,
    isMuted,
    setIsMuted,
    playSfx,
  } = useAudio();

  const { activeCampaign, createFeedEvent } = useCampaign();
  const calendarContext = useCampaignCalendar();
  const [customMonsters, setCustomMonsters] = useState<CustomMonster[]>([]);

  // Foco automático e carregamento ao abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      customMonsterService.fetchCustomMonsters(activeCampaign?.id).then(setCustomMonsters).catch(() => {});
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, activeCampaign?.id]);

  // Lista de Itens Filtrados via Engine
  const items = useMemo(() => {
    return evaluateOmnibarQuery(query, {
      combatants,
      customMonsters,
      activeCampaignTitle: activeCampaign?.title,
      isPlayingBgm,
      activeBgmTitle: activeBgm?.name,
    });
  }, [query, combatants, customMonsters, activeCampaign, isPlayingBgm, activeBgm]);

  // Ajusta o índice selecionado quando a lista muda
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Scroll automático para manter o item selecionado visível
  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Execução de Ações
  const executeItem = useCallback(
    (item: OmnibarActionItem) => {
      if (!item) return;

      switch (item.handlerType) {
        case 'roll_dice': {
          const formula = item.payload?.formula || '1d20';
          const isSecret = Boolean(item.payload?.isSecret);
          const parsed = parseDiceCommand(`/roll ${formula}`);

          const total = parsed ? parsed.total : Math.floor(Math.random() * 20) + 1;
          const isCrit = parsed?.isCrit ?? (formula.includes('d20') && total >= 20);
          const isFail = parsed?.isFail ?? (formula.includes('d20') && total === 1);

          // Notifica a mesa e o log de combate
          broadcastPlayerRoll({
            id: `roll-${Date.now()}`,
            characterName: isSecret ? 'Dungeon Master (Secreto)' : 'Dungeon Master',
            playerName: 'Dungeon Master',
            rollType: 'custom',
            label: `Rolagem do Mestre (${formula})`,
            d20Roll: total,
            modifier: 0,
            diceFormula: formula,
            total: total,
            isCrit: isCrit,
            isFail: isFail,
            timestamp: new Date().toISOString(),
          });

          broadcastCombatLogEntry({
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            round: 1,
            actorId: user?.id || 'dm',
            actorName: 'Dungeon Master',
            eventType: 'system',
            description: `🎲 DM rolou ${formula}: **${total}** ${isSecret ? '(Secreto)' : ''}`,
          });

          toast.success(
            isSecret
              ? `Rolagem Secreta (${formula}): ${total}`
              : `Rolagem Pública (${formula}): ${total}`,
            {
              description: isCrit ? '💥 Acerto Crítico Natural!' : isFail ? '⚠️ Falha Crítica Natural!' : undefined,
            }
          );
          closeOmnibar();
          break;
        }

        case 'apply_condition': {
          const { combatantId, condition } = item.payload as { combatantId: string; condition: ConditionType };
          const combatant = combatants.find((c) => c.id === combatantId);
          if (combatant) {
            const currentConditions = combatant.conditions || [];
            if (!currentConditions.includes(condition)) {
              const updated = [...currentConditions, condition];
              updateCombatantState(combatantId, { conditions: updated });
              toast.success(`Condição [${condition}] aplicada em ${combatant.name}`);
            }
          }
          closeOmnibar();
          break;
        }

        case 'remove_condition': {
          const { combatantId, condition } = item.payload as { combatantId: string; condition: ConditionType };
          const combatant = combatants.find((c) => c.id === combatantId);
          if (combatant) {
            const updated = (combatant.conditions || []).filter((c) => c !== condition);
            updateCombatantState(combatantId, { conditions: updated });
            toast.info(`Condição [${condition}] removida de ${combatant.name}`);
          }
          closeOmnibar();
          break;
        }

        case 'apply_damage': {
          const { combatantId, combatantName } = item.payload;
          const combatant = combatants.find((c) => c.id === combatantId);
          if (combatant) {
            openSheet(combatant.id, combatant.type === 'player' ? 'pc' : 'monster', combatant.name, combatant);
            toast.info(`Painel de ${combatantName} aberto para ajuste de combate`);
          }
          closeOmnibar();
          break;
        }

        case 'audio_control': {
          const action = item.payload?.action;
          if (action === 'pause') {
            pauseBgm();
            toast.info('Trilha Sonora Pausada');
          } else if (action === 'resume') {
            resumeBgm();
            toast.success('Trilha Sonora Retomada');
          } else if (action === 'toggle_mute') {
            setIsMuted(!isMuted);
            toast.info(isMuted ? 'Áudio Reativado' : 'Áudio Silenciado');
          }
          closeOmnibar();
          break;
        }

        case 'audio_sfx': {
          const { sfxUrl, name } = item.payload;
          playSfx(sfxUrl);
          toast.success(`Efeito Sonoro Disparado: ${name}`);
          closeOmnibar();
          break;
        }

        case 'session_advance': {
          const action = item.payload?.action;
          if (action === 'next_turn') {
            if (combatants.length > 0) {
              const nextIndex = (currentTurnIndex + 1) % combatants.length;
              setCurrentTurnIndex(nextIndex);
              const nextCombatant = combatants[nextIndex];
              toast.success(`Turno Avançado: Vez de ${nextCombatant.name}!`);
            } else {
              toast.warning('Nenhum combatente ativo no rastreador de combate');
            }
          } else if (action === 'advance_time') {
            const hours = item.payload?.hours || 1;
            calendarContext?.advanceTime?.(hours * 60, item.payload?.label || `Avanço de ${hours}h`);
            toast.success(`Tempo Avançado: +${hours} hora(s) no relógio da campanha`);
          }
          closeOmnibar();
          break;
        }

        case 'trigger_xcard': {
          setActiveXCardAlert({
            id: `xcard-${Date.now()}`,
            campaignId: activeCampaign?.id || 'default-campaign',
            type: 'pause',
            senderName: 'Dungeon Master',
            isAnonymous: false,
            timestamp: Date.now(),
          });
          toast.error('⚠️ Alerta X-Card Ativado: Pausando a cena por segurança', {
            duration: 8000,
          });
          closeOmnibar();
          break;
        }

        case 'navigate_tab': {
          const tabKey = item.payload?.tabKey;
          if (tabKey && onNavigateTab) {
            onNavigateTab(tabKey);
            toast.info(`Navegando para: ${item.title.replace('Navegar: ', '')}`);
          }
          closeOmnibar();
          break;
        }

        case 'view_srd_spell':
        case 'view_srd_monster':
        case 'view_srd_item':
        case 'view_rule': {
          // O item já é exibido no preview lateral, apenas notifica ou copia
          toast.info(`Consultando: ${item.title}`);
          break;
        }

        default:
          closeOmnibar();
          break;
      }
    },
    [
      combatants,
      currentTurnIndex,
      user,
      isMuted,
      broadcastPlayerRoll,
      broadcastCombatLogEntry,
      updateCombatantState,
      openSheet,
      pauseBgm,
      resumeBgm,
      setIsMuted,
      playSfx,
      setCurrentTurnIndex,
      calendarContext,
      setActiveXCardAlert,
      onNavigateTab,
      closeOmnibar,
    ]
  );

  // Navegação por Teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length ? (prev + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length ? (prev - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        executeItem(items[selectedIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-preenchimento de atalhos rápidos
      if (items[selectedIndex]) {
        const item = items[selectedIndex];
        if (item.category === 'spell') setQuery('!m ');
        else if (item.category === 'monster') setQuery('!monstro ');
        else if (item.category === 'combatant') setQuery('@');
        else if (item.category === 'rule') setQuery('!regra ');
      }
    }
  };

  const selectedItem = items[selectedIndex] || null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={closeOmnibar}
    >
      <div
        className="w-full max-w-3xl bg-[#0b0f17] border border-amber-500/40 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Input da Omnibar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/50">
          <Search className="w-5 h-5 text-amber-400 shrink-0 ml-1 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite um comando, dado (ex: 1d20+5, /gmr), alvo (@goblin), magia (!m raio), regra..."
            className="w-full bg-transparent text-sm sm:text-base font-medium placeholder-slate-500 text-slate-100 focus:outline-none focus:ring-0"
          />
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
              Esc para fechar
            </kbd>
            <button
              onClick={closeOmnibar}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chips de Atalho de Prefixo Rápido */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 overflow-x-auto no-scrollbar">
          <span className="font-semibold text-slate-500 mr-1">Prefixos:</span>
          <button
            onClick={() => setQuery('/r ')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:text-amber-300 transition"
          >
            🎲 <span className="font-mono text-amber-400">/r</span> Dado
          </button>
          <button
            onClick={() => setQuery('/gmr ')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-purple-500/40 hover:text-purple-300 transition"
          >
            👁️ <span className="font-mono text-purple-400">/gmr</span> Secreto
          </button>
          <button
            onClick={() => setQuery('@')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 transition"
          >
            🛡️ <span className="font-mono text-emerald-400">@</span> Alvo
          </button>
          <button
            onClick={() => setQuery('!m ')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-orange-500/40 hover:text-orange-300 transition"
          >
            🔥 <span className="font-mono text-orange-400">!m</span> Magia
          </button>
          <button
            onClick={() => setQuery('!monstro ')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-red-500/40 hover:text-red-300 transition"
          >
            💀 <span className="font-mono text-red-400">!monstro</span> Monstro
          </button>
          <button
            onClick={() => setQuery('!regra ')}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:text-blue-300 transition"
          >
            📖 <span className="font-mono text-blue-400">!regra</span> Regra
          </button>
        </div>

        {/* Corpo: Lista de Resultados e Preview Lateral */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[60vh] min-h-[280px]">
          {/* Lista de Ações / Resultados */}
          <div
            ref={listRef}
            className={`p-2 space-y-1 overflow-y-auto ${
              selectedItem && ['spell', 'monster', 'rule', 'item'].includes(selectedItem.category)
                ? 'md:col-span-7 border-b md:border-b-0 md:border-r border-slate-800'
                : 'md:col-span-12'
            }`}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Command className="w-10 h-10 mb-3 opacity-30 text-amber-400" />
                <p className="text-sm font-medium">Nenhum comando ou resultado encontrado</p>
                <p className="text-xs text-slate-600 mt-1">
                  Tente digitar <span className="font-mono text-amber-400/80">1d20+5</span>, <span className="font-mono text-amber-400/80">!m bola de fogo</span> ou <span className="font-mono text-amber-400/80">@alvo</span>
                </p>
              </div>
            ) : (
              items.map((item, idx) => (
                <OmnibarItem
                  key={item.id}
                  item={item}
                  isSelected={idx === selectedIndex}
                  onSelect={() => setSelectedIndex(idx)}
                  onClick={() => executeItem(item)}
                />
              ))
            )}
          </div>

          {/* Painel de Preview Lateral (para Magias, Monstros, Regras e Itens) */}
          {selectedItem && ['spell', 'monster', 'rule', 'item'].includes(selectedItem.category) && (
            <div className="hidden md:flex md:col-span-5 p-4 bg-slate-950/70 flex-col overflow-y-auto text-xs text-slate-300">
              {/* Preview de Magia */}
              {selectedItem.category === 'spell' && selectedItem.payload && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <h4 className="font-bold text-sm text-slate-100">{selectedItem.payload.name}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div><strong className="text-slate-400">Nível:</strong> {selectedItem.payload.level === 0 ? 'Truque' : `${selectedItem.payload.level}º`}</div>
                    <div><strong className="text-slate-400">Escola:</strong> {selectedItem.payload.school}</div>
                    <div><strong className="text-slate-400">Tempo:</strong> {selectedItem.payload.castingTime}</div>
                    <div><strong className="text-slate-400">Alcance:</strong> {selectedItem.payload.range}</div>
                    <div><strong className="text-slate-400">Duração:</strong> {selectedItem.payload.duration}</div>
                    <div>
                      <strong className="text-slate-400">Componentes:</strong>{' '}
                      {typeof selectedItem.payload.components === 'string'
                        ? selectedItem.payload.components
                        : selectedItem.payload.components?.raw ||
                          [
                            selectedItem.payload.components?.verbal ? 'V' : null,
                            selectedItem.payload.components?.somatic ? 'S' : null,
                            selectedItem.payload.components?.material ? 'M' : null,
                          ]
                            .filter(Boolean)
                            .join(', ') || 'Nenhum'}
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-line">
                    {selectedItem.payload.description}
                  </p>
                  {selectedItem.payload.classes && (
                    <div className="text-[10px] text-slate-400">
                      <strong>Classes:</strong> {selectedItem.payload.classes.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Preview de Monstro */}
              {selectedItem.category === 'monster' && selectedItem.payload && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="flex items-center gap-2">
                    <Skull className="w-4 h-4 text-red-400" />
                    <h4 className="font-bold text-sm text-slate-100">{selectedItem.payload.name}</h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60 ml-auto">
                      ND {selectedItem.payload.cr}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center font-mono">
                    <div><span className="text-slate-500 block text-[9px]">CA</span><strong className="text-emerald-400">{selectedItem.payload.ac}</strong></div>
                    <div><span className="text-slate-500 block text-[9px]">PV</span><strong className="text-red-400">{selectedItem.payload.hp}</strong></div>
                    <div><span className="text-slate-500 block text-[9px]">VELOCIDADE</span><span className="text-slate-300">{typeof selectedItem.payload.speed === 'string' ? selectedItem.payload.speed : (selectedItem.payload.speed?.walk || (typeof selectedItem.payload.speed === 'object' ? JSON.stringify(selectedItem.payload.speed) : selectedItem.payload.speed || '-'))}</span></div>
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-[10px] bg-slate-900/40 p-1.5 rounded border border-slate-800/80 text-center">
                    <div><span className="text-slate-500 block">FOR</span>{selectedItem.payload.str}</div>
                    <div><span className="text-slate-500 block">DES</span>{selectedItem.payload.dex}</div>
                    <div><span className="text-slate-500 block">CON</span>{selectedItem.payload.con}</div>
                    <div><span className="text-slate-500 block">INT</span>{selectedItem.payload.int}</div>
                    <div><span className="text-slate-500 block">SAB</span>{selectedItem.payload.wis}</div>
                    <div><span className="text-slate-500 block">CAR</span>{selectedItem.payload.cha}</div>
                  </div>
                  {selectedItem.payload.actions && selectedItem.payload.actions.length > 0 && (
                    <div className="space-y-1.5">
                      <strong className="text-[11px] text-slate-200">Ações Principais:</strong>
                      {selectedItem.payload.actions.slice(0, 3).map((act: any, i: number) => (
                        <div key={i} className="text-[11px] bg-slate-900/40 p-1.5 rounded border border-slate-800">
                          <span className="font-bold text-amber-300">{act.name}: </span>
                          <span className="text-slate-400">{act.desc?.slice(0, 90)}...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preview de Regra */}
              {selectedItem.category === 'rule' && selectedItem.payload && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <h4 className="font-bold text-sm text-slate-100">{selectedItem.payload.name}</h4>
                  </div>
                  <div className="bg-blue-950/30 border border-blue-800/40 p-2.5 rounded-lg text-blue-200 text-[11px] font-medium leading-relaxed">
                    {selectedItem.payload.summary}
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {selectedItem.payload.details}
                  </p>
                </div>
              )}

              {/* Preview de Item */}
              {selectedItem.category === 'item' && selectedItem.payload && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="flex items-center gap-2">
                    <Backpack className="w-4 h-4 text-teal-400" />
                    <h4 className="font-bold text-sm text-slate-100">{selectedItem.payload.name}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div><strong className="text-slate-400">Custo:</strong> {selectedItem.payload.cost}</div>
                    <div><strong className="text-slate-400">Peso:</strong> {selectedItem.payload.weight} kg</div>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {selectedItem.payload.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com Dicas de Atalho */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-slate-900 border border-slate-800 px-1 rounded text-slate-400">↑</kbd> <kbd className="font-mono bg-slate-900 border border-slate-800 px-1 rounded text-slate-400">↓</kbd> Navegar</span>
            <span><kbd className="font-mono bg-slate-900 border border-slate-800 px-1 rounded text-slate-400">↵</kbd> Executar</span>
            <span><kbd className="font-mono bg-slate-900 border border-slate-800 px-1 rounded text-slate-400">Tab</kbd> Autocompletar</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500/80 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Masters Codex Command Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
