import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Trash2, 
  Plus,
  Check,
  ListChecks
} from 'lucide-react';
import { shoppingListService } from '@/services/shoppingListService';
import { productService } from '@/services/productService';
import { ShoppingListItem, categoryLabels } from '@/types';
import { toast } from 'sonner';

const ShoppingList = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await shoppingListService.getAll();
      setItems(data);
    } catch (error) {
      toast.error('Failed to load shopping list');
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
      toast.error('Failed to update item');
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await shoppingListService.removeItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearChecked = async () => {
    try {
      await shoppingListService.clearChecked();
      setItems(prev => prev.filter(item => !item.checked));
      toast.success('Checked items cleared');
    } catch (error) {
      toast.error('Failed to clear items');
    }
  };

  const handleAddLowStockItems = async () => {
    try {
      const lowStock = await productService.getLowStock();
      if (lowStock.length === 0) {
        toast.info('No low stock items to add');
        return;
      }
      const added = await shoppingListService.addFromLowStock(lowStock);
      if (added.length > 0) {
        setItems(prev => [...prev, ...added]);
        toast.success(`Added ${added.length} items from low stock`);
      } else {
        toast.info('All low stock items already in list');
      }
    } catch (error) {
      toast.error('Failed to add items');
    }
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const uncheckedCount = items.filter(i => !i.checked).length;
  const checkedCount = items.filter(i => i.checked).length;

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
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-muted-foreground">
            {uncheckedCount > 0 
              ? `${uncheckedCount} items to buy`
              : 'All items checked!'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddLowStockItems}>
            <Plus className="h-4 w-4 mr-2" />
            Add Low Stock
          </Button>
          {checkedCount > 0 && (
            <Button variant="secondary" onClick={handleClearChecked}>
              <Check className="h-4 w-4 mr-2" />
              Clear Checked ({checkedCount})
            </Button>
          )}
        </div>
      </div>

      {/* Shopping List */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Your shopping list is empty</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add items from low stock products or create manually
            </p>
            <Button onClick={handleAddLowStockItems}>
              <Plus className="h-4 w-4 mr-2" />
              Add Low Stock Items
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  {categoryLabels[category as keyof typeof categoryLabels]}
                  <Badge variant="secondary" className="ml-auto">
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
                      <span className="text-muted-foreground ml-2">
                        {item.quantity} {item.unit}
                      </span>
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
          ))}
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total items:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-medium text-primary">{checkedCount}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShoppingList;
