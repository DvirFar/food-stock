// Recipe service - handles all recipe-related operations using Supabase

import { supabase } from '@/integrations/supabase/client';
import { Recipe, RecipeIngredient } from '@/types';

class RecipeService {
  async getAll(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Transform the data to match our Recipe interface
    return (data || []).map(recipe => ({
      ...recipe,
      ingredients: (recipe.ingredients as unknown as RecipeIngredient[]) || [],
      instructions: recipe.instructions || [],
      tags: recipe.tags || [],
    })) as Recipe[];
  }

  async getById(id: string): Promise<Recipe | undefined> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return undefined;
    
    return {
      ...data,
      ingredients: (data.ingredients as unknown as RecipeIngredient[]) || [],
      instructions: data.instructions || [],
      tags: data.tags || [],
    } as Recipe;
  }

  async searchByTag(tag: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .contains('tags', [tag])
      .order('name');
    
    if (error) throw error;
    
    return (data || []).map(recipe => ({
      ...recipe,
      ingredients: (recipe.ingredients as unknown as RecipeIngredient[]) || [],
      instructions: recipe.instructions || [],
      tags: recipe.tags || [],
    })) as Recipe[];
  }

  async searchByIngredient(ingredientName: string): Promise<Recipe[]> {
    // Get all recipes and filter client-side since JSONB array search is complex
    const allRecipes = await this.getAll();
    return allRecipes.filter(r =>
      r.ingredients.some(i => 
        i.name.toLowerCase().includes(ingredientName.toLowerCase())
      )
    );
  }
}

export const recipeService = new RecipeService();
