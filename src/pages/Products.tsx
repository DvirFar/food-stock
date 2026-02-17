import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter,
  Package,
  ChevronDown,
  FileSpreadsheet
} from 'lucide-react';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { ProductCard } from '@/components/ProductCard';
import { AddProductDialog } from '@/components/AddProductDialog';
import { BatchAddProductsDialog } from '@/components/BatchAddProductsDialog';
import { EditProductDialog } from '@/components/EditProductDialog';
import { toast } from 'sonner';

const Products = () => {
  const { categories, locations, categoryLabels, locationLabels } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, locationFilter]);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      toast.error('שגיאה בטעינת מוצרים');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(p => p.location === locationFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleProductAdded = (product: Product) => {
    setProducts(prev => [...prev, product]);
    toast.success(`${product.name} נוסף למלאי`);
  };

  const handleProductsAdded = (newProducts: Product[]) => {
    setProducts(prev => [...prev, ...newProducts]);
  };

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      await productService.updateQuantity(id, newQuantity);
      setProducts(prev => 
        prev.map(p => p.id === id ? { ...p, quantity: newQuantity } : p)
      );
    } catch (error) {
      toast.error('שגיאה בעדכון כמות');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('המוצר הוסר');
    } catch (error) {
      toast.error('שגיאה במחיקת מוצר');
    }
  };

  const handleProductUpdated = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
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
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">מוצרים</h1>
          <p className="text-muted-foreground">
            ניהול מלאי המזון שלך
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              הוסף מוצר
              <ChevronDown className="h-4 w-4 ms-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 me-2" />
              מוצר בודד
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowBatchDialog(true)}>
              <FileSpreadsheet className="h-4 w-4 me-2" />
              הוספה בכמות
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש מוצרים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 me-2" />
                <SelectValue placeholder="קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="מיקום" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המיקומים</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>{loc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">לא נמצאו מוצרים</h3>
            <p className="text-muted-foreground text-center mb-4">
              {products.length === 0 
                ? "התחל בהוספת המוצר הראשון למלאי"
                : "נסה לשנות את החיפוש או הסינון"
              }
            </p>
            {products.length === 0 && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 me-2" />
                הוסף מוצר ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuantityChange={handleQuantityChange}
              onDelete={handleDelete}
              onEdit={setEditingProduct}
              showLowStock
              showExpiration
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredProducts.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          מציג {filteredProducts.length} מתוך {products.length} מוצרים
        </p>
      )}

      <AddProductDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onProductAdded={handleProductAdded}
      />

      <BatchAddProductsDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        onProductsAdded={handleProductsAdded}
      />

      {editingProduct && (
        <EditProductDialog
          open={!!editingProduct}
          onOpenChange={(open) => { if (!open) setEditingProduct(null); }}
          product={editingProduct}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
};

export default Products;
