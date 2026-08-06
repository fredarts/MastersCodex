import { MacroItem, CharacterSheet } from './types';
import { interpolateMacroVariables } from './chat-dice-parser';

export const DEFAULT_PRESET_MACROS: MacroItem[] = [
  { id: 'macro-init', name: 'Iniciativa', command: '/r 1d20+@dex (Iniciativa)', color: '#f59e0b', icon: 'zap' },
  { id: 'macro-perception', name: 'Percepção', command: '/r 1d20+@wis (Percepção)', color: '#38bdf8', icon: 'eye' },
  { id: 'macro-stealth', name: 'Furtividade', command: '/r 1d20+@dex (Furtividade)', color: '#10b981', icon: 'ghost' },
  { id: 'macro-save-con', name: 'Salvaguarda CON', command: '/r 1d20+@con (Salv. CON)', color: '#ef4444', icon: 'shield' },
  { id: 'macro-gm-secret', name: 'Rolagem Secreta DM', command: '/gmroll 1d20 (Teste Secreto)', color: '#a855f7', icon: 'lock', isGlobal: true },
];

const MACRO_STORAGE_KEY = 'masters_codex_user_macros';

export function loadUserMacros(): MacroItem[] {
  if (typeof window === 'undefined') return DEFAULT_PRESET_MACROS;
  try {
    const raw = localStorage.getItem(MACRO_STORAGE_KEY);
    if (!raw) return DEFAULT_PRESET_MACROS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRESET_MACROS;
  } catch (e) {
    return DEFAULT_PRESET_MACROS;
  }
}

export function saveUserMacros(macros: MacroItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MACRO_STORAGE_KEY, JSON.stringify(macros));
  } catch (e) {
    console.error('Failed to save user macros:', e);
  }
}

export function addCustomMacro(macro: Omit<MacroItem, 'id'>): MacroItem[] {
  const current = loadUserMacros();
  const newMacro: MacroItem = {
    ...macro,
    id: `macro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [...current, newMacro];
  saveUserMacros(updated);
  return updated;
}

export function removeCustomMacro(id: string): MacroItem[] {
  const current = loadUserMacros();
  const updated = current.filter((m) => m.id !== id);
  saveUserMacros(updated);
  return updated;
}

export function processMacroCommand(macro: MacroItem, sheet?: CharacterSheet | null): string {
  return interpolateMacroVariables(macro.command, sheet);
}
