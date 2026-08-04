'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Hash, Lock, Scroll, ChevronDown } from 'lucide-react';
import { ChatMessage, ChatChannel } from '@/lib/types';
import { parseDiceCommand } from '@/lib/chat-dice-parser';
import { ChatMessageBubble } from './ChatMessageBubble';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/context/CampaignContext';

interface LiveChatPanelProps {
  className?: string;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({ className = '' }) => {
  const { chatMessages, broadcastChatMessage } = useLiveCockpit();
  const { user } = useAuth();
  const { activeCampaign, campaignMembers } = useCampaign();

  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('general');
  const [whisperTarget, setWhisperTarget] = useState<{ id: string; name: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id || 'anonymous';
  const currentUserName = activeCampaign?.characterName || user?.email?.split('@')[0] || 'Jogador';

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
    scrollToBottom();
  }, [filteredMessages.length, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollButton(!isNearBottom);
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    const rollResult = parseDiceCommand(text);

    const message: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUserId,
      senderName: currentUserName,
      channel: activeChannel === 'whisper' && whisperTarget ? 'whisper' : activeChannel,
      whisperTo: activeChannel === 'whisper' ? whisperTarget?.id : undefined,
      whisperToName: activeChannel === 'whisper' ? whisperTarget?.name : undefined,
      content: rollResult ? text : text,
      rollResult: rollResult || undefined,
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

  const channels: { key: ChatChannel; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'Geral', icon: <Hash className="w-3 h-3" /> },
    { key: 'whisper', label: 'Sussurro', icon: <Lock className="w-3 h-3" /> },
    { key: 'ic', label: 'RP', icon: <Scroll className="w-3 h-3" /> },
  ];

  const memberList = (campaignMembers || []).filter((m) => m.userId !== currentUserId);

  return (
    <div className={`flex flex-col h-full bg-[#0a0e17] rounded-xl border border-[#1e293b] overflow-hidden ${className}`}>
      {/* Channel tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#1e293b] bg-[#0d1220]">
        {channels.map((ch) => (
          <button
            key={ch.key}
            onClick={() => setActiveChannel(ch.key)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeChannel === ch.key
                ? ch.key === 'whisper'
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                  : ch.key === 'ic'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
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

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent relative"
      >
        {filteredMessages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs">
            {activeChannel === 'whisper' ? 'Selecione um jogador e envie uma mensagem privada...' : 'Comece a conversa ou digite /roll 1d20...'}
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

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-14 right-3 w-7 h-7 rounded-full bg-cyan-500/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/50 transition-all z-10"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Input */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-t border-[#1e293b] bg-[#0d1220]">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeChannel === 'ic' ? 'Fale como seu personagem...' : 'Mensagem ou /roll 1d20+5...'}
          className="flex-1 bg-[#141b2d] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
