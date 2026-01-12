// Shopping list service - manages shopping list operations
// This will later connect to Oracle DB through the server API

import { ShoppingListItem, Product, ProductCategory } from '@/types';
import { mockShoppingList } from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ShoppingListService {
  private items: ShoppingListItem[] = [...mockShoppingList];

  async getAll(): Promise<ShoppingListItem[]> {
    await delay(100);
    return [...this.items];
  }

  async addItem(item: Omit<ShoppingListItem, 'id' | 'addedAt' | 'checked'>): Promise<ShoppingListItem> {
    await delay(100);
    const newItem: ShoppingListItem = {
      ...item,
      id: Date.now().toString(),
      checked: false,
      addedAt: new Date().toISOString(),
    };
    this.items.push(newItem);
    return newItem;
  }

  async addFromLowStock(products: Product[]): Promise<ShoppingListItem[]> {
    await delay(100);
    const newItems: ShoppingListItem[] = [];
    
    for (const product of products) {
      // Check if item already exists
      const exists = this.items.some(
        i => i.productId === product.id && !i.checked
      );
      
      if (!exists) {
        const neededQuantity = product.minQuantity - product.quantity;
        const newItem: ShoppingListItem = {
          id: Date.now().toString() + product.id,
          productId: product.id,
          name: product.name,
          quantity: Math.max(neededQuantity, 1),
          unit: product.unit,
          category: product.category,
          checked: false,
          addedAt: new Date().toISOString(),
        };
        this.items.push(newItem);
        newItems.push(newItem);
      }
    }
    
    return newItems;
  }

  async toggleChecked(id: string): Promise<ShoppingListItem | undefined> {
    await delay(50);
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    this.items[index].checked = !this.items[index].checked;
    return this.items[index];
  }

  async removeItem(id: string): Promise<boolean> {
    await delay(50);
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  async clearChecked(): Promise<void> {
    await delay(100);
    this.items = this.items.filter(i => !i.checked);
  }

  async updateQuantity(id: string, quantity: number): Promise<ShoppingListItem | undefined> {
    await delay(50);
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    this.items[index].quantity = quantity;
    return this.items[index];
  }
}

export const shoppingListService = new ShoppingListService();
