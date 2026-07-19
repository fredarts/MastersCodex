'use client';

import React, { useState } from 'react';
import { X, Shield, Mail, Lock, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithEmail, user, signOut } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [sentMagicLink, setSentMagicLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    await signInWithEmail(emailInput);
    setIsSubmitting(false);
    setSentMagicLink(true);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    await signInWithGoogle();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-[#161c28] border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-[#2a3449] pb-4 mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Conta do Mestre & Jogador</h3>
              <p className="text-[10px] text-amber-400">Autenticação Supabase</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#2a3449] rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {user ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                user.displayName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-100">{user.displayName}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>

            <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#2a3449] text-xs text-slate-300 text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Sessão Ativa
              </div>
              <p className="text-slate-400 text-[11px]">
                Sua conta permite mestrar seus próprios mundos e participar como jogador nas mesas dos seus amigos.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs rounded-lg transition-all"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Entre para salvar seus mapas, encontros pré-programados, anotações de mundo e sincronizar mesas em tempo real.
            </p>

            {/* Google OAuth Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-white text-slate-900 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com a conta do Google</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#2a3449] w-full"></div>
              <span className="bg-[#161c28] px-2 text-[10px] uppercase text-slate-500 font-mono absolute">
                Ou por Email
              </span>
            </div>

            {sentMagicLink ? (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 text-center">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                <p className="font-bold">Link de acesso enviado!</p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">Verifique sua caixa de entrada no email.</p>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Seu Email:</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="mestre@rpg.com"
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Enviar Magic Link / Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
