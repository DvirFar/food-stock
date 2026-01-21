// Core domain types for the food stock management system

export type ProductCategory = 
  | 'dairy'
  | 'meat'
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'frozen'
  | 'beverages'
  | 'condiments'
  | 'snacks'
  | 'other';

export type StorageLocation = 'fridge' | 'freezer' | 'pantry' | 'counter';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  min_quantity: number;
  expiration_date?: string | null;
  location: StorageLocation;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  productId?: string;
  name: string;
  quantity?: number | string;
  amount?: string; // Alternative field name used in some recipes
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
  category: ProductCategory;
  checked: boolean;
  added_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  categoryCounts: Partial<Record<ProductCategory, number>>;
}

// Category display configuration
export const categoryLabels: Record<ProductCategory, string> = {
  dairy: 'מוצרי חלב',
  meat: 'בשר ועופות',
  vegetables: 'ירקות',
  fruits: 'פירות',
  grains: 'דגנים',
  frozen: 'קפואים',
  beverages: 'משקאות',
  condiments: 'תבלינים ורטבים',
  snacks: 'חטיפים',
  other: 'אחר',
};

export const locationLabels: Record<StorageLocation, string> = {
  fridge: 'מקרר',
  freezer: 'מקפיא',
  pantry: 'מזווה',
  counter: 'משטח',
};
