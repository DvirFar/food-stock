import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ShoppingCart,
  Plus,
  Minus,
  ListChecks,
  Tag,
  RotateCcw,
  PackageCheck,
  Pencil,
  Eye,
  X,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';

// A shopping list entry derived from a product
interface ShoppingEntry {
  product: Product;
  amountToBuy: number;
}

const EXPIRING_DAYS = 3;

const ShoppingList = () => {
  const { categories, categoryLabels } = useSettings();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>(['regular']);
  const [overrides, setOverrides] = useState<Record<string, number>>({}); 
  const [hiddenProducts, setHiddenProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setAllProducts(data);
    } catch (error) {
      toast.error('שגיאה בטעינת מוצרים');
    } finally {
      setLoading(false);
    }
  };

  // All unique tags across products
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allProducts.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [allProducts]);

  // Products expiring soon
  const expiringProducts = useMemo(() => {
    const now = new Date();
    return allProducts.filter(p => {
      if (!p.expiration_date) return false;
      const days = differenceInDays(parseISO(p.expiration_date), now);
      return days >= 0 && days <= EXPIRING_DAYS;
    });
  }, [allProducts]);

  // Products matching active tags
  const taggedProducts = useMemo(() => {
    return allProducts.filter(p =>
      (p.tags || []).some(t => activeTags.includes(t))
    );
  }, [allProducts, activeTags]);

  // Combined unique products (tagged + expiring)
  const visibleProducts = useMemo(() => {
    const map = new Map<string, Product>();
    expiringProducts.forEach(p => { if (!hiddenProducts.has(p.id)) map.set(p.id, p); });
    taggedProducts.forEach(p => { if (!hiddenProducts.has(p.id)) map.set(p.id, p); });
    return Array.from(map.values());
  }, [expiringProducts, taggedProducts, hiddenProducts]);

  // Build shopping entries
  const entries: ShoppingEntry[] = useMemo(() => {
    return visibleProducts.map(product => {
      const defaultAmount = Math.max(product.min_quantity - product.quantity, 0);
      const amountToBuy = overrides[product.id] ?? defaultAmount;
      return { product, amountToBuy };
    });
  }, [visibleProducts, overrides]);

  // Group by category
  const categorySortOrder = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.name] = cat.sort_order;
      return acc;
    }, {} as Record<string, number>);
  }, [categories]);

  const groupedEntries = useMemo(() => {
    const filtered = isShoppingMode ? entries.filter(e => e.amountToBuy > 0) : entries;
    const grouped = filtered.reduce((acc, entry) => {
      const cat = entry.product.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(entry);
      return acc;
    }, {} as Record<string, ShoppingEntry[]>);
    return grouped;
  }, [entries, isShoppingMode]);

  const sortedCategories = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => {
      const orderA = categorySortOrder[a] ?? 999;
      const orderB = categorySortOrder[b] ?? 999;
      return orderA - orderB;
    });
  }, [groupedEntries, categorySortOrder]);

  const handleAmountChange = useCallback((productId: string, newAmount: number) => {
    if (newAmount < 0) return;
    setOverrides(prev => ({ ...prev, [productId]: newAmount }));
  }, []);

  const handleClear = useCallback(() => {
    setActiveTags(['regular']);
    setOverrides({});
    setHiddenProducts(new Set());
  }, []);

  const handleRemoveProduct = useCallback((productId: string) => {
    setHiddenProducts(prev => new Set(prev).add(productId));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleUpdateStock = async () => {
    const toUpdate = entries.filter(e => e.amountToBuy > 0);
    if (toUpdate.length === 0) {
      toast.info('אין פריטים לעדכון');
      return;
    }

    try {
      let count = 0;
      for (const entry of toUpdate) {
        const newQuantity = entry.product.quantity + entry.amountToBuy;
        await productService.updateQuantity(entry.product.id, newQuantity);
        count++;
      }
      // Reload products to reflect changes
      await loadProducts();
      setOverrides({});
      toast.success(`${count} מוצרים עודכנו במלאי`);
    } catch (error) {
      toast.error('שגיאה בעדכון מלאי');
    }
  };

  const totalToBuy = entries.filter(e => e.amountToBuy > 0).length;

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
          <h1 className="text-3xl font-bold tracking-tight">רשימת קניות</h1>
          <p className="text-muted-foreground">
            {totalToBuy > 0
              ? `${totalToBuy} פריטים לקנייה`
              : 'אין פריטים לקנייה'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Pencil className={`h-4 w-4 ${!isShoppingMode ? 'text-primary' : 'text-muted-foreground'}`} />
            <Switch
              checked={isShoppingMode}
              onCheckedChange={setIsShoppingMode}
            />
            <Eye className={`h-4 w-4 ${isShoppingMode ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label className="text-sm">{isShoppingMode ? 'מצב קניות' : 'מצב עריכה'}</Label>
          </div>
          {!isShoppingMode && (
            <>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <RotateCcw className="h-4 w-4 me-2" />
                אפס
              </Button>
              <Button onClick={handleUpdateStock}>
                <PackageCheck className="h-4 w-4 me-2" />
                עדכן מלאי
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tag filters */}
      {!isShoppingMode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              רשימות (תגיות)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={activeTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {allTags.length === 0 && (
                <p className="text-sm text-muted-foreground">אין תגיות. הוסף תגיות למוצרים בעמוד המוצרים.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shopping List */}
      {sortedCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isShoppingMode ? 'אין פריטים לקנייה!' : 'אין מוצרים להצגה'}
            </h3>
            <p className="text-muted-foreground text-center">
              {isShoppingMode
                ? 'כל המוצרים במלאי מספיק'
                : 'הוסף תגיות למוצרים כדי שיופיעו ברשימה'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((category) => {
            const categoryEntries = groupedEntries[category];
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    {categoryLabels[category] || category}
                    <Badge variant="secondary" className="ms-auto">
                      {categoryEntries.filter(e => e.amountToBuy > 0).length} / {categoryEntries.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryEntries.map(entry => (
                    <ShoppingEntryRow
                      key={entry.product.id}
                      entry={entry}
                      isShoppingMode={isShoppingMode}
                      onAmountChange={handleAmountChange}
                      onRemove={handleRemoveProduct}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">סה"כ מוצרים:</span>
              <span className="font-medium">{entries.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">לקנייה:</span>
              <span className="font-medium text-primary">{totalToBuy}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface ShoppingEntryRowProps {
  entry: ShoppingEntry;
  isShoppingMode: boolean;
  onAmountChange: (productId: string, amount: number) => void;
  onRemove: (productId: string) => void;
}

const ShoppingEntryRow = ({ entry, isShoppingMode, onAmountChange, onRemove }: ShoppingEntryRowProps) => {
  const { product, amountToBuy } = entry;
  const isZero = amountToBuy === 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isZero ? 'bg-muted/50 opacity-60' : 'bg-card'
      }`}
    >
      <div className="flex-1">
        <span className="font-medium">{product.name}</span>
        {(product.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(product.tags || []).map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Existing amount */}
      <div className="text-sm text-muted-foreground whitespace-nowrap">
        במלאי: {product.quantity} {product.unit}
      </div>

      {/* Amount to buy */}
      <div className="flex items-center gap-1">
        {!isShoppingMode && (
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAmountChange(product.id, amountToBuy - 1)}
            disabled={amountToBuy <= 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
        )}
        <div className="flex items-center gap-1 min-w-[60px] justify-center" dir="rtl">
          {isShoppingMode ? (
            <span className="text-sm font-medium">{amountToBuy}</span>
          ) : (
            <input
              type="number"
              value={amountToBuy}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) {
                  onAmountChange(product.id, val);
                }
              }}
              className="w-12 text-center bg-transparent border-b border-input text-sm focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={0}
            />
          )}
          <span className="text-muted-foreground text-sm">{product.unit}</span>
        </div>
        {!isShoppingMode && (
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAmountChange(product.id, amountToBuy + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Remove button */}
      {!isShoppingMode && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive shrink-0"
          onClick={() => onRemove(product.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ShoppingList;
