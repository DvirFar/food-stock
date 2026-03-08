import { supabase } from '@/integrations/supabase/client';

export interface ShabbatPlan {
  id: string;
  user_id: string;
  week_start: string;
  friday_meal_id: string | null;
  saturday_meal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShabbatExtraRecipe {
  id: string;
  plan_id: string;
  recipe_id: string;
  sort_order: number;
  created_at: string;
}

export interface ShabbatDishAssignment {
  id: string;
  plan_id: string;
  round: 'friday' | 'saturday_morning' | 'saturday_evening';
  sink: number;
  person: string;
  created_at: string;
  updated_at: string;
}

class ShabbatPlanService {
  /** Get the Friday of the week containing the given date */
  getWeekFriday(date: Date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    // Move to Friday (day 5)
    const diff = day <= 5 ? 5 - day : 5 - day + 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }

  async getOrCreatePlan(weekStart: string): Promise<ShabbatPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: existing } = await supabase
      .from('shabbat_plans')
      .select('*')
      .eq('week_start', weekStart)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return existing as ShabbatPlan;

    const { data, error } = await supabase
      .from('shabbat_plans')
      .insert({ user_id: user.id, week_start: weekStart } as any)
      .select()
      .single();
    if (error) throw error;
    return data as ShabbatPlan;
  }

  async updateMealAssignment(planId: string, field: 'friday_meal_id' | 'saturday_meal_id', mealId: string | null): Promise<void> {
    const { error } = await supabase
      .from('shabbat_plans')
      .update({ [field]: mealId } as any)
      .eq('id', planId);
    if (error) throw error;
  }

  async getExtraRecipes(planId: string): Promise<ShabbatExtraRecipe[]> {
    const { data, error } = await supabase
      .from('shabbat_extra_recipes')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order');
    if (error) throw error;
    return (data || []) as ShabbatExtraRecipe[];
  }

  async addExtraRecipe(planId: string, recipeId: string, sortOrder: number): Promise<void> {
    const { error } = await supabase
      .from('shabbat_extra_recipes')
      .insert({ plan_id: planId, recipe_id: recipeId, sort_order: sortOrder } as any);
    if (error) throw error;
  }

  async removeExtraRecipe(id: string): Promise<void> {
    const { error } = await supabase
      .from('shabbat_extra_recipes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getDishAssignments(planId: string): Promise<ShabbatDishAssignment[]> {
    const { data, error } = await supabase
      .from('shabbat_dish_assignments')
      .select('*')
      .eq('plan_id', planId);
    if (error) throw error;
    return (data || []) as ShabbatDishAssignment[];
  }

  async upsertDishAssignment(planId: string, round: string, sink: number, person: string): Promise<void> {
    const { data: existing } = await supabase
      .from('shabbat_dish_assignments')
      .select('id')
      .eq('plan_id', planId)
      .eq('round', round)
      .eq('sink', sink)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('shabbat_dish_assignments')
        .update({ person, updated_at: new Date().toISOString() } as any)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('shabbat_dish_assignments')
        .insert({ plan_id: planId, round, sink, person } as any);
    }
  }
}

export const shabbatPlanService = new ShabbatPlanService();
