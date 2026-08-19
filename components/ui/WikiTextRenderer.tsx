'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useWorld } from '@/lib/hooks/useWorld';
import { WorldEntity } from '@/lib/types';
import { mentionIndexService, MentionPreviewData } from '@/lib/services/mentionIndexService';
import { MentionBadge } from './MentionBadge';
import { MentionHoverCard } from './MentionHoverCard';

interface WikiTextRendererProps {
  text: string;
  className?: string;
  worldEntities?: WorldEntity[];
  onInspect?: (data: MentionPreviewData) => void;
}

export const WikiTextRenderer: React.FC<WikiTextRendererProps> = ({
  text,
  className = '',
  worldEntities: propWorldEntities,
  onInspect,
}) => {
  const worldContext = useWorld();
  const worldEntities = propWorldEntities || worldContext?.worldEntities || [];

  const [hoverData, setHoverData] = useState<MentionPreviewData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHoverCardVisible, setIsHoverCardVisible] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(
    async (e: React.MouseEvent<HTMLSpanElement>, name: string, type: string, id: string) => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      setHoverPos({
        x: rect.left,
        y: rect.bottom,
      });

      const preview = await mentionIndexService.getEntityPreview(type, id, name, worldEntities);
      setHoverData(preview);
      setIsHoverCardVisible(true);
    },
    [worldEntities]
  );

  const handleMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsHoverCardVisible(false);
      setHoverData(null);
    }, 250);
  }, []);

  const handleCardMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsHoverCardVisible(false);
      setHoverData(null);
    }, 200);
  }, []);

  if (!text) {
    return null;
  }

  // Regex to match `@[Entity Name](type:id)` or `[Entity Name](@type:id)`
  const MENTION_REGEX = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)|\[([^\]]+)\]\(@([^:]+):([^)]+)\)/g;

  // Split text by lines first to preserve formatting
  const lines = text.split('\n');

  return (
    <div className={`wiki-text-renderer ${className}`}>
      {lines.map((line, lineIdx) => {
        if (!line.trim() && lineIdx !== lines.length - 1) {
          return <div key={lineIdx} className="h-2" />;
        }

        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        // Reset regex state
        MENTION_REGEX.lastIndex = 0;

        while ((match = MENTION_REGEX.exec(line)) !== null) {
          // Push preceding plain text
          if (match.index > lastIndex) {
            const plainText = line.substring(lastIndex, match.index);
            elements.push(<span key={`text-${lineIdx}-${lastIndex}`}>{plainText}</span>);
          }

          // Extract match groups
          const name = match[1] || match[4];
          const type = match[2] || match[5];
          const id = match[3] || match[6];
          const matchKey = `mention-${lineIdx}-${match.index}-${id}`;

          elements.push(
            <MentionBadge
              key={matchKey}
              name={name}
              type={type}
              id={id}
              onMouseEnter={(e) => handleMouseEnter(e, name, type, id)}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                mentionIndexService.getEntityPreview(type, id, name, worldEntities).then((prev) => {
                  if (onInspect) {
                    onInspect(prev);
                  } else {
                    if (type === 'monster') {
                      window.dispatchEvent(new CustomEvent('openCompendiumModal', { detail: { tab: 'monsters', search: name } }));
                    } else if (type === 'spell') {
                      window.dispatchEvent(new CustomEvent('openCompendiumModal', { detail: { tab: 'spells', search: name } }));
                    } else if (type === 'item') {
                      window.dispatchEvent(new CustomEvent('openCompendiumModal', { detail: { tab: 'items', search: name } }));
                    } else {
                      window.dispatchEvent(new CustomEvent('openWorldEntityModal', { detail: { entityId: id, entityName: name } }));
                    }
                  }
                });
              }}
            />
          );

          lastIndex = MENTION_REGEX.lastIndex;
        }

        // Remaining text on line
        if (lastIndex < line.length) {
          elements.push(
            <span key={`text-end-${lineIdx}-${lastIndex}`}>
              {line.substring(lastIndex)}
            </span>
          );
        }

        return (
          <p key={`line-${lineIdx}`} className="leading-relaxed">
            {elements.length > 0 ? elements : <br />}
          </p>
        );
      })}

      {/* Floating Hover Card */}
      <MentionHoverCard
        data={hoverData}
        position={hoverPos}
        isVisible={isHoverCardVisible}
        onMouseEnter={handleCardMouseEnter}
        onMouseLeave={handleCardMouseLeave}
        onInspect={onInspect}
      />
    </div>
  );
};
