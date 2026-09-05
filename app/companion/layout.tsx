import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Masters Codex - Mobile Companion',
  description: 'Visão de bolso rápida para jogadores D&D 5e sem peso 3D com feedback tátil e status vital instantâneo.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Codex Companion',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020617',
};

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950">
      {children}
    </div>
  );
}
