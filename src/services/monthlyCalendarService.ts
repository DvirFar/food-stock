import { supabase } from '@/integrations/supabase/client';

export interface CalendarNote {
  id: string;
  user_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

class MonthlyCalendarService {
  async getNotesForRange(startDate: string, endDate: string): Promise<CalendarNote[]> {
    const { data, error } = await supabase
      .from('monthly_calendar_notes')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
    if (error) throw error;
    return (data || []) as CalendarNote[];
  }

  async upsertNote(date: string, content: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: existing } = await supabase
      .from('monthly_calendar_notes')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      if (content.trim() === '') {
        await supabase.from('monthly_calendar_notes').delete().eq('id', existing.id);
      } else {
        await supabase.from('monthly_calendar_notes').update({ content, updated_at: new Date().toISOString() } as any).eq('id', existing.id);
      }
    } else if (content.trim() !== '') {
      await supabase.from('monthly_calendar_notes').insert({
        user_id: user.id,
        date,
        content,
      } as any);
    }
  }
}

export const monthlyCalendarService = new MonthlyCalendarService();
