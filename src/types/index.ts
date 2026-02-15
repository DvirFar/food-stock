// Core domain types for the food stock management system

// Categories and locations are now dynamic (from DB)
// These type aliases are kept for backward compatibility
export type ProductCategory = string;
export type StorageLocation = string;

export interface Product {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  expiration_date?: string | null;
  location: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  productId?: string;
  name: string;
  quantity?: number | string;
  amount?: string;
  unit: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prep_time?: number | null;
  cook_time?: number | null;
  servings: number;
  image_url?: string | null;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  product_id?: string | null;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  added_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  categoryCounts: Partial<Record<string, number>>;
}
