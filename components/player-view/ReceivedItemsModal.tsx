'use client';

import React from 'react';
import { 
  Package, 
  Sparkles, 
  Swords, 
  Shield, 
  FlaskConical, 
  BookOpen, 
  FileText, 
  X, 
  CheckCircle2, 
  ArrowDownToLine,
  UserCheck
} from 'lucide-react';
import { CharacterEquipmentItem, DirectTransferPayload } from '@/lib/types';

interface ReceivedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferPayload: DirectTransferPayload | null;
  onCollectItems: (payload: DirectTransferPayload) => void;
  isCollecting?: boolean;
}

export const ReceivedItemsModal: React.FC<ReceivedItemsModalProps> = ({
  isOpen,
  onClose,
  transferPayload,
  onCollectItems,
  isCollecting = false,
}) => {
  if (!isOpen || !transferPayload) return null;

  const rawItems: CharacterEquipmentItem[] = [];
  if (Array.isArray(transferPayload.items) && transferPayload.items.length > 0) {
    rawItems.push(...transferPayload.items);
  } else if (transferPayload.item) {
    rawItems.push(transferPayload.item);
  }

  const getItemIcon = (item: CharacterEquipmentItem) => {
    if (item.itemType === 'weapon' || item.weaponProps) {
      return <Swords className="w-4 h-4 text-amber-400" />;
    }
    if (item.itemType === 'armor' || item.armorProps) {
      return <Shield className="w-4 h-4 text-blue-400" />;
    }
    if (item.itemType === 'potion' || item.potionProps) {
      return <FlaskConical className="w-4 h-4 text-emerald-400" />;
    }
    if (item.readableContent) {
      return <BookOpen className="w-4 h-4 text-purple-400" />;
    }
    return <Package className="w-4 h-4 text-slate-400" />;
  };

  const getRarityBadge = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'incomum':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'raro':
        return 'text-blue-400 bg-blue-950/60 border-blue-500/40';
      case 'muito raro':
        return 'text-purple-400 bg-purple-950/60 border-purple-500/40';
      case 'lendário':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'artefato':
        return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
      default:
        return 'text-slate-400 bg-slate-800/60 border-slate-700/40';
    }
  };

  const totalItemCount = rawItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c1017] border-2 border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-500/20 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#232d40] bg-[#111723]/90 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black font-serif text-slate-100 flex items-center gap-2">
                <span>Presente de Grupo Recebido</span>
                <span className="text-[10px] font-mono font-normal text-amber-400 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  D&D 5e Trade
                </span>
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <span>De:</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  {transferPayload.fromCharacterName}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {totalItemCount} {totalItemCount === 1 ? 'item enviado' : 'itens enviados'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1a2334] rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Items List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar bg-[#090d14]">
          <p className="text-xs text-slate-400 mb-2">
            Os seguintes itens foram enviados para o seu inventário. Clique em <strong className="text-amber-300">Coletar Itens</strong> para guardá-los na sua ficha:
          </p>

          <div className="space-y-2">
            {rawItems.map((item, idx) => (
              <div
                key={`received_${item.id || idx}_${idx}`}
                className="p-3 rounded-xl bg-[#111723] border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col gap-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0a0d14] border border-[#232d40] flex items-center justify-center shrink-0">
                      {getItemIcon(item)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-100 truncate font-serif">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${getRarityBadge(item.rarity)}`}>
                          {item.rarity || 'Comum'}
                        </span>
                        {item.weight && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.weight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                      x{item.quantity || 1}
                    </span>
                  </div>
                </div>

                {/* Sub-properties details */}
                {item.weaponProps && (
                  <div className="text-[11px] font-mono text-amber-300/90 bg-amber-950/30 border border-amber-500/20 rounded-md px-2 py-1 flex items-center gap-2">
                    <Swords className="w-3 h-3 text-amber-400" />
                    <span>Dano: {item.weaponProps.damage} ({item.weaponProps.damageType || 'Cortante'})</span>
                    {item.weaponProps.atkBonus !== undefined && item.weaponProps.atkBonus !== 0 && (
                      <span className="text-amber-400">| Bônus: +{item.weaponProps.atkBonus}</span>
                    )}
                  </div>
                )}

                {item.potionProps && (
                  <div className="text-[11px] font-mono text-emerald-300/90 bg-emerald-950/30 border border-emerald-500/20 rounded-md px-2 py-1 flex items-center gap-2">
                    <FlaskConical className="w-3 h-3 text-emerald-400" />
                    <span>Cura: {item.potionProps.healingDice || 'Recuperação'}</span>
                    {item.potionProps.effectDesc && (
                      <span className="text-slate-400 truncate">• {item.potionProps.effectDesc}</span>
                    )}
                  </div>
                )}

                {item.readableContent && (
                  <div className="text-[11px] text-purple-300/90 bg-purple-950/30 border border-purple-500/20 rounded-md px-2 py-1 flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-purple-400" />
                    <span className="font-serif italic font-bold">"{item.readableContent.title || 'Documento'}"</span>
                    {item.readableContent.author && (
                      <span className="text-slate-400 text-[10px]">por {item.readableContent.author}</span>
                    )}
                  </div>
                )}

                {item.notes && !item.weaponProps && !item.potionProps && !item.readableContent && (
                  <p className="text-[11px] text-slate-400 italic pl-1">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#232d40] bg-[#111723]/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-[#1a2334] rounded-xl transition-all cursor-pointer"
          >
            Depois
          </button>

          <button
            onClick={() => onCollectItems(transferPayload)}
            disabled={isCollecting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black font-serif text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {isCollecting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Guardando na Ficha...</span>
              </>
            ) : (
              <>
                <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
                <span>Coletar Itens para a Ficha</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
