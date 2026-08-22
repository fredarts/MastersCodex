'use client';

import React from 'react';
import { OverlayChatMessage } from '@/lib/overlay/overlayStateReducer';
import { MessageSquare } from 'lucide-react';

interface OverlayChatFeedProps {
  messages: OverlayChatMessage[];
  theme?: string;
}

export const OverlayChatFeed: React.FC<OverlayChatFeedProps> = ({ messages, theme = 'obsidian' }) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-left-4"
        >
          <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mt-0.5 flex-shrink-0">
            <MessageSquare className="w-3 h-3" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-amber-300 truncate">
              {msg.senderName}
            </span>
            <p className="text-xs text-slate-200 mt-0.5 leading-snug break-words">
              {msg.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
