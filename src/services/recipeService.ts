// Recipe service - handles all recipe-related operations using Supabase

import { supabase } from '@/integrations/supabase/client';
import { Recipe, RecipeIngredient } from '@/types';
import { Json } from '@/integrations/supabase/types';

interface RecipeInput {
  name: string;
  description?: string | null;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prep_time?: number | null;
  cook_time?: number | null;
  servings?: number;
  tags?: string[];
  is_public?: boolean;
  image_url?: string | null;
}

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;
const FORBIDDEN_TAG_CHARS = /[<>"\\]/;

function sanitizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  const sanitized = tags
    .map(t => t.trim().toLowerCase().slice(0, MAX_TAG_LENGTH))
    .filter(t => t.length > 0 && !FORBIDDEN_TAG_CHARS.test(t));
  return sanitized.slice(0, MAX_TAGS);
}

class RecipeService {
  async getAll(): Promise<Recipe[]> {
    // Use the recipes_public view which hides user_id for non-owners
    const { data, error } = await supabase
      .from('recipes_public')
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
    // Use the recipes_public view which hides user_id for non-owners
    const { data, error } = await supabase
      .from('recipes_public')
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

  async create(recipe: RecipeInput): Promise<Recipe> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to create recipes');

    const { data, error } = await supabase
      .from('recipes')
      .insert([{
        name: recipe.name,
        description: recipe.description,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        tags: sanitizeTags(recipe.tags),
        is_public: recipe.is_public,
        image_url: recipe.image_url,
        instructions: recipe.instructions,
        user_id: user.id,
        ingredients: JSON.parse(JSON.stringify(recipe.ingredients)) as Json,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      ingredients: (data.ingredients as unknown as RecipeIngredient[]) || [],
      instructions: data.instructions || [],
      tags: data.tags || [],
    } as Recipe;
  }

  async update(id: string, recipe: Partial<RecipeInput>): Promise<Recipe> {
    const updateData: Record<string, unknown> = { ...recipe };
    if (recipe.ingredients) {
      updateData.ingredients = JSON.parse(JSON.stringify(recipe.ingredients)) as Json;
    }
    if (recipe.tags) {
      updateData.tags = sanitizeTags(recipe.tags);
    }

    const { data, error } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      ingredients: (data.ingredients as unknown as RecipeIngredient[]) || [],
      instructions: data.instructions || [],
      tags: data.tags || [],
    } as Recipe;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async searchByTag(tag: string): Promise<Recipe[]> {
    // Use the recipes_public view which hides user_id for non-owners
    const { data, error } = await supabase
      .from('recipes_public')
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
