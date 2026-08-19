import { CombatLogEntry } from '@/lib/types';

const STORAGE_PREFIX = 'codex_roll_history_';
const MAX_LOG_RETENTION = 1000;

export const rollHistoryService = {
  /**
   * Salva o histórico de rolagens e logs de combate para uma campanha
   */
  saveRollHistory(campaignId: string, logs: CombatLogEntry[]): void {
    if (typeof window === 'undefined' || !campaignId) return;
    try {
      // Limitar a retenção aos últimos N registros
      const trimmed = logs.slice(-MAX_LOG_RETENTION);
      localStorage.setItem(`${STORAGE_PREFIX}${campaignId}`, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('Erro ao salvar histórico de rolagens no LocalStorage:', err);
    }
  },

  /**
   * Carrega o histórico de rolagens de uma campanha
   */
  loadRollHistory(campaignId: string): CombatLogEntry[] {
    if (typeof window === 'undefined' || !campaignId) return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${campaignId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Erro ao carregar histórico de rolagens do LocalStorage:', err);
      return [];
    }
  },

  /**
   * Adiciona uma única entrada ao histórico persistido
   */
  appendRollEntry(campaignId: string, entry: CombatLogEntry): void {
    if (typeof window === 'undefined' || !campaignId || !entry) return;
    try {
      const current = this.loadRollHistory(campaignId);
      if (current.some((l) => l.id === entry.id)) return;
      current.push(entry);
      this.saveRollHistory(campaignId, current);
    } catch (err) {
      console.warn('Erro ao anexar entrada de rolagem:', err);
    }
  },

  /**
   * Limpa o histórico de rolagens de uma campanha
   */
  clearRollHistory(campaignId: string): void {
    if (typeof window === 'undefined' || !campaignId) return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${campaignId}`);
    } catch (err) {
      console.warn('Erro ao limpar histórico de rolagens:', err);
    }
  },

  /**
   * Exporta os registros em formato de texto legível, JSON ou CSV
   */
  exportRollHistory(
    campaignName: string,
    logs: CombatLogEntry[],
    format: 'txt' | 'json' | 'csv'
  ): string {
    if (format === 'json') {
      return JSON.stringify(
        {
          campaign: campaignName,
          exportedAt: new Date().toISOString(),
          totalEntries: logs.length,
          logs,
        },
        null,
        2
      );
    }

    if (format === 'csv') {
      const headers = ['Timestamp', 'Ator', 'Alvo', 'Tipo', 'd20', 'Total', 'Crítico', 'Falha', 'Descrição'];
      const rows = logs.map((l) => [
        `"${l.timestamp || ''}"`,
        `"${l.actorName || ''}"`,
        `"${l.targetName || ''}"`,
        `"${l.eventType || ''}"`,
        l.d20Roll ?? '',
        l.totalRoll ?? '',
        l.isCrit ? 'SIM' : 'NÃO',
        l.isFail ? 'SIM' : 'NÃO',
        `"${(l.description || '').replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    // Formato TXT padrão para relatórios de sessão de RPG
    const lines: string[] = [
      `==================================================`,
      ` HISTÓRICO DE ROLAGENS E COMBATE - MASTERS CODEX`,
      ` Campanha: ${campaignName}`,
      ` Exportado em: ${new Date().toLocaleString('pt-BR')}`,
      ` Total de Registros: ${logs.length}`,
      `==================================================\n`,
    ];

    logs.forEach((l, idx) => {
      const critText = l.isCrit ? ' [★ CRÍTICO]' : l.isFail ? ' [💀 FALHA]' : '';
      const rollInfo = l.d20Roll !== undefined ? ` (d20: ${l.d20Roll} | Total: ${l.totalRoll})` : '';
      lines.push(`[${l.timestamp || '--:--'}] ${l.actorName || 'Sistema'}${rollInfo}${critText}`);
      lines.push(`  → ${l.description}`);
      lines.push('--------------------------------------------------');
    });

    return lines.join('\n');
  },

  /**
   * Faz o download do arquivo exportado diretamente pelo navegador
   */
  downloadExportedFile(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
