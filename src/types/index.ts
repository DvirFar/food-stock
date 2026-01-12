// Core domain types for the food stock management system

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  minQuantity: number;
  expirationDate?: string;
  location: StorageLocation;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = 
  | 'dairy'
  | 'meat'
  | 'vegetables'
  | 'fruits'
  | 'beverages'
  | 'condiments'
  | 'frozen'
  | 'bakery'
  | 'snacks'
  | 'other';

export type StorageLocation = 'fridge' | 'freezer' | 'pantry';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
}

export interface RecipeIngredient {
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  optional?: boolean;
}

export interface ShoppingListItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  category: ProductCategory;
  checked: boolean;
  addedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  categoryCounts: Record<ProductCategory, number>;
}

// Category display configuration
export const categoryLabels: Record<ProductCategory, string> = {
  dairy: 'Dairy',
  meat: 'Meat & Poultry',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  beverages: 'Beverages',
  condiments: 'Condiments',
  frozen: 'Frozen',
  bakery: 'Bakery',
  snacks: 'Snacks',
  other: 'Other',
};

export const locationLabels: Record<StorageLocation, string> = {
  fridge: 'Fridge',
  freezer: 'Freezer',
  pantry: 'Pantry',
};
