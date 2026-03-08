// Settings service - handles categories and locations management

import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface Location {
  id: string;
  user_id: string;
  name: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface ProductTag {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

// Default categories for new users
export const defaultCategories: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'dairy', label: 'מוצרי חלב', sort_order: 1 },
  { name: 'meat', label: 'בשר ועופות', sort_order: 2 },
  { name: 'vegetables', label: 'ירקות', sort_order: 3 },
  { name: 'fruits', label: 'פירות', sort_order: 4 },
  { name: 'grains', label: 'דגנים', sort_order: 5 },
  { name: 'frozen', label: 'קפואים', sort_order: 6 },
  { name: 'beverages', label: 'משקאות', sort_order: 7 },
  { name: 'condiments', label: 'תבלינים ורטבים', sort_order: 8 },
  { name: 'snacks', label: 'חטיפים', sort_order: 9 },
  { name: 'other', label: 'אחר', sort_order: 10 },
];

// Default locations for new users
export const defaultLocations: Omit<Location, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'fridge', label: 'מקרר', sort_order: 1 },
  { name: 'freezer', label: 'מקפיא', sort_order: 2 },
  { name: 'pantry', label: 'מזווה', sort_order: 3 },
  { name: 'counter', label: 'משטח', sort_order: 4 },
];

// Default product tags for new users
export const defaultProductTags: Omit<ProductTag, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'regular', sort_order: 1 },
];


  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    if (error) throw error;
    return (data || []) as Category[];
  }

  async initializeDefaultCategories(): Promise<Category[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const existing = await this.getCategories();
    if (existing.length > 0) return existing;

    const categoriesToInsert = defaultCategories.map(cat => ({
      ...cat,
      user_id: user.id,
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select();

    if (error) throw error;
    return (data || []) as Category[];
  }

  async createCategory(category: Omit<Category, 'id' | 'user_id' | 'created_at'>): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...category,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  async updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('sort_order');
    
    if (error) throw error;
    return (data || []) as Location[];
  }

  async initializeDefaultLocations(): Promise<Location[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const existing = await this.getLocations();
    if (existing.length > 0) return existing;

    const locationsToInsert = defaultLocations.map(loc => ({
      ...loc,
      user_id: user.id,
    }));

    const { data, error } = await supabase
      .from('locations')
      .insert(locationsToInsert)
      .select();

    if (error) throw error;
    return (data || []) as Location[];
  }

  async createLocation(location: Omit<Location, 'id' | 'user_id' | 'created_at'>): Promise<Location> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('locations')
      .insert({
        ...location,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Location;
  }

  async updateLocation(id: string, updates: Partial<Omit<Location, 'id' | 'user_id' | 'created_at'>>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Location;
  }

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Get category labels map (for backward compatibility)
  async getCategoryLabels(): Promise<Record<string, string>> {
    const categories = await this.getCategories();
    if (categories.length === 0) {
      // Return defaults if no custom categories
      return defaultCategories.reduce((acc, cat) => {
        acc[cat.name] = cat.label;
        return acc;
      }, {} as Record<string, string>);
    }
    return categories.reduce((acc, cat) => {
      acc[cat.name] = cat.label;
      return acc;
    }, {} as Record<string, string>);
  }

  // Get location labels map (for backward compatibility)
  async getLocationLabels(): Promise<Record<string, string>> {
    const locations = await this.getLocations();
    if (locations.length === 0) {
      return defaultLocations.reduce((acc, loc) => {
        acc[loc.name] = loc.label;
        return acc;
      }, {} as Record<string, string>);
    }
    return locations.reduce((acc, loc) => {
      acc[loc.name] = loc.label;
      return acc;
    }, {} as Record<string, string>);
  }

  // Get sorted category names for shopping list
  async getSortedCategoryNames(): Promise<string[]> {
    const categories = await this.getCategories();
    if (categories.length === 0) {
      return defaultCategories.map(c => c.name);
    }
    return categories.sort((a, b) => a.sort_order - b.sort_order).map(c => c.name);
  }
}

export const settingsService = new SettingsService();
