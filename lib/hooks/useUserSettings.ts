'use client';

import { useState, useEffect } from 'react';

export interface UserSettings {
  geminiApiKey: string;
  openRouterApiKey: string;
  textModelProvider: 'gemini' | 'openrouter';
  textModel: string;
  imageModel: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  geminiApiKey: '',
  openRouterApiKey: '',
  textModelProvider: 'gemini',
  textModel: 'gemini-2.5-flash',
  imageModel: 'imagen-3.0-generate-001',
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const geminiApiKey = localStorage.getItem('codex_gemini_api_key') || '';
        const openRouterApiKey = localStorage.getItem('codex_openrouter_api_key') || '';
        const textModelProvider = (localStorage.getItem('codex_text_model_provider') as 'gemini' | 'openrouter') || 'gemini';
        const textModel = localStorage.getItem('codex_text_model') || 'gemini-2.5-flash';
        const imageModel = localStorage.getItem('codex_image_model') || 'imagen-3.0-generate-001';

        setSettings({
          geminiApiKey,
          openRouterApiKey,
          textModelProvider,
          textModel,
          imageModel,
        });
      } catch (e) {
        console.error('Error loading settings from localStorage:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();

    // Sincronizar em tempo real entre diferentes instâncias do hook na mesma página
    window.addEventListener('codex_user_settings_updated', loadSettings);
    // Sincronizar entre diferentes abas
    window.addEventListener('storage', loadSettings);

    return () => {
      window.removeEventListener('codex_user_settings_updated', loadSettings);
      window.removeEventListener('storage', loadSettings);
    };
  }, []);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        const localStorageKey = getLocalStorageKey(key);
        if (localStorageKey) {
          localStorage.setItem(localStorageKey, String(value));
          window.dispatchEvent(new Event('codex_user_settings_updated'));
        }
      } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e);
      }
      return updated;
    });
  };

  const saveSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        Object.entries(newSettings).forEach(([key, val]) => {
          const localStorageKey = getLocalStorageKey(key as keyof UserSettings);
          if (localStorageKey) {
            localStorage.setItem(localStorageKey, String(val));
          }
        });
        window.dispatchEvent(new Event('codex_user_settings_updated'));
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
      return updated;
    });
  };

  return {
    settings,
    isLoaded,
    updateSetting,
    saveSettings,
  };
}

function getLocalStorageKey(key: keyof UserSettings): string | null {
  switch (key) {
    case 'geminiApiKey': return 'codex_gemini_api_key';
    case 'openRouterApiKey': return 'codex_openrouter_api_key';
    case 'textModelProvider': return 'codex_text_model_provider';
    case 'textModel': return 'codex_text_model';
    case 'imageModel': return 'codex_image_model';
    default: return null;
  }
}
