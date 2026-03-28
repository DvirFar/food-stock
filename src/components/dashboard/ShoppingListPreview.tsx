import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, ExternalLink } from 'lucide-react';
import { ShoppingListItem } from '@/types';
import { shoppingListService } from '@/services/shoppingListService';
import { useSettings } from '@/hooks/useSettings';
import { useNavigate } from 'react-router-dom';

export const ShoppingListPreview = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await shoppingListService.getAll();
        setItems(data);
      } catch (e) {
        console.error('Failed to load shopping list:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const uncheckedItems = items.filter(i => !i.checked);
  const checkedCount = items.filter(i => i.checked).length;

  // Group by category
  const byCategory = uncheckedItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">רשימת קניות</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm animate-pulse">טוען...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">רשימת קניות</CardTitle>
          <CardDescription>
            {uncheckedItems.length} פריטים ממתינים
            {checkedCount > 0 && ` · ${checkedCount} הושלמו`}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/shopping-list')}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {uncheckedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[180px] gap-2">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">רשימת הקניות ריקה</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {Object.entries(byCategory).map(([cat, catItems]) => (
              <div key={cat}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {cat}
                </p>
                <div className="space-y-1">
                  {catItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{item.name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0 ms-2">
                        {item.quantity} {item.unit}
                      </Badge>
                    </div>
                  ))}
                  {catItems.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{catItems.length - 3} נוספים
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
