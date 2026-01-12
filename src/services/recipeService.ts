// Recipe service - handles all recipe-related operations
// This will later connect to Oracle DB through the server API

import { Recipe } from '@/types';
import { mockRecipes } from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class RecipeService {
  private recipes: Recipe[] = [...mockRecipes];

  async getAll(): Promise<Recipe[]> {
    await delay(100);
    return [...this.recipes];
  }

  async getById(id: string): Promise<Recipe | undefined> {
    await delay(50);
    return this.recipes.find(r => r.id === id);
  }

  async searchByTag(tag: string): Promise<Recipe[]> {
    await delay(50);
    return this.recipes.filter(r => 
      r.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  async searchByIngredient(ingredientName: string): Promise<Recipe[]> {
    await delay(50);
    return this.recipes.filter(r =>
      r.ingredients.some(i => 
        i.name.toLowerCase().includes(ingredientName.toLowerCase())
      )
    );
  }
}

export const recipeService = new RecipeService();
