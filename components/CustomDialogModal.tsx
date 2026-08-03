'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCustomDialog } from '@/context/CustomDialogContext';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert, X, HelpCircle, Sparkles } from 'lucide-react';

export function CustomDialogModal() {
  const { dialogState, closeDialog } = useCustomDialog();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dialogState.isOpen && dialogState.type === 'prompt') {
      setInputValue(dialogState.defaultValue || '');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [dialogState.isOpen, dialogState.type, dialogState.defaultValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialogState.isOpen) return;

      if (e.key === 'Escape') {
        if (dialogState.type === 'alert') {
          closeDialog(undefined);
        } else if (dialogState.type === 'confirm') {
          closeDialog(false);
        } else if (dialogState.type === 'prompt') {
          closeDialog(null);
        }
      } else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState.isOpen, dialogState.type, inputValue]);

  if (!dialogState.isOpen) return null;

  const handleConfirm = () => {
    if (dialogState.type === 'alert') {
      closeDialog(undefined);
    } else if (dialogState.type === 'confirm') {
      closeDialog(true);
    } else if (dialogState.type === 'prompt') {
      closeDialog(inputValue);
    }
  };

  const handleCancel = () => {
    if (dialogState.type === 'confirm') {
      closeDialog(false);
    } else if (dialogState.type === 'prompt') {
      closeDialog(null);
    } else {
      closeDialog(undefined);
    }
  };

  // Determine icon & theme color based on variant/type
  const variant = dialogState.variant || 'info';

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />,
          accentBg: 'bg-rose-500',
          borderGlow: 'border-rose-500/40 shadow-rose-950/40',
          confirmBtn: 'bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white shadow-rose-950/50',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          accentBg: 'bg-amber-500',
          borderGlow: 'border-amber-500/40 shadow-amber-950/30',
          confirmBtn: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-amber-950/50',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          accentBg: 'bg-emerald-500',
          borderGlow: 'border-emerald-500/40 shadow-emerald-950/30',
          confirmBtn: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold shadow-emerald-950/50',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      default:
        if (dialogState.type === 'prompt') {
          return {
            icon: <Sparkles className="w-6 h-6 text-purple-400" />,
            accentBg: 'bg-purple-500',
            borderGlow: 'border-purple-500/40 shadow-purple-950/30',
            confirmBtn: 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold shadow-purple-950/50',
            badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          };
        }
        return {
          icon: <Info className="w-6 h-6 text-cyan-400" />,
          accentBg: 'bg-cyan-500',
          borderGlow: 'border-cyan-500/40 shadow-cyan-950/30',
          confirmBtn: 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold shadow-cyan-950/50',
          badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className={`bg-[#0c0f17] border ${styles.borderGlow} shadow-2xl rounded-2xl max-w-md w-full overflow-hidden flex flex-col relative transform transition-all scale-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div className={`h-1 w-full ${styles.accentBg}`} />

        {/* Content Section */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl border ${styles.badgeBg} shrink-0 mt-0.5`}>
              {styles.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-100 tracking-tight leading-snug">
                {dialogState.title}
              </h3>
              {dialogState.message && (
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap">
                  {dialogState.message}
                </p>
              )}
            </div>

            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Input field for prompt dialogs */}
          {dialogState.type === 'prompt' && (
            <div className="mt-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={dialogState.placeholder}
                className="w-full bg-[#141a29] border border-slate-700/80 focus:border-amber-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 bg-[#080b12] border-t border-slate-800/80 flex items-center justify-end gap-2.5">
          {dialogState.type !== 'alert' && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all"
            >
              {dialogState.cancelText || 'Cancelar'}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 ${styles.confirmBtn}`}
          >
            {dialogState.confirmText || (dialogState.type === 'alert' ? 'OK' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
