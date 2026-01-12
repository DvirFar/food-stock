import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Minus, 
  Plus, 
  Trash2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Product, categoryLabels, locationLabels } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
  showLowStock?: boolean;
  showExpiration?: boolean;
  onQuantityChange?: (id: string, newQuantity: number) => void;
  onDelete?: (id: string) => void;
}

export const ProductCard = ({
  product,
  variant = 'default',
  showLowStock = false,
  showExpiration = false,
  onQuantityChange,
  onDelete,
}: ProductCardProps) => {
  const isLowStock = product.quantity < product.min_quantity;
  const daysUntilExpiry = product.expiration_date 
    ? differenceInDays(parseISO(product.expiration_date), new Date())
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0;

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-medium">{product.name}</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{product.quantity} {product.unit}</span>
              {showLowStock && isLowStock && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Low
                </Badge>
              )}
              {showExpiration && isExpiringSoon && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {daysUntilExpiry === 0 ? 'Today' : `${daysUntilExpiry}d`}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Badge variant="outline">
          {locationLabels[product.location]}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`transition-shadow hover:shadow-md ${isLowStock ? 'border-destructive/50' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {categoryLabels[product.category]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {locationLabels[product.location]}
              </Badge>
            </div>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(product.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Quantity Display */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {onQuantityChange && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onQuantityChange(product.id, Math.max(0, product.quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
            <div className="text-center min-w-[80px]">
              <span className="text-xl font-bold">{product.quantity}</span>
              <span className="text-muted-foreground ml-1">{product.unit}</span>
            </div>
            {onQuantityChange && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onQuantityChange(product.id, product.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="text-right text-sm text-muted-foreground">
            Min: {product.min_quantity}
          </div>
        </div>

        {/* Alerts */}
        <div className="flex flex-wrap gap-2 mt-4">
          {showLowStock && isLowStock && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Stock
            </Badge>
          )}
          {showExpiration && product.expiration_date && (
            <Badge variant={isExpiringSoon ? 'secondary' : 'outline'}>
              <Clock className="h-3 w-3 mr-1" />
              {isExpiringSoon 
                ? (daysUntilExpiry === 0 ? 'Expires today' : `Expires in ${daysUntilExpiry}d`)
                : `Exp: ${format(parseISO(product.expiration_date), 'MMM d')}`
              }
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
