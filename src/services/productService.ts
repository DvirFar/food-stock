// Product service - handles all product-related operations
// This will later connect to Oracle DB through the server API

import { Product, DashboardStats, ProductCategory } from '@/types';
import { mockProducts } from './mockData';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ProductService {
  private products: Product[] = [...mockProducts];

  async getAll(): Promise<Product[]> {
    await delay(100);
    return [...this.products];
  }

  async getById(id: string): Promise<Product | undefined> {
    await delay(50);
    return this.products.find(p => p.id === id);
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    await delay(100);
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.push(newProduct);
    return newProduct;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    await delay(100);
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.products[index];
  }

  async delete(id: string): Promise<boolean> {
    await delay(100);
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.products.splice(index, 1);
    return true;
  }

  async getLowStock(): Promise<Product[]> {
    await delay(50);
    return this.products.filter(p => p.quantity < p.minQuantity);
  }

  async getExpiringSoon(days: number = 3): Promise<Product[]> {
    await delay(50);
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.products.filter(p => {
      if (!p.expirationDate) return false;
      const expDate = new Date(p.expirationDate);
      return expDate <= threshold && expDate >= now;
    });
  }

  async getStats(): Promise<DashboardStats> {
    await delay(50);
    const lowStock = await this.getLowStock();
    const expiring = await this.getExpiringSoon();
    
    const categoryCounts = this.products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<ProductCategory, number>);

    return {
      totalProducts: this.products.length,
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
