// Product service - handles all product-related operations using Supabase

import { supabase } from '@/integrations/supabase/client';
import { Product, DashboardStats } from '@/types';

class ProductService {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []) as Product[];
  }

  async getById(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as Product | undefined;
  }

  async create(product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        user_id: user.id,
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .update(updates as any)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Product | undefined;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  async getLowStock(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Filter products where quantity < min_quantity
    return (data || []).filter((p: Product) => p.quantity < p.min_quantity) as Product[];
  }

  async getExpiringSoon(days: number = 3): Promise<Product[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .not('expiration_date', 'is', null)
      .lte('expiration_date', threshold.toISOString().split('T')[0])
      .gte('expiration_date', now.toISOString().split('T')[0])
      .order('expiration_date');
    
    if (error) throw error;
    return (data || []) as Product[];
  }

  async getStats(): Promise<DashboardStats> {
    const products = await this.getAll();
    const lowStock = products.filter(p => p.quantity < p.min_quantity);
    const expiring = await this.getExpiringSoon();
    
    const categoryCounts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Partial<Record<string, number>>);

    return {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      expiringCount: expiring.length,
      categoryCounts,
    };
  }

  async updateQuantity(id: string, quantity: number): Promise<Product | undefined> {
    return this.update(id, { quantity });
  }
}

export const productService = new ProductService();
