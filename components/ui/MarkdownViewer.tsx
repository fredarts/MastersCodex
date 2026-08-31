import React from 'react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content into blocks (paragraphs, headers, lists)
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];

  const flushList = (keyPrefix: number) => {
    if (currentListItems.length > 0) {
      blocks.push(
        <ul key={`list-${keyPrefix}`} className="space-y-1.5 my-2">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  const renderInlineFormatted = (text: string): React.ReactNode[] => {
    // Process bold (**text**), italics (*text* or _text_), code (`code`)
    // Simple regex-based tokenization
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    let matchIdx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matchStr = match[0];
      if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
        parts.push(
          <strong key={`bold-${matchIdx}`} className="text-amber-300 font-bold">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith('__') && matchStr.endsWith('__')) {
        parts.push(
          <strong key={`bold-u-${matchIdx}`} className="text-amber-300 font-bold">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith('*') && matchStr.endsWith('*')) {
        parts.push(
          <em key={`em-${matchIdx}`} className="text-slate-300 italic">
            {matchStr.slice(1, -1)}
          </em>
        );
      } else if (matchStr.startsWith('_') && matchStr.endsWith('_')) {
        parts.push(
          <em key={`em-u-${matchIdx}`} className="text-slate-300 italic">
            {matchStr.slice(1, -1)}
          </em>
        );
      } else if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        parts.push(
          <code key={`code-${matchIdx}`} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-mono text-[11px]">
            {matchStr.slice(1, -1)}
          </code>
        );
      }
      matchIdx++;
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(idx);
      return;
    }

    // Header 3 (### Header)
    if (trimmed.startsWith('### ')) {
      flushList(idx);
      blocks.push(
        <h4 key={`h3-${idx}`} className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
          {renderInlineFormatted(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    // Header 2 (## Header)
    if (trimmed.startsWith('## ')) {
      flushList(idx);
      blocks.push(
        <h3 key={`h2-${idx}`} className="text-sm font-bold text-slate-100 mt-3.5 mb-1.5 border-b border-[#2a3449]/60 pb-1">
          {renderInlineFormatted(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    // Header 1 (# Header)
    if (trimmed.startsWith('# ')) {
      flushList(idx);
      blocks.push(
        <h2 key={`h1-${idx}`} className="text-base font-bold text-amber-300 mt-4 mb-2">
          {renderInlineFormatted(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Unordered List Items (* item or - item or • item)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const itemContent = trimmed.slice(2).trim();
      currentListItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 text-slate-200 text-xs leading-relaxed">
          <span className="text-amber-400 font-bold select-none text-sm leading-none mt-0.5">•</span>
          <div className="flex-1">{renderInlineFormatted(itemContent)}</div>
        </li>
      );
      return;
    }

    // Regular Paragraph
    flushList(idx);
    blocks.push(
      <p key={`p-${idx}`} className="text-xs text-slate-200 leading-relaxed mb-2.5 last:mb-0">
        {renderInlineFormatted(trimmed)}
      </p>
    );
  });

  flushList(lines.length);

  return (
    <div className={`space-y-1 ${className}`}>
      {blocks}
    </div>
  );
};
