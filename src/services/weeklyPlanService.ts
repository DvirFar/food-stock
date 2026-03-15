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

export interface WeeklySlotRecipe {
  id: string;
  plan_id: string;
  day_of_week: number;
  meal_type: 'lunch' | 'dinner';
  recipe_id: string;
  sort_order: number;
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
  getWeekStart(date: Date = new Date()): string {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }

  async getOrCreatePlan(weekStart: string): Promise<WeeklyMealPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: existing } = await supabase
      .from('weekly_meal_plans')
      .select('*')
      .eq('week_start', weekStart)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return existing as WeeklyMealPlan;

    const { data, error } = await supabase
      .from('weekly_meal_plans')
      .insert({ user_id: user.id, week_start: weekStart } as any)
      .select()
      .single();
    if (error) throw error;
    return data as WeeklyMealPlan;
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

  // --- Direct recipe slots ---

  async getSlotRecipes(planId: string): Promise<WeeklySlotRecipe[]> {
    const { data, error } = await supabase
      .from('weekly_slot_recipes')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order');
    if (error) throw error;
    return (data || []) as WeeklySlotRecipe[];
  }

  async addSlotRecipe(planId: string, dayOfWeek: number, mealType: 'lunch' | 'dinner', recipeId: string, sortOrder: number): Promise<void> {
    const { error } = await supabase
      .from('weekly_slot_recipes')
      .insert({ plan_id: planId, day_of_week: dayOfWeek, meal_type: mealType, recipe_id: recipeId, sort_order: sortOrder } as any);
    if (error) throw error;
  }

  async removeSlotRecipe(id: string): Promise<void> {
    const { error } = await supabase.from('weekly_slot_recipes').delete().eq('id', id);
    if (error) throw error;
  }

  async clearSlotRecipes(planId: string, dayOfWeek: number, mealType: 'lunch' | 'dinner'): Promise<void> {
    const { error } = await supabase
      .from('weekly_slot_recipes')
      .delete()
      .eq('plan_id', planId)
      .eq('day_of_week', dayOfWeek)
      .eq('meal_type', mealType);
    if (error) throw error;
  }
}

export const weeklyPlanService = new WeeklyPlanService();
