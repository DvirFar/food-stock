import { supabase } from '@/integrations/supabase/client';

export interface WeeklyMealPlan {
  id: string;
  user_id: string;
  week_start: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlanSlot {
  id: string;
  plan_id: string;
  day_of_week: number;
  meal_type: 'lunch' | 'dinner';
  meal_id: string | null;
  created_at: string;
}

export interface WeeklyPlanDayNote {
  id: string;
  plan_id: string;
  day_of_week: number;
  note_type: 'lunch' | 'dinner' | 'general';
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

class WeeklyPlanService {
  /** Get Sunday of the week containing the given date */
  getWeekStart(date: Date = new Date()): string {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay()); // Sunday
    return d.toISOString().split('T')[0];
  }

  async getOrCreatePlan(weekStart: string): Promise<WeeklyMealPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Try to find existing
    const { data: existing } = await supabase
      .from('weekly_meal_plans')
      .select('*')
      .eq('week_start', weekStart)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return existing as WeeklyMealPlan;

    // Create new
    const { data, error } = await supabase
      .from('weekly_meal_plans')
      .insert({ user_id: user.id, week_start: weekStart } as any)
      .select()
      .single();
    if (error) throw error;
    return data as WeeklyMealPlan;
  }

  async getSlots(planId: string): Promise<WeeklyPlanSlot[]> {
    const { data, error } = await supabase
      .from('weekly_plan_slots')
      .select('*')
      .eq('plan_id', planId);
    if (error) throw error;
    return (data || []) as WeeklyPlanSlot[];
  }

  async upsertSlot(planId: string, dayOfWeek: number, mealType: 'lunch' | 'dinner', mealId: string | null): Promise<void> {
    // Check if slot exists
    const { data: existing } = await supabase
      .from('weekly_plan_slots')
      .select('id')
      .eq('plan_id', planId)
      .eq('day_of_week', dayOfWeek)
      .eq('meal_type', mealType)
      .maybeSingle();

    if (existing) {
      if (mealId === null) {
        await supabase.from('weekly_plan_slots').delete().eq('id', existing.id);
      } else {
        await supabase.from('weekly_plan_slots').update({ meal_id: mealId } as any).eq('id', existing.id);
      }
    } else if (mealId !== null) {
      await supabase.from('weekly_plan_slots').insert({
        plan_id: planId,
        day_of_week: dayOfWeek,
        meal_type: mealType,
        meal_id: mealId,
      } as any);
    }
  }

  async getNotes(planId: string): Promise<WeeklyPlanDayNote[]> {
    const { data, error } = await supabase
      .from('weekly_plan_day_notes')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order');
    if (error) throw error;
    return (data || []) as WeeklyPlanDayNote[];
  }

  async upsertNote(planId: string, dayOfWeek: number, noteType: 'lunch' | 'dinner' | 'general', content: string): Promise<void> {
    // Find existing note
    const { data: existing } = await supabase
      .from('weekly_plan_day_notes')
      .select('id')
      .eq('plan_id', planId)
      .eq('day_of_week', dayOfWeek)
      .eq('note_type', noteType)
      .maybeSingle();

    if (existing) {
      await supabase.from('weekly_plan_day_notes').update({ content, updated_at: new Date().toISOString() } as any).eq('id', existing.id);
    } else {
      await supabase.from('weekly_plan_day_notes').insert({
        plan_id: planId,
        day_of_week: dayOfWeek,
        note_type: noteType,
        content,
      } as any);
    }
  }
}

export const weeklyPlanService = new WeeklyPlanService();
