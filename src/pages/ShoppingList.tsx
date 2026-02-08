import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ShoppingCart, 
  Trash2, 
  Plus,
  Minus,
  Check,
  ListChecks,
  PlusCircle,
  ChevronDown,
  FileSpreadsheet
} from 'lucide-react';
import { shoppingListService } from '@/services/shoppingListService';
import { productService } from '@/services/productService';
import { ShoppingListItem } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import { AddShoppingListItemDialog } from '@/components/AddShoppingListItemDialog';
import { BatchAddShoppingListDialog } from '@/components/BatchAddShoppingListDialog';

const ShoppingList = () => {
  const { categories, categoryLabels } = useSettings();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  const handleItemAdded = (item: ShoppingListItem) => {
    setItems(prev => [item, ...prev]);
  };

  const handleItemsAdded = (newItems: ShoppingListItem[]) => {
    setItems(prev => [...newItems, ...prev]);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await shoppingListService.getAll();
      setItems(data);
    } catch (error) {
      toast.error('שגיאה בטעינת רשימת הקניות');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (id: string) => {
    try {
      const updated = await shoppingListService.toggleChecked(id);
      if (updated) {
        setItems(prev =>
          prev.map(item => item.id === id ? updated : item)
        );
      }
    } catch (error) {
      toast.error('שגיאה בעדכון פריט');
    }
  };

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      const updated = await shoppingListService.updateQuantity(id, newQuantity);
      if (updated) {
        setItems(prev =>
          prev.map(item => item.id === id ? updated : item)
        );
      }
    } catch (error) {
      toast.error('שגיאה בעדכון כמות');
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await shoppingListService.removeItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('הפריט הוסר');
    } catch (error) {
      toast.error('שגיאה בהסרת פריט');
    }
  };

  const handleClearChecked = async () => {
    try {
      const { updatedProductIds } = await shoppingListService.clearChecked();
      setItems(prev => prev.filter(item => !item.checked));
      
      if (updatedProductIds.length > 0) {
        toast.success(`${updatedProductIds.length} מוצרים עודכנו במלאי והפריטים נמחקו`);
      } else {
        toast.success('הפריטים המסומנים נמחקו');
      }
    } catch (error) {
      toast.error('שגיאה במחיקת פריטים');
    }
  };

  const handleAddLowStockItems = async () => {
    try {
      const lowStock = await productService.getLowStock();
      if (lowStock.length === 0) {
        toast.info('אין פריטים במלאי נמוך להוספה');
        return;
      }
      const added = await shoppingListService.addFromLowStock(lowStock);
      if (added.length > 0) {
        setItems(prev => [...prev, ...added]);
        toast.success(`נוספו ${added.length} פריטים ממלאי נמוך`);
      } else {
        toast.info('כל הפריטים במלאי נמוך כבר ברשימה');
      }
    } catch (error) {
      toast.error('שגיאה בהוספת פריטים');
    }
  };

  // Create a map of category name to sort order
  const categorySortOrder = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.name] = cat.sort_order;
      return acc;
    }, {} as Record<string, number>);
  }, [categories]);

  // Group items by category and sort by category sort_order
  const groupedItems = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);
    return grouped;
  }, [items]);

  // Get sorted category keys
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => {
      const orderA = categorySortOrder[a] ?? 999;
      const orderB = categorySortOrder[b] ?? 999;
      return orderA - orderB;
    });
  }, [groupedItems, categorySortOrder]);

  const uncheckedCount = items.filter(i => !i.checked).length;
  const checkedCount = items.filter(i => i.checked).length;

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
            {uncheckedCount > 0 
              ? `${uncheckedCount} פריטים לקנייה`
              : 'כל הפריטים סומנו!'
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 me-2" />
                הוסף פריט
                <ChevronDown className="h-4 w-4 ms-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 me-2" />
                פריט בודד
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBatchDialog(true)}>
                <FileSpreadsheet className="h-4 w-4 me-2" />
                הוספה בכמות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleAddLowStockItems}>
            <Plus className="h-4 w-4 me-2" />
            הוסף מלאי נמוך
          </Button>
          {checkedCount > 0 && (
            <Button variant="secondary" onClick={handleClearChecked}>
              <Check className="h-4 w-4 me-2" />
              נקה מסומנים ({checkedCount})
            </Button>
          )}
        </div>
      </div>

      {/* Shopping List */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">רשימת הקניות ריקה</h3>
            <p className="text-muted-foreground text-center mb-4">
              הוסף פריטים ממלאי נמוך או צור ידנית
            </p>
            <Button onClick={handleAddLowStockItems}>
              <Plus className="h-4 w-4 me-2" />
              הוסף פריטים ממלאי נמוך
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((category) => {
            const categoryItems = groupedItems[category];
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    {categoryLabels[category] || category}
                  <Badge variant="secondary" className="ms-auto">
                    {categoryItems.filter(i => !i.checked).length} / {categoryItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categoryItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      item.checked ? 'bg-muted/50 opacity-60' : 'bg-card'
                    }`}
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => handleToggleItem(item.id)}
                    />
                    <div className={`flex-1 ${item.checked ? 'line-through' : ''}`}>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.checked || item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-muted-foreground min-w-[60px] text-center" dir="ltr">
                        {item.quantity} {item.unit}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.checked}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">סה"כ פריטים:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">הושלמו:</span>
              <span className="font-medium text-primary">{checkedCount}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Dialog */}
      <AddShoppingListItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onItemAdded={handleItemAdded}
      />

      <BatchAddShoppingListDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        onItemsAdded={handleItemsAdded}
      />
    </div>
  );
};

export default ShoppingList;
