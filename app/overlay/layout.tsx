import React from 'react';

export const metadata = {
  title: 'Masters Codex - OBS Streamer Overlay',
  description: 'Clean transparent overlay for live streaming D&D sessions',
};

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-screen bg-transparent overflow-hidden select-none">
      {children}
    </div>
  );
}
