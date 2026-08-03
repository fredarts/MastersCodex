'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type DialogType = 'alert' | 'confirm' | 'prompt';
export type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface DialogOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface InternalDialogState extends DialogOptions {
  isOpen: boolean;
  type: DialogType;
  resolve?: (value: any) => void;
}

interface CustomDialogContextType {
  dialogState: InternalDialogState;
  showAlert: (options: string | DialogOptions) => Promise<void>;
  showConfirm: (options: string | DialogOptions) => Promise<boolean>;
  showPrompt: (options: string | DialogOptions) => Promise<string | null>;
  closeDialog: (value: any) => void;
}

const CustomDialogContext = createContext<CustomDialogContextType | undefined>(undefined);

export function CustomDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<InternalDialogState>({
    isOpen: false,
    type: 'alert',
    title: '',
  });

  const closeDialog = useCallback((value: any) => {
    setDialogState((prev) => {
      if (prev.resolve) {
        prev.resolve(value);
      }
      return { ...prev, isOpen: false, resolve: undefined };
    });
  }, []);

  const showAlert = useCallback((options: string | DialogOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      const opts: DialogOptions = typeof options === 'string' ? { title: options } : options;
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText || 'OK',
        variant: opts.variant || 'info',
        resolve: () => resolve(),
      });
    });
  }, []);

  const showConfirm = useCallback((options: string | DialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const opts: DialogOptions = typeof options === 'string' ? { title: options } : options;
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar',
        variant: opts.variant || 'warning',
        resolve: (val: boolean) => resolve(Boolean(val)),
      });
    });
  }, []);

  const showPrompt = useCallback((options: string | DialogOptions): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      const opts: DialogOptions = typeof options === 'string' ? { title: options } : options;
      setDialogState({
        isOpen: true,
        type: 'prompt',
        title: opts.title,
        message: opts.message,
        defaultValue: opts.defaultValue || '',
        placeholder: opts.placeholder || '',
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar',
        variant: opts.variant || 'info',
        resolve: (val: string | null) => resolve(val),
      });
    });
  }, []);

  return (
    <CustomDialogContext.Provider
      value={{
        dialogState,
        showAlert,
        showConfirm,
        showPrompt,
        closeDialog,
      }}
    >
      {children}
    </CustomDialogContext.Provider>
  );
}

export function useCustomDialog() {
  const context = useContext(CustomDialogContext);
  if (!context) {
    throw new Error('useCustomDialog must be used within a CustomDialogProvider');
  }
  return context;
}
