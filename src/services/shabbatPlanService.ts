import { supabase } from '@/integrations/supabase/client';
import { Recipe } from '@/types';

export interface ShabbatPlan {
  id: string;
  user_id: string;
  week_start: string;
  created_at: string;
  updated_at: string;
}

export interface ShabbatPlanSection {
  id: string;
  plan_id: string;
  slot: 'friday' | 'saturday';
  name: string;
  sort_order: number;
  created_at: string;
  recipes: ShabbatSectionRecipe[];
}

export interface ShabbatSectionRecipe {
  id: string;
  section_id: string;
  recipe_id: string | null;
  custom_name?: string | null;
  sort_order: number;
  is_done: boolean;
  assigned_to: string;
  created_at: string;
  recipe?: Recipe;
}

export interface ShabbatExtraRecipe {
  id: string;
  plan_id: string;
  recipe_id: string | null;
  custom_name?: string | null;
  sort_order: number;
  is_done: boolean;
  assigned_to: string;
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

export interface ShabbatDefaultSection {
  id: string;
  user_id: string;
  slot: 'friday' | 'saturday';
  name: string;
  sort_order: number;
  recipes: ShabbatDefaultRecipe[];
}

export interface ShabbatDefaultRecipe {
  id: string;
  section_id: string;
  recipe_id: string;
  sort_order: number;
  recipe?: Recipe;
}

const DEFAULT_SECTIONS = ['מנה ראשונה', 'מנה עיקרית', 'תוספות', 'קינוח'];

class ShabbatPlanService {
  getWeekFriday(date: Date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day <= 5 ? 5 - day : 5 - day + 7;
    d.setDate(d.getDate() + diff);
    return new Intl.DateTimeFormat("sv-SE").format(d);
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

    if (existing) return existing as unknown as ShabbatPlan;

    const { data, error } = await supabase
      .from('shabbat_plans')
      .insert({ user_id: user.id, week_start: weekStart } as any)
      .select()
      .single();
    if (error) throw error;

    // Build sections from the user's defaults (fallback to built-in defaults)
    const defaults = await this.getDefaultSections();

    if (defaults.length > 0) {
      const { data: createdSections } = await supabase
        .from('shabbat_plan_sections')
        .insert(defaults.map(d => ({
          plan_id: data.id,
          slot: d.slot,
          name: d.name,
          sort_order: d.sort_order,
        })) as any)
        .select();

      const recipeRows: any[] = [];
      (createdSections || []).forEach(section => {
        const def = defaults.find(d => d.slot === (section as any).slot && d.name === (section as any).name);
        def?.recipes.forEach(r => {
          recipeRows.push({ section_id: section.id, recipe_id: r.recipe_id, sort_order: r.sort_order });
        });
      });
      if (recipeRows.length > 0) {
        await supabase.from('shabbat_section_recipes').insert(recipeRows as any);
      }
    } else {
      const sectionsToInsert = ['friday', 'saturday'].flatMap(slot =>
        DEFAULT_SECTIONS.map((name, i) => ({
          plan_id: data.id,
          slot,
          name,
          sort_order: i,
        }))
      );
      await supabase.from('shabbat_plan_sections').insert(sectionsToInsert as any);
    }

    return data as unknown as ShabbatPlan;
  }

  // ---- Defaults management ----

  async getDefaultSections(): Promise<ShabbatDefaultSection[]> {
    const { data: sections, error } = await supabase
      .from('shabbat_default_sections')
      .select('*')
      .order('sort_order');
    if (error) throw error;

    const ids = (sections || []).map(s => s.id);
    let rows: any[] = [];
    if (ids.length > 0) {
      const { data, error: rErr } = await supabase
        .from('shabbat_default_recipes')
        .select('*')
        .in('section_id', ids)
        .order('sort_order');
      if (rErr) throw rErr;
      rows = data || [];
    }

    const recipeIds = [...new Set(rows.map(r => r.recipe_id))];
    let recipesMap: Record<string, Recipe> = {};
    if (recipeIds.length > 0) {
      const { data: recipes } = await supabase.from('recipes').select('*').in('id', recipeIds);
      if (recipes) recipesMap = Object.fromEntries(recipes.map(r => [r.id, r as unknown as Recipe]));
    }

    return (sections || []).map(s => ({
      ...(s as any),
      slot: (s as any).slot as 'friday' | 'saturday',
      recipes: rows
        .filter(r => r.section_id === s.id)
        .map(r => ({ ...r, recipe: recipesMap[r.recipe_id] })),
    }));
  }

  async createDefaultSectionsFromBuiltIn(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const rows = ['friday', 'saturday'].flatMap(slot =>
      DEFAULT_SECTIONS.map((name, i) => ({ user_id: user.id, slot, name, sort_order: i }))
    );
    const { error } = await supabase.from('shabbat_default_sections').insert(rows as any);
    if (error) throw error;
  }

  async addDefaultSection(slot: string, name: string, sortOrder: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('shabbat_default_sections')
      .insert({ user_id: user.id, slot, name, sort_order: sortOrder } as any);
    if (error) throw error;
  }

  async deleteDefaultSection(id: string): Promise<void> {
    const { error } = await supabase.from('shabbat_default_sections').delete().eq('id', id);
    if (error) throw error;
  }

  async addDefaultRecipe(sectionId: string, recipeId: string, sortOrder: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('shabbat_default_recipes')
      .insert({ user_id: user.id, section_id: sectionId, recipe_id: recipeId, sort_order: sortOrder } as any);
    if (error) throw error;
  }

  async removeDefaultRecipe(id: string): Promise<void> {
    const { error } = await supabase.from('shabbat_default_recipes').delete().eq('id', id);
    if (error) throw error;
  }

  async applyDefaultsToPlan(planId: string): Promise<void> {
    const defaults = await this.getDefaultSections();
    if (defaults.length === 0) return;

    const existingSections = await this.getSections(planId);

    for (const def of defaults) {
      let section = existingSections.find(s => s.slot === def.slot && s.name === def.name);
      if (!section) {
        const { data, error } = await supabase
          .from('shabbat_plan_sections')
          .insert({ plan_id: planId, slot: def.slot, name: def.name, sort_order: def.sort_order } as any)
          .select()
          .single();
        if (error) throw error;
        section = { ...(data as any), slot: def.slot, recipes: [] };
      }
      const existingRecipeIds = new Set(section.recipes.map(r => r.recipe_id));
      const toInsert = def.recipes
        .filter(r => !existingRecipeIds.has(r.recipe_id))
        .map((r, i) => ({
          section_id: section!.id,
          recipe_id: r.recipe_id,
          sort_order: section!.recipes.length + i,
        }));
      if (toInsert.length > 0) {
        await supabase.from('shabbat_section_recipes').insert(toInsert as any);
      }
    }
  }


  async getSections(planId: string): Promise<ShabbatPlanSection[]> {
    const { data: sections, error } = await supabase
      .from('shabbat_plan_sections')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order');
    if (error) throw error;

    const sectionIds = (sections || []).map(s => s.id);
    let sectionRecipes: any[] = [];
    if (sectionIds.length > 0) {
      const { data, error: srErr } = await supabase
        .from('shabbat_section_recipes')
        .select('*')
        .in('section_id', sectionIds)
        .order('sort_order');
      if (srErr) throw srErr;
      sectionRecipes = data || [];
    }

    // Fetch referenced recipes
    const recipeIds = [...new Set(sectionRecipes.map(sr => sr.recipe_id).filter(Boolean))];
    let recipesMap: Record<string, Recipe> = {};
    if (recipeIds.length > 0) {
      const { data: recipes } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds);
      if (recipes) {
        recipesMap = Object.fromEntries(recipes.map(r => [r.id, r as unknown as Recipe]));
      }
    }

    return (sections || []).map(section => ({
      ...section,
      slot: section.slot as 'friday' | 'saturday',
      recipes: sectionRecipes
        .filter(sr => sr.section_id === section.id)
        .map(sr => ({ ...sr, recipe: sr.recipe_id ? recipesMap[sr.recipe_id] : undefined })),
    }));
  }

  async addSection(planId: string, slot: string, name: string, sortOrder: number): Promise<void> {
    const { error } = await supabase
      .from('shabbat_plan_sections')
      .insert({ plan_id: planId, slot, name, sort_order: sortOrder } as any);
    if (error) throw error;
  }

  async deleteSection(sectionId: string): Promise<void> {
    const { error } = await supabase
      .from('shabbat_plan_sections')
      .delete()
      .eq('id', sectionId);
    if (error) throw error;
  }

  async reorderSections(sectionIds: string[]): Promise<void> {
    await Promise.all(sectionIds.map((id, i) =>
      supabase.from('shabbat_plan_sections').update({ sort_order: i } as any).eq('id', id)
    ));
  }

  async reorderSectionRecipes(recipeEntryIds: string[]): Promise<void> {
    await Promise.all(recipeEntryIds.map((id, i) =>
      supabase.from('shabbat_section_recipes').update({ sort_order: i } as any).eq('id', id)
    ));
  }


  async addRecipeToSection(sectionId: string, recipeId: string | null, sortOrder: number, customName?: string): Promise<void> {
    const { error } = await supabase
      .from('shabbat_section_recipes')
      .insert({ section_id: sectionId, recipe_id: recipeId, custom_name: recipeId ? null : (customName || '').trim(), sort_order: sortOrder } as any);
    if (error) throw error;
  }

  async removeRecipeFromSection(id: string): Promise<void> {
    const { error } = await supabase
      .from('shabbat_section_recipes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async updateSectionRecipe(id: string, updates: { is_done?: boolean; assigned_to?: string }): Promise<void> {
    const { error } = await supabase
      .from('shabbat_section_recipes')
      .update(updates as any)
      .eq('id', id);
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

  async addExtraRecipe(planId: string, recipeId: string | null, sortOrder: number, customName?: string): Promise<void> {
    const { error } = await supabase
      .from('shabbat_extra_recipes')
      .insert({ plan_id: planId, recipe_id: recipeId, custom_name: recipeId ? null : (customName || '').trim(), sort_order: sortOrder } as any);
    if (error) throw error;
  }

  async updateExtraRecipe(id: string, updates: { is_done?: boolean; assigned_to?: string }): Promise<void> {
    const { error } = await supabase
      .from('shabbat_extra_recipes')
      .update(updates as any)
      .eq('id', id);
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
