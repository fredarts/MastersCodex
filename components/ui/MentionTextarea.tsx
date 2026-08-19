'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  User,
  MapPin,
  Shield,
  Target,
  Wand2,
  Skull,
  Package,
  Activity,
  BookOpen,
  AtSign,
  Search,
  Sparkles,
} from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { WorldEntity } from '@/lib/types';
import {
  mentionIndexService,
  MentionItem,
  MentionEntityType,
} from '@/lib/services/mentionIndexService';
import { getCategoryBadgeStyle } from './MentionBadge';

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChangeValue?: (val: string) => void;
  worldEntities?: WorldEntity[];
  containerClassName?: string;
  showMentionButton?: boolean;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  onChangeValue,
  worldEntities: propWorldEntities,
  containerClassName = '',
  className = '',
  showMentionButton = true,
  placeholder = 'Escreva sua descrição... Digite @ para mencionar NPCs, monstros, itens, magias ou locais.',
  rows = 4,
  ...props
}) => {
  const worldContext = useWorld();
  const worldEntities = propWorldEntities || worldContext?.worldEntities || [];

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Filtered mention items
  const items = React.useMemo(() => {
    return mentionIndexService.searchEntities(query, worldEntities, {
      categoryFilter,
      limit: 25,
    });
  }, [query, worldEntities, categoryFilter]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const updateText = (newVal: string) => {
    if (onChangeValue) {
      onChangeValue(newVal);
    }
    if (onChange && textareaRef.current) {
      // Simulate synthetic change event
      const event = {
        target: { ...textareaRef.current, value: newVal },
        currentTarget: { ...textareaRef.current, value: newVal },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(event);
    }
  };

  const handleSelectMention = useCallback(
    (item: MentionItem) => {
      if (mentionStartIndex === null || !textareaRef.current) return;

      const cursor = textareaRef.current.selectionStart || value.length;
      const before = value.substring(0, mentionStartIndex);
      const after = value.substring(cursor);

      const mentionTag = mentionIndexService.formatMentionTag(item.name, item.type, item.id);
      const newValue = `${before}${mentionTag} ${after}`;

      updateText(newValue);
      setIsOpen(false);
      setMentionStartIndex(null);
      setQuery('');

      // Restore focus and place cursor after inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const nextCursorPos = before.length + mentionTag.length + 1;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(nextCursorPos, nextCursorPos);
        }
      }, 10);
    },
    [mentionStartIndex, value]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;

    if (onChange) onChange(e);
    if (onChangeValue) onChangeValue(val);

    // Check if user is typing a mention
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Ensure no spaces or newlines between @ and cursor, or reasonable length
      if (!textAfterAt.includes('\n') && textAfterAt.length <= 30) {
        setMentionStartIndex(lastAtIndex);
        setQuery(textAfterAt);
        setIsOpen(true);
        return;
      }
    }

    setIsOpen(false);
    setMentionStartIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen || items.length === 0) {
      if (props.onKeyDown) props.onKeyDown(e);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (items[selectedIndex]) {
        handleSelectMention(items[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const triggerManualMention = () => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart || value.length;
    const before = value.substring(0, cursorPos);
    const after = value.substring(cursorPos);
    const newVal = `${before}@${after}`;
    updateText(newVal);

    setMentionStartIndex(cursorPos);
    setQuery('');
    setIsOpen(true);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPos + 1, cursorPos + 1);
      }
    }, 10);
  };

  return (
    <div className={`relative flex flex-col ${containerClassName}`}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`w-full bg-[#0a0d14] border border-[#1e2738] rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all custom-scrollbar ${className}`}
          {...props}
        />

        {showMentionButton && (
          <button
            type="button"
            onClick={triggerManualMention}
            className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-500 hover:text-amber-300 hover:bg-amber-950/40 border border-transparent hover:border-amber-500/30 transition-all text-[11px] flex items-center gap-1"
            title="Inserir Menção (@)"
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#0d121f]/98 backdrop-blur-md border border-[#2a3449] rounded-xl shadow-2xl overflow-hidden max-h-72 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header & Category Filters */}
          <div className="p-2 border-b border-[#1f293d] bg-[#090d17] flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-amber-400 font-mono">
              <AtSign className="w-3 h-3" />
              <span>Menções ({items.length})</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'npc', label: 'NPCs' },
                { id: 'location', label: 'Locais' },
                { id: 'monster', label: 'Monstros' },
                { id: 'spell', label: 'Magias' },
                { id: 'item', label: 'Itens' },
                { id: 'quest', label: 'Missões' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    categoryFilter === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of matching entities */}
          <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {items.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                Nenhuma entidade ou magia/item encontrado para &quot;{query}&quot;.
              </div>
            ) : (
              items.map((item, index) => {
                const style = getCategoryBadgeStyle(item.type);
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${item.source}-${item.type}-${item.id}-${index}`}
                    type="button"
                    onClick={() => handleSelectMention(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b2438] text-slate-100 border border-amber-500/40 shadow-xs'
                        : 'text-slate-300 hover:bg-[#131a29]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1 rounded-md border shrink-0 ${style.bg}`}>
                        {style.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200 truncate">
                            {item.name}
                          </span>
                          {item.subType && (
                            <span className="text-[10px] text-slate-400 truncate">
                              • {item.subType}
                            </span>
                          )}
                        </div>
                        {item.previewText && (
                          <p className="text-[10px] text-slate-500 truncate max-w-sm">
                            {item.previewText}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[9px] font-mono font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-[#090d17] border border-[#1f293d] shrink-0">
                      {item.categoryLabel}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Keyboard tip footer */}
          <div className="px-3 py-1 bg-[#090d17] border-t border-[#1f293d] flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span>Use ↑ ↓ para navegar, Enter/Tab para selecionar</span>
            <span>ESC para fechar</span>
          </div>
        </div>
      )}
    </div>
  );
};
