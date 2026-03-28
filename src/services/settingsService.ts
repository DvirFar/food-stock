// Settings service - handles categories, locations, and product tags management

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

// Default categories for new users (name = label)
export const defaultCategories: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'מוצרי חלב', label: 'מוצרי חלב', sort_order: 1 },
  { name: 'בשר ועופות', label: 'בשר ועופות', sort_order: 2 },
  { name: 'ירקות', label: 'ירקות', sort_order: 3 },
  { name: 'פירות', label: 'פירות', sort_order: 4 },
  { name: 'דגנים', label: 'דגנים', sort_order: 5 },
  { name: 'קפואים', label: 'קפואים', sort_order: 6 },
  { name: 'משקאות', label: 'משקאות', sort_order: 7 },
  { name: 'תבלינים ורטבים', label: 'תבלינים ורטבים', sort_order: 8 },
  { name: 'חטיפים', label: 'חטיפים', sort_order: 9 },
  { name: 'אחר', label: 'אחר', sort_order: 10 },
];

// Default locations for new users (name = label)
export const defaultLocations: Omit<Location, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'מקרר', label: 'מקרר', sort_order: 1 },
  { name: 'מקפיא', label: 'מקפיא', sort_order: 2 },
  { name: 'מזווה', label: 'מזווה', sort_order: 3 },
  { name: 'משטח', label: 'משטח', sort_order: 4 },
];

// Default product tags for new users
export const defaultProductTags: Omit<ProductTag, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'regular', sort_order: 1 },
];

class SettingsService {
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
    const categoriesToInsert = defaultCategories.map(cat => ({ ...cat, user_id: user.id }));
    const { data, error } = await supabase.from('categories').insert(categoriesToInsert).select();
    if (error) throw error;
    return (data || []) as Category[];
  }

  async createCategory(category: { name: string; sort_order: number }): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase.from('categories').insert({ 
      name: category.name, 
      label: category.name, 
      sort_order: category.sort_order, 
      user_id: user.id 
    }).select().single();
    if (error) throw error;
    return data as Category;
  }

  async updateCategory(id: string, updates: { name: string; sort_order: number }): Promise<Category> {
    const { data, error } = await supabase.from('categories').update({ 
      name: updates.name, 
      label: updates.name, 
      sort_order: updates.sort_order 
    }).eq('id', id).select().single();
    if (error) throw error;
    return data as Category;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    const { data, error } = await supabase.from('locations').select('*').order('sort_order');
    if (error) throw error;
    return (data || []) as Location[];
  }

  async initializeDefaultLocations(): Promise<Location[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const existing = await this.getLocations();
    if (existing.length > 0) return existing;
    const locationsToInsert = defaultLocations.map(loc => ({ ...loc, user_id: user.id }));
    const { data, error } = await supabase.from('locations').insert(locationsToInsert).select();
    if (error) throw error;
    return (data || []) as Location[];
  }

  async createLocation(location: { name: string; sort_order: number }): Promise<Location> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase.from('locations').insert({ 
      name: location.name, 
      label: location.name, 
      sort_order: location.sort_order, 
      user_id: user.id 
    }).select().single();
    if (error) throw error;
    return data as Location;
  }

  async updateLocation(id: string, updates: { name: string; sort_order: number }): Promise<Location> {
    const { data, error } = await supabase.from('locations').update({ 
      name: updates.name, 
      label: updates.name, 
      sort_order: updates.sort_order 
    }).eq('id', id).select().single();
    if (error) throw error;
    return data as Location;
  }

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
  }

  // Product Tags
  async getProductTags(): Promise<ProductTag[]> {
    const { data, error } = await supabase.from('product_tags').select('*').order('sort_order');
    if (error) throw error;
    return (data || []) as ProductTag[];
  }

  async initializeDefaultProductTags(): Promise<ProductTag[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const existing = await this.getProductTags();
    if (existing.length > 0) return existing;
    const tagsToInsert = defaultProductTags.map(tag => ({ ...tag, user_id: user.id }));
    const { data, error } = await supabase.from('product_tags').insert(tagsToInsert).select();
    if (error) throw error;
    return (data || []) as ProductTag[];
  }

  async createProductTag(tag: Omit<ProductTag, 'id' | 'user_id' | 'created_at'>): Promise<ProductTag> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase.from('product_tags').insert({ ...tag, user_id: user.id }).select().single();
    if (error) throw error;
    return data as ProductTag;
  }

  async updateProductTag(id: string, updates: Partial<Omit<ProductTag, 'id' | 'user_id' | 'created_at'>>): Promise<ProductTag> {
    const { data, error } = await supabase.from('product_tags').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as ProductTag;
  }

  async deleteProductTag(id: string): Promise<void> {
    const { error } = await supabase.from('product_tags').delete().eq('id', id);
    if (error) throw error;
  }

  // Get category labels map (identity since name = label)
  async getCategoryLabels(): Promise<Record<string, string>> {
    const categories = await this.getCategories();
    if (categories.length === 0) {
      return defaultCategories.reduce((acc, cat) => { acc[cat.name] = cat.name; return acc; }, {} as Record<string, string>);
    }
    return categories.reduce((acc, cat) => { acc[cat.name] = cat.name; return acc; }, {} as Record<string, string>);
  }

  // Get location labels map (identity since name = label)
  async getLocationLabels(): Promise<Record<string, string>> {
    const locations = await this.getLocations();
    if (locations.length === 0) {
      return defaultLocations.reduce((acc, loc) => { acc[loc.name] = loc.name; return acc; }, {} as Record<string, string>);
    }
    return locations.reduce((acc, loc) => { acc[loc.name] = loc.name; return acc; }, {} as Record<string, string>);
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
