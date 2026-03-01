import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import { Product } from '@/types';

interface RestockPriorityListProps {
  products: Product[];
}

interface PriorityItem {
  product: Product;
  score: number;
  reasons: ('low_stock' | 'expiring')[];
}

export const RestockPriorityList = ({ products }: RestockPriorityListProps) => {
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const priorityItems: PriorityItem[] = products
    .map(product => {
      let score = 0;
      const reasons: ('low_stock' | 'expiring')[] = [];

      // Low stock score: how far below minimum
      if (product.quantity < product.min_quantity) {
        const ratio = product.min_quantity > 0 
          ? product.quantity / product.min_quantity 
          : 0;
        score += (1 - ratio) * 60; // up to 60 points
        reasons.push('low_stock');
      }

      // Expiration score
      if (product.expiration_date) {
        const expDate = new Date(product.expiration_date);
        if (expDate <= threeDays) {
          const daysLeft = Math.max(0, (expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          score += (1 - daysLeft / 3) * 40; // up to 40 points
          reasons.push('expiring');
        }
      }

      return { product, score, reasons };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">עדיפות למילוי מלאי</CardTitle>
        <CardDescription>מוצרים שדורשים תשומת לב דחופה</CardDescription>
      </CardHeader>
      <CardContent>
        {priorityItems.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground text-sm">הכל במלאי תקין ✓</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {priorityItems.map(({ product, score, reasons }) => (
              <div
                key={product.id}
                className="flex items-center gap-2 p-2 rounded-md border text-sm"
              >
                <div
                  className="w-1.5 h-8 rounded-full shrink-0"
                  style={{
                    backgroundColor: score > 60
                      ? 'hsl(var(--destructive))'
                      : score > 30
                        ? 'hsl(var(--chart-4))'
                        : 'hsl(var(--chart-2))',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantity} / {product.min_quantity} {product.unit}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {reasons.includes('low_stock') && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      <AlertTriangle className="h-3 w-3 me-0.5" />
                      חסר
                    </Badge>
                  )}
                  {reasons.includes('expiring') && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-chart-4 text-chart-4">
                      <Clock className="h-3 w-3 me-0.5" />
                      תוקף
                    </Badge>
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
