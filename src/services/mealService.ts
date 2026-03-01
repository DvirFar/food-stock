import { supabase } from '@/integrations/supabase/client';
import { Recipe } from '@/types';

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  sections: MealSection[];
}

export interface MealSection {
  id: string;
  meal_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  recipes: MealSectionRecipe[];
}

export interface MealSectionRecipe {
  id: string;
  section_id: string;
  recipe_id: string;
  servings_override: number | null;
  sort_order: number;
  created_at: string;
  recipe?: Recipe;
}

const DEFAULT_SECTIONS = ['מנה ראשונה', 'מנה עיקרית', 'תוספות', 'קינוח'];

class MealService {
  async getAll(): Promise<Meal[]> {
    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;

    const mealIds = (meals || []).map(m => m.id);
    if (mealIds.length === 0) return [];

    const { data: sections, error: secErr } = await supabase
      .from('meal_sections')
      .select('*')
      .in('meal_id', mealIds)
      .order('sort_order');
    if (secErr) throw secErr;

    const sectionIds = (sections || []).map(s => s.id);
    let sectionRecipes: any[] = [];
    if (sectionIds.length > 0) {
      const { data, error: srErr } = await supabase
        .from('meal_section_recipes')
        .select('*')
        .in('section_id', sectionIds)
        .order('sort_order');
      if (srErr) throw srErr;
      sectionRecipes = data || [];
    }

    // Fetch all referenced recipes
    const recipeIds = [...new Set(sectionRecipes.map(sr => sr.recipe_id))];
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

    return (meals || []).map(meal => ({
      ...meal,
      sections: (sections || [])
        .filter(s => s.meal_id === meal.id)
        .map(section => ({
          ...section,
          recipes: sectionRecipes
            .filter(sr => sr.section_id === section.id)
            .map(sr => ({ ...sr, recipe: recipesMap[sr.recipe_id] })),
        })),
    }));
  }

  async create(name: string, description?: string): Promise<Meal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: meal, error } = await supabase
      .from('meals')
      .insert({ name, description: description || null, user_id: user.id } as any)
      .select()
      .single();
    if (error) throw error;

    // Create default sections
    const sectionsToInsert = DEFAULT_SECTIONS.map((name, i) => ({
      meal_id: meal.id,
      name,
      sort_order: i,
    }));

    const { data: sections, error: secErr } = await supabase
      .from('meal_sections')
      .insert(sectionsToInsert as any)
      .select();
    if (secErr) throw secErr;

    return {
      ...meal,
      sections: (sections || []).map(s => ({ ...s, recipes: [] })),
    };
  }

  async updateMeal(id: string, updates: { name?: string; description?: string | null }): Promise<void> {
    const { error } = await supabase.from('meals').update(updates as any).eq('id', id);
    if (error) throw error;
  }

  async deleteMeal(id: string): Promise<void> {
    const { error } = await supabase.from('meals').delete().eq('id', id);
    if (error) throw error;
  }

  async addSection(mealId: string, name: string, sortOrder: number): Promise<MealSection> {
    const { data, error } = await supabase
      .from('meal_sections')
      .insert({ meal_id: mealId, name, sort_order: sortOrder } as any)
      .select()
      .single();
    if (error) throw error;
    return { ...data, recipes: [] };
  }

  async updateSection(id: string, name: string): Promise<void> {
    const { error } = await supabase.from('meal_sections').update({ name } as any).eq('id', id);
    if (error) throw error;
  }

  async deleteSection(id: string): Promise<void> {
    const { error } = await supabase.from('meal_sections').delete().eq('id', id);
    if (error) throw error;
  }

  async addRecipeToSection(sectionId: string, recipeId: string, sortOrder: number): Promise<MealSectionRecipe> {
    const { data, error } = await supabase
      .from('meal_section_recipes')
      .insert({ section_id: sectionId, recipe_id: recipeId, sort_order: sortOrder } as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async removeRecipeFromSection(id: string): Promise<void> {
    const { error } = await supabase.from('meal_section_recipes').delete().eq('id', id);
    if (error) throw error;
  }
}

export const mealService = new MealService();
