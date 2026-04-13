import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  user_id: string;
  date: string;
  description: string;
  time_display: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

class MonthlyCalendarService {
  async getEventsForRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('monthly_calendar_events')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('sort_order', { ascending: true })
      .order('time_display', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data || []) as CalendarEvent[];
  }

  async addEvent(date: string, description: string, timeDisplay: string | null): Promise<CalendarEvent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('monthly_calendar_events')
      .insert({ user_id: user.id, date, description, time_display: timeDisplay } as any)
      .select()
      .single();
    if (error) throw error;
    return data as CalendarEvent;
  }

  async updateEvent(id: string, updates: { description?: string; time_display?: string | null }): Promise<void> {
    const { error } = await supabase
      .from('monthly_calendar_events')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (error) throw error;
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('monthly_calendar_events')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

export const monthlyCalendarService = new MonthlyCalendarService();
