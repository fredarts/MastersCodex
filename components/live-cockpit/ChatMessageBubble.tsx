'use client';

import React from 'react';
import { ChatMessage } from '@/lib/types';
import { Lock, Dices } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isOwn }) => {
  const isWhisper = message.channel === 'whisper';
  const isIC = message.channel === 'ic';

  return (
    <div className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
      {/* Sender info */}
      <div className="flex items-center gap-1.5 px-1">
        {!isOwn && (
          <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">
            {message.senderName}
          </span>
        )}
        {isWhisper && (
          <span className="flex items-center gap-0.5 text-[9px] text-fuchsia-400 font-bold">
            <Lock className="w-2.5 h-2.5" />
            Sussurro{message.whisperToName ? ` → ${message.whisperToName}` : ''}
          </span>
        )}
        {isIC && (
          <span className="text-[9px] text-emerald-400 font-bold italic">In-Character</span>
        )}
        <span className="text-[9px] text-slate-600 font-mono">{message.timestamp}</span>
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed break-words ${
          isWhisper
            ? 'bg-fuchsia-500/15 border border-fuchsia-500/20 text-fuchsia-200'
            : isIC
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 italic'
            : isOwn
            ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100 rounded-br-md'
            : 'bg-[#151d2e] border border-[#1e293b] text-slate-300 rounded-bl-md'
        }`}
      >
        <span>{message.content}</span>

        {/* Inline dice result */}
        {message.rollResult && (
          <div
            className={`mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-mono ${
              message.rollResult.isCrit
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                : message.rollResult.isFail
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
                : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-200'
            }`}
          >
            <Dices className="w-3.5 h-3.5 shrink-0" />
            <span className="text-slate-400">{message.rollResult.formula}</span>
            <span className="text-slate-500">=</span>
            <span className="text-slate-300">[{message.rollResult.rolls.join(', ')}]</span>
            <span className="text-slate-500">→</span>
            <span className={`font-black text-sm ${
              message.rollResult.isCrit ? 'text-amber-300' : message.rollResult.isFail ? 'text-rose-300' : 'text-white'
            }`}>
              {message.rollResult.total}
            </span>
            {message.rollResult.isCrit && <span className="text-amber-400 font-black text-[9px]">CRIT!</span>}
            {message.rollResult.isFail && <span className="text-rose-400 font-black text-[9px]">FAIL!</span>}
          </div>
        )}
      </div>
    </div>
  );
};
