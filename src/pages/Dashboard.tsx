import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  TrendingDown,
  Refrigerator
} from 'lucide-react';
import { productService } from '@/services/productService';

import { Product, DashboardStats } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingListPreview } from '@/components/dashboard/ShoppingListPreview';
import { ExpirationBarChart } from '@/components/dashboard/ExpirationBarChart';
import { RestockPriorityList } from '@/components/dashboard/RestockPriorityList';

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


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-muted-foreground">
          סקירה כללית של מלאי המזון והתראות
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ מוצרים</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              פריטים במלאי
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.lowStockCount ? 'border-destructive/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מלאי נמוך</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              מתחת למינימום
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.expiringCount ? 'border-chart-4/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פג תוקף בקרוב</CardTitle>
            <Clock className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">
              {stats?.expiringCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              תוך 3 ימים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">קטגוריות</CardTitle>
            <Refrigerator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? Object.keys(stats.categoryCounts).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              סוגי מוצרים
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
              <CardTitle>התראת מלאי נמוך</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                כל המוצרים מעל כמות המינימום ✓
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
              <CardTitle>פג תוקף בקרוב</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {expiringProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                אין מוצרים שפג תוקפם ב-3 הימים הקרובים ✓
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
        <ShoppingListPreview />
        <ExpirationBarChart products={allProducts} />
        <RestockPriorityList products={allProducts} />
      </div>
    </div>
  );
};

export default Dashboard;
