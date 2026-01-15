import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  ShoppingCart,
  TrendingDown,
  Refrigerator
} from 'lucide-react';
import { productService } from '@/services/productService';
import { shoppingListService } from '@/services/shoppingListService';
import { Product, DashboardStats } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { ExpirationBarChart } from '@/components/dashboard/ExpirationBarChart';
import { StockLevelChart } from '@/components/dashboard/StockLevelChart';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, products, lowStock, expiring] = await Promise.all([
        productService.getStats(),
        productService.getAll(),
        productService.getLowStock(),
        productService.getExpiringSoon(3),
      ]);
      setStats(statsData);
      setAllProducts(products);
      setLowStockProducts(lowStock);
      setExpiringProducts(expiring);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToShoppingList = async () => {
    if (lowStockProducts.length === 0) return;
    
    try {
      const added = await shoppingListService.addFromLowStock(lowStockProducts);
      if (added.length > 0) {
        toast.success(`Added ${added.length} items to shopping list`);
        navigate('/shopping-list');
      } else {
        toast.info('All low stock items are already in your shopping list');
      }
    } catch (error) {
      toast.error('Failed to add items to shopping list');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your food stock and alerts
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              items in stock
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.lowStockCount ? 'border-destructive/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              items below minimum
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.expiringCount ? 'border-chart-4/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">
              {stats?.expiringCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              within 3 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Refrigerator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? Object.keys(stats.categoryCounts).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              product types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Low Stock Alert</CardTitle>
            </div>
            {lowStockProducts.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddToShoppingList}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to List
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                All products are above minimum quantity ✓
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    variant="compact"
                    showLowStock
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-chart-4" />
              <CardTitle>Expiring Soon</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {expiringProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No products expiring in the next 3 days ✓
              </p>
            ) : (
              <div className="space-y-3">
                {expiringProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    variant="compact"
                    showExpiration
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {stats && <CategoryPieChart categoryCounts={stats.categoryCounts} />}
        <ExpirationBarChart products={allProducts} />
        <StockLevelChart products={allProducts} />
      </div>
    </div>
  );
};

export default Dashboard;
