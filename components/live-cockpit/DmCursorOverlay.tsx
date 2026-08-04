'use client';

import React, { useEffect, useState } from 'react';
import { DmCursorPayload } from '@/lib/types';

interface DmCursorOverlayProps {
  cursorData: DmCursorPayload | null;
}

export const DmCursorOverlay: React.FC<DmCursorOverlayProps> = ({ cursorData }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (cursorData) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [cursorData]);

  if (!cursorData || !visible) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
      style={{
        left: `${cursorData.x}%`,
        top: `${cursorData.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Cursor icon */}
      <svg
        width="20"
        height="24"
        viewBox="0 0 20 24"
        fill="none"
        className="drop-shadow-lg"
      >
        <path
          d="M2 2L8 20L11 13L18 10L2 2Z"
          fill="rgba(245, 158, 11, 0.8)"
          stroke="rgba(245, 158, 11, 1)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* DM label */}
      <div className="absolute top-5 left-4 bg-amber-500/90 text-[9px] font-black text-slate-950 px-1.5 py-0.5 rounded-md shadow-lg whitespace-nowrap">
        DM
      </div>
    </div>
  );
};
