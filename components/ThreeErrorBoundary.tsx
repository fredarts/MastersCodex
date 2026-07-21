'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw, Box, Compass } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ThreeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Three.js Error Boundary capturou um erro WebGL:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] bg-zinc-950 border border-rose-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Fundo de Grade 2D Fallback */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #f43f5e 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 max-w-md space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-100">
                {this.props.fallbackTitle || 'Falha no Renderizador 3D (WebGL)'}
              </h3>
              <p className="text-xs text-zinc-400">
                Ocorreu uma exceção no contexto gráfico ou durante o carregamento de assets 3D. A grade visual foi alternada para o modo de contingência 2D.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-[11px] font-mono text-rose-300/90 text-left max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Renderizador 3D
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
