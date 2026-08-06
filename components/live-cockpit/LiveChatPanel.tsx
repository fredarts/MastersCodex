'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Hash, Lock, Scroll, ChevronDown, Sparkles, Dices, Shield, Eye, Ghost, Zap } from 'lucide-react';
import { ChatMessage, ChatChannel, CharacterSheet, SecretRollNotificationMode, MacroBarDisplayMode, MacroItem } from '@/lib/types';
import { parseDiceCommand } from '@/lib/chat-dice-parser';
import { loadUserMacros, processMacroCommand } from '@/lib/dnd5e-macro-engine';
import { ChatMessageBubble } from './ChatMessageBubble';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/context/CampaignContext';

interface LiveChatPanelProps {
  className?: string;
  activeSheet?: CharacterSheet | null;
  displayMode?: MacroBarDisplayMode;
  secretMode?: SecretRollNotificationMode;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({
  className = '',
  activeSheet,
  displayMode = 'both',
  secretMode = 'subtle_notice',
}) => {
  const { chatMessages, broadcastChatMessage } = useLiveCockpit();
  const { user } = useAuth();
  const { activeCampaign, campaignMembers } = useCampaign();

  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<ChatChannel | 'macros'>('general');
  const [whisperTarget, setWhisperTarget] = useState<{ id: string; name: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [advantageToggle, setAdvantageToggle] = useState<'normal' | 'adv' | 'dis'>('normal');

  const [macros, setMacros] = useState<MacroItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id || 'anonymous';
  const currentUserName = activeCampaign?.characterName || user?.email?.split('@')[0] || 'Jogador';
  const isDm = activeCampaign?.dmId === currentUserId;

  useEffect(() => {
    setMacros(loadUserMacros());
  }, []);

  const filteredMessages = chatMessages.filter((msg) => {
    if (msg.channel === 'whisper') {
      return msg.senderId === currentUserId || msg.whisperTo === currentUserId;
    }
    if (activeChannel === 'general') return msg.channel === 'general' || msg.channel === 'ic';
    return msg.channel === activeChannel;
  });

  const scrollToBottom = useCallback(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (activeChannel !== 'macros') {
      scrollToBottom();
    }
  }, [filteredMessages.length, activeChannel, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollButton(!isNearBottom);
  };

  const handleSend = (textToSend?: string) => {
    let text = (textToSend || inputText).trim();
    if (!text) return;

    // Apply advantage mode prefix if selected and text is a simple /roll
    if (advantageToggle === 'adv' && !/\badv\b/i.test(text) && /^\/(?:r|roll|gmroll|gmr)\b/i.test(text)) {
      text += ' adv';
    } else if (advantageToggle === 'dis' && !/\bdis\b/i.test(text) && /^\/(?:r|roll|gmroll|gmr)\b/i.test(text)) {
      text += ' dis';
    }

    const rollResult = parseDiceCommand(text, activeSheet);
    const isSecret = rollResult?.isSecret || text.startsWith('/gmroll') || text.startsWith('/gmr');

    const message: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUserId,
      senderName: currentUserName,
      channel: activeChannel === 'whisper' && whisperTarget ? 'whisper' : (activeChannel === 'macros' ? 'general' : activeChannel),
      whisperTo: activeChannel === 'whisper' ? whisperTarget?.id : undefined,
      whisperToName: activeChannel === 'whisper' ? whisperTarget?.name : undefined,
      content: rollResult ? text : text,
      rollResult: rollResult || undefined,
      isSecret,
      isSubtleNotice: isSecret && secretMode === 'subtle_notice',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    broadcastChatMessage(message);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRunMacro = (macro: MacroItem) => {
    const cmd = processMacroCommand(macro, activeSheet);
    handleSend(cmd);
  };

  const channels: { key: ChatChannel | 'macros'; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'Geral', icon: <Hash className="w-3 h-3" /> },
    { key: 'whisper', label: 'Sussurro', icon: <Lock className="w-3 h-3" /> },
    { key: 'ic', label: 'RP', icon: <Scroll className="w-3 h-3" /> },
    ...(displayMode === 'chat_tab' || displayMode === 'both'
      ? [{ key: 'macros' as const, label: 'Macros', icon: <Sparkles className="w-3 h-3" /> }]
      : []),
  ];

  const memberList = (campaignMembers || []).filter((m) => m.userId !== currentUserId);

  return (
    <div className={`flex flex-col h-full bg-[#0a0e17] rounded-xl border border-[#1e293b] overflow-hidden ${className}`}>
      {/* Channel & Macro Tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#1e293b] bg-[#0d1220] overflow-x-auto scrollbar-none">
        {channels.map((ch) => (
          <button
            key={ch.key}
            onClick={() => setActiveChannel(ch.key)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeChannel === ch.key
                ? ch.key === 'whisper'
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                  : ch.key === 'ic'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : ch.key === 'macros'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {ch.icon}
            {ch.label}
          </button>
        ))}
      </div>

      {/* Whisper target selector */}
      {activeChannel === 'whisper' && (
        <div className="flex items-center gap-1 px-2 py-1 border-b border-[#1e293b] bg-fuchsia-500/5">
          <Lock className="w-3 h-3 text-fuchsia-400" />
          <span className="text-[10px] text-fuchsia-300 font-bold">Para:</span>
          <select
            value={whisperTarget?.id || ''}
            onChange={(e) => {
              const member = memberList.find((m) => m.userId === e.target.value);
              setWhisperTarget(member ? { id: member.userId, name: member.characterName || member.displayName || 'Jogador' } : null);
            }}
            className="flex-1 bg-transparent text-[10px] text-fuchsia-200 border-none outline-none"
          >
            <option value="">Selecionar jogador...</option>
            {memberList.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.characterName || m.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Content View (Messages OR Macros Tab) */}
      {activeChannel === 'macros' ? (
        /* Dedicated Macros Tab View */
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Biblioteca de Macros
            </h4>
            <span className="text-[10px] text-slate-500">{macros.length} salvas</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {macros.map((m) => (
              <div
                key={m.id}
                onClick={() => handleRunMacro(m)}
                className="p-2.5 bg-[#141b2d] hover:bg-[#1c273e] border border-slate-700/70 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color || '#f59e0b' }} />
                    <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      {m.name}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{m.command}</div>
                </div>

                <button
                  type="button"
                  className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg group-hover:bg-amber-500 group-hover:text-slate-950 transition-all"
                >
                  Rolar 🎲
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Messages View */
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-2 py-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent relative"
        >
          {filteredMessages.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs italic">
              {activeChannel === 'whisper'
                ? 'Selecione um jogador e envie uma mensagem privada...'
                : 'Comece a conversa ou digite /roll 1d20 ou /gmroll...'}
            </div>
          )}

          {filteredMessages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
            />
          ))}
          <div ref={scrollEndRef} />
        </div>
      )}

      {/* Scroll to bottom button */}
      {showScrollButton && activeChannel !== 'macros' && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-14 right-3 w-7 h-7 rounded-full bg-cyan-500/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/50 transition-all z-10"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Command & Advantage Bar + Input */}
      <div className="flex flex-col gap-1 px-2 py-1.5 border-t border-[#1e293b] bg-[#0d1220]">
        {/* Advantage & Quick Command Shortcuts */}
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-bold mr-0.5">Modo:</span>
            {[
              { key: 'normal', label: 'Norm' },
              { key: 'adv', label: 'Vant (ADV)' },
              { key: 'dis', label: 'Desv (DIS)' },
            ].map((adv) => (
              <button
                key={adv.key}
                type="button"
                onClick={() => setAdvantageToggle(adv.key as any)}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  advantageToggle === adv.key
                    ? adv.key === 'adv'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : adv.key === 'dis'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {adv.label}
              </button>
            ))}
          </div>

          {/* Quick Dice Prefixes */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setInputText('/roll 1d20+')}
              className="px-1.5 py-0.5 bg-[#172030] hover:bg-[#202c42] text-cyan-300 font-mono font-bold rounded border border-cyan-500/30"
            >
              /roll
            </button>
            {isDm && (
              <button
                type="button"
                onClick={() => setInputText('/gmroll 1d20+')}
                className="px-1.5 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 font-mono font-bold rounded border border-purple-500/40"
                title="Rolagem Secreta (DM Only)"
              >
                🔒 /gmroll
              </button>
            )}
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeChannel === 'ic'
                ? 'Fale como seu personagem...'
                : 'Mensagem ou /roll 1d20+5 ou /gmroll...'
            }
            className="flex-1 bg-[#141b2d] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
