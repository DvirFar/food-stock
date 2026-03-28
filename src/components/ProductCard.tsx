import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Minus, 
  Plus, 
  Trash2,
  Pencil,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Product } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { format, differenceInDays, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
  showLowStock?: boolean;
  showExpiration?: boolean;
  onQuantityChange?: (id: string, newQuantity: number) => void;
  onDelete?: (id: string) => void;
  onEdit?: (product: Product) => void;
}

export const ProductCard = ({
  product,
  variant = 'default',
  showLowStock = false,
  showExpiration = false,
  onQuantityChange,
  onDelete,
  onEdit,
}: ProductCardProps) => {
  const { } = useSettings();
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
                  <AlertTriangle className="h-3 w-3 me-1" />
                  נמוך
                </Badge>
              )}
              {showExpiration && isExpiringSoon && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 me-1" />
                  {daysUntilExpiry === 0 ? 'היום' : `${daysUntilExpiry} ימים`}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Badge variant="outline">
          {product.location}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`transition-shadow hover:shadow-md ${isLowStock ? 'border-destructive/50' : ''}`} dir="rtl">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(product)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
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
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="outline" className="text-xs truncate max-w-[120px]">
            {product.category}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {product.location}
          </Badge>
          {product.tags?.filter(t => t !== 'low-stock').map(tag => (
            <Badge key={tag} variant="outline" className="text-xs bg-accent/50">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
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
            <div className="text-center min-w-[60px]">
              <span className="text-xl font-bold">{product.quantity}</span>
              <span className="text-muted-foreground me-1 text-sm">{product.unit}</span>
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
          
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            מינימום: {product.min_quantity}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {showLowStock && isLowStock && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 me-1" />
              מלאי נמוך
            </Badge>
          )}
          {showExpiration && product.expiration_date && (
            <Badge variant={isExpiringSoon ? 'secondary' : 'outline'}>
              <Clock className="h-3 w-3 me-1" />
              {isExpiringSoon 
                ? (daysUntilExpiry === 0 ? 'פג תוקף היום' : `פג תוקף בעוד ${daysUntilExpiry} ימים`)
                : `תוקף: ${format(parseISO(product.expiration_date), 'd בMMM', { locale: he })}`
              }
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};