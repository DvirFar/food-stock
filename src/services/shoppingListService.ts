// Shopping list service - manages shopping list operations using Supabase

import { supabase } from '@/integrations/supabase/client';
import { ShoppingListItem, Product, ProductCategory } from '@/types';

class ShoppingListService {
  async getAll(): Promise<ShoppingListItem[]> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .order('added_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as ShoppingListItem[];
  }

  async addItem(item: Omit<ShoppingListItem, 'id' | 'user_id' | 'added_at' | 'checked'>): Promise<ShoppingListItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({
        ...item,
        user_id: user.id,
        checked: false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ShoppingListItem;
  }

  async addFromLowStock(products: Product[]): Promise<ShoppingListItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get existing items to avoid duplicates
    const existingItems = await this.getAll();
    const newItems: ShoppingListItem[] = [];
    
    for (const product of products) {
      // Check if item already exists (not checked)
      const exists = existingItems.some(
        i => i.product_id === product.id && !i.checked
      );
      
      if (!exists) {
        const neededQuantity = product.min_quantity - product.quantity;
        
        const { data, error } = await supabase
          .from('shopping_list_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            name: product.name,
            quantity: Math.max(neededQuantity, 1),
            unit: product.unit,
            category: product.category,
            checked: false,
          })
          .select()
          .single();
        
        if (error) throw error;
        if (data) newItems.push(data as ShoppingListItem);
      }
    }
    
    return newItems;
  }

  async toggleChecked(id: string): Promise<ShoppingListItem | undefined> {
    // First get the current state
    const { data: current, error: fetchError } = await supabase
      .from('shopping_list_items')
      .select('checked')
      .eq('id', id)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    if (!current) return undefined;

    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({ checked: !current.checked })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as ShoppingListItem | undefined;
  }

  async removeItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  async clearChecked(): Promise<{ updatedProductIds: string[] }> {
    // First, get all checked items that have a product_id
    const { data: checkedItems, error: fetchError } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('checked', true);
    
    if (fetchError) throw fetchError;

    const updatedProductIds: string[] = [];

    // Update product quantities for items linked to products
    if (checkedItems && checkedItems.length > 0) {
      for (const item of checkedItems) {
        if (item.product_id) {
          // Get current product quantity
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', item.product_id)
            .maybeSingle();
          
          if (productError) throw productError;
          
          if (product) {
            // Update product quantity by adding the purchased amount
            const newQuantity = Number(product.quantity) + Number(item.quantity);
            const { error: updateError } = await supabase
              .from('products')
              .update({ quantity: newQuantity })
              .eq('id', item.product_id);
            
            if (updateError) throw updateError;
            updatedProductIds.push(item.product_id);
          }
        }
      }
    }

    // Delete all checked items
    const { error: deleteError } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('checked', true);
    
    if (deleteError) throw deleteError;

    return { updatedProductIds };
  }

  async updateQuantity(id: string, quantity: number): Promise<ShoppingListItem | undefined> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({ quantity })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as ShoppingListItem | undefined;
  }
}

export const shoppingListService = new ShoppingListService();
