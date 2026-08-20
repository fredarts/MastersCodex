import { 
  CampaignCalendarConfig, 
  CampaignCalendarState, 
  CalendarEventNote, 
} from '@/lib/types/calendar';
import { Result } from '@/lib/types';
import { DEFAULT_CALENDAR_CONFIG } from '@/lib/calendar/calendarPresets';
import { dateToAbsoluteDays } from '@/lib/calendar/calendarEngine';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_PREFIX_CONFIG = 'masters_codex_calendar_config_';
const STORAGE_PREFIX_STATE = 'masters_codex_calendar_state_';
const STORAGE_PREFIX_NOTES = 'masters_codex_calendar_notes_';

export const calendarService = {
  async fetchCalendarConfig(campaignId: string): Promise<Result<CampaignCalendarConfig>> {
    try {
      if (!campaignId) {
        return { ok: true, value: DEFAULT_CALENDAR_CONFIG };
      }

      // 1. Tenta Supabase se configurado
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('campaigns')
            .select('calendar_config')
            .eq('id', campaignId)
            .single();

          if (!error && data?.calendar_config) {
            return { ok: true, value: data.calendar_config as CampaignCalendarConfig };
          }
        } catch (dbErr) {
          console.warn('[CalendarService] Supabase config fetch error, falling back to local storage', dbErr);
        }
      }

      // 2. Fallback LocalStorage
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`${STORAGE_PREFIX_CONFIG}${campaignId}`);
        if (local) {
          const parsed = JSON.parse(local);
          return { ok: true, value: parsed };
        }
      }

      return { ok: true, value: DEFAULT_CALENDAR_CONFIG };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar configuração de calendário.'),
      };
    }
  },

  async saveCalendarConfig(campaignId: string, config: CampaignCalendarConfig): Promise<Result<void>> {
    try {
      if (!campaignId) return { ok: true, value: undefined };

      // LocalStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_PREFIX_CONFIG}${campaignId}`, JSON.stringify(config));
      }

      // Supabase
      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('campaigns')
            .update({ calendar_config: config })
            .eq('id', campaignId);
        } catch (dbErr) {
          console.warn('[CalendarService] Supabase config save error:', dbErr);
        }
      }

      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao salvar configuração do calendário.'),
      };
    }
  },

  async fetchCalendarState(
    campaignId: string,
    config: CampaignCalendarConfig = DEFAULT_CALENDAR_CONFIG
  ): Promise<Result<CampaignCalendarState>> {
    try {
      const defaultState: CampaignCalendarState = {
        currentYear: config.startingYear || 1492,
        currentMonthIndex: config.startingMonthIndex || 0,
        currentDay: config.startingDay || 1,
        currentHour: config.startingHour || 8,
        currentMinute: config.startingMinute || 0,
        totalDaysElapsed: dateToAbsoluteDays(
          config,
          config.startingYear || 1492,
          config.startingMonthIndex || 0,
          config.startingDay || 1
        ),
      };

      if (!campaignId) {
        return { ok: true, value: defaultState };
      }

      // 1. Tenta Supabase
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('campaigns')
            .select('calendar_state')
            .eq('id', campaignId)
            .single();

          if (!error && data?.calendar_state) {
            return { ok: true, value: data.calendar_state as CampaignCalendarState };
          }
        } catch (dbErr) {
          console.warn('[CalendarService] Supabase state fetch fallback', dbErr);
        }
      }

      // 2. LocalStorage
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`${STORAGE_PREFIX_STATE}${campaignId}`);
        if (local) {
          const parsed = JSON.parse(local);
          return { ok: true, value: parsed };
        }
      }

      return { ok: true, value: defaultState };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar estado do calendário.'),
      };
    }
  },

  async saveCalendarState(campaignId: string, state: CampaignCalendarState): Promise<Result<void>> {
    try {
      if (!campaignId) return { ok: true, value: undefined };

      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_PREFIX_STATE}${campaignId}`, JSON.stringify(state));
      }

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('campaigns')
            .update({ calendar_state: state })
            .eq('id', campaignId);
        } catch (dbErr) {
          console.warn('[CalendarService] Supabase state save error:', dbErr);
        }
      }

      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao salvar estado do calendário.'),
      };
    }
  },

  async fetchCalendarNotes(campaignId: string): Promise<Result<CalendarEventNote[]>> {
    try {
      if (!campaignId) return { ok: true, value: [] };

      // 1. Supabase
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('campaign_calendar_notes')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('year', { ascending: true })
            .order('month_index', { ascending: true })
            .order('day', { ascending: true });

          if (!error && data) {
            const mapped: CalendarEventNote[] = data.map((d: any) => ({
              id: d.id,
              campaignId: d.campaign_id,
              year: d.year,
              monthIndex: d.month_index,
              day: d.day,
              hour: d.hour,
              minute: d.minute,
              title: d.title,
              content: d.content,
              category: d.category || 'note',
              authorRole: d.author_role || 'dm',
              sessionId: d.session_id,
              sceneId: d.scene_id,
              isCompleted: d.is_completed,
              createdAt: d.created_at,
            }));
            return { ok: true, value: mapped };
          }
        } catch (dbErr) {
          console.warn('[CalendarService] Supabase notes fallback to local', dbErr);
        }
      }

      // 2. LocalStorage
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`${STORAGE_PREFIX_NOTES}${campaignId}`);
        if (local) {
          const parsed = JSON.parse(local);
          return { ok: true, value: parsed };
        }
      }

      return { ok: true, value: [] };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao buscar notas do calendário.'),
      };
    }
  },

  async createCalendarNote(noteData: Omit<CalendarEventNote, 'id' | 'createdAt'>): Promise<Result<CalendarEventNote>> {
    try {
      const newId = `cal-note-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newNote: CalendarEventNote = {
        ...noteData,
        id: newId,
        createdAt: new Date().toISOString(),
      };

      // 1. Supabase se configurado
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('campaign_calendar_notes').insert({
            id: newNote.id,
            campaign_id: newNote.campaignId,
            year: newNote.year,
            month_index: newNote.monthIndex,
            day: newNote.day,
            hour: newNote.hour,
            minute: newNote.minute,
            title: newNote.title,
            content: newNote.content,
            category: newNote.category,
            author_role: newNote.authorRole,
            session_id: newNote.sessionId,
            scene_id: newNote.sceneId,
            is_completed: newNote.isCompleted || false,
          });
        } catch (dbErr) {
          console.warn('[CalendarService] Supabase note insert error:', dbErr);
        }
      }

      // 2. LocalStorage
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`${STORAGE_PREFIX_NOTES}${newNote.campaignId}`);
        const list: CalendarEventNote[] = local ? JSON.parse(local) : [];
        list.push(newNote);
        localStorage.setItem(`${STORAGE_PREFIX_NOTES}${newNote.campaignId}`, JSON.stringify(list));
      }

      return { ok: true, value: newNote };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao criar nota no calendário.'),
      };
    }
  },

  async deleteCalendarNote(id: string, campaignId: string): Promise<Result<void>> {
    try {
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('campaign_calendar_notes').delete().eq('id', id);
        } catch (dbErr) {
          console.warn('[CalendarService] Supabase note delete error:', dbErr);
        }
      }

      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`${STORAGE_PREFIX_NOTES}${campaignId}`);
        if (local) {
          const list: CalendarEventNote[] = JSON.parse(local);
          const filtered = list.filter((n) => n.id !== id);
          localStorage.setItem(`${STORAGE_PREFIX_NOTES}${campaignId}`, JSON.stringify(filtered));
        }
      }

      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao excluir nota do calendário.'),
      };
    }
  },
};
