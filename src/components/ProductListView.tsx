import { useState } from 'react';
import { Product } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertTriangle, Clock, Tag, MapPin, FolderOpen, X, Check } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { productService } from '@/services/productService';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ProductListViewProps {
  products: Product[];
  onProductUpdated: (product: Product) => void;
  onProductsUpdated: (products: Product[]) => void;
  onQuantityChange?: (id: string, newQuantity: number) => void;
  onDelete?: (id: string) => void;
  onEdit?: (product: Product) => void;
}

export const ProductListView = ({
  products,
  onProductUpdated,
  onProductsUpdated,
  onEdit,
  onDelete,
}: ProductListViewProps) => {
  const { categories, locations, productTags } = useSettings();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const selectedProducts = products.filter(p => selectedIds.has(p.id));

  const bulkUpdateCategory = async (category: string) => {
    try {
      const updated: Product[] = [];
      for (const p of selectedProducts) {
        const result = await productService.update(p.id, { category });
        if (result) updated.push(result);
      }
      onProductsUpdated(updated);
      toast.success(`עודכנה קטגוריה ל-${selectedProducts.length} מוצרים`);
      setSelectedIds(new Set());
    } catch {
      toast.error('שגיאה בעדכון קטגוריה');
    }
  };

  const bulkUpdateLocation = async (location: string) => {
    try {
      const updated: Product[] = [];
      for (const p of selectedProducts) {
        const result = await productService.update(p.id, { location });
        if (result) updated.push(result);
      }
      onProductsUpdated(updated);
      toast.success(`עודכן מיקום ל-${selectedProducts.length} מוצרים`);
      setSelectedIds(new Set());
    } catch {
      toast.error('שגיאה בעדכון מיקום');
    }
  };

  const bulkAddTag = async (tag: string) => {
    try {
      const updated: Product[] = [];
      for (const p of selectedProducts) {
        const currentTags = p.tags || [];
        if (!currentTags.includes(tag)) {
          const result = await productService.update(p.id, { tags: [...currentTags, tag] });
          if (result) updated.push(result);
        }
      }
      onProductsUpdated(updated);
      toast.success(`נוסף תג "${tag}" ל-${selectedProducts.length} מוצרים`);
      setSelectedIds(new Set());
    } catch {
      toast.error('שגיאה בהוספת תג');
    }
  };

  return (
    <div className="space-y-2">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/50 sticky top-0 z-10">
          <span className="text-sm font-medium">
            {selectedIds.size}&nbsp;נבחרו
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4 me-1" />
            ביטול
          </Button>
          <div className="h-4 w-px bg-border" />

          {/* Category bulk assign */}
          <Select onValueChange={bulkUpdateCategory}>
            <SelectTrigger className="w-auto h-8 text-xs gap-1">
              <FolderOpen className="h-3.5 w-3.5" />
              <span>קטגוריה</span>
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location bulk assign */}
          <Select onValueChange={bulkUpdateLocation}>
            <SelectTrigger className="w-auto h-8 text-xs gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>מיקום</span>
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tag bulk assign */}
          <Select onValueChange={bulkAddTag}>
            <SelectTrigger className="w-auto h-8 text-xs gap-1">
              <Tag className="h-3.5 w-3.5" />
              <span>תג</span>
            </SelectTrigger>
            <SelectContent>
              {productTags.map(tag => (
                <SelectItem key={tag.id} value={tag.name}>{tag.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <Checkbox
          checked={selectedIds.size === products.length && products.length > 0}
          onCheckedChange={toggleAll}
          className="shrink-0"
        />
        <span className="flex-1 min-w-0">שם</span>
        <span className="w-20 text-center hidden sm:block">כמות</span>
        <span className="w-24 hidden md:block">קטגוריה</span>
        <span className="w-20 hidden md:block">מיקום</span>
        <span className="w-32 hidden lg:block">תגים</span>
      </div>

      {/* Rows */}
      {products.map(product => {
        const isLowStock = product.quantity < product.min_quantity;
        const daysUntilExpiry = product.expiration_date
          ? differenceInDays(parseISO(product.expiration_date), new Date())
          : null;
        const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0;

        return (
          <div
            key={product.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors hover:bg-muted/30 cursor-pointer ${
              selectedIds.has(product.id) ? 'bg-primary/5 border-primary/30' : ''
            }`}
            onClick={() => toggleSelect(product.id)}
          >
            <Checkbox
              checked={selectedIds.has(product.id)}
              onCheckedChange={() => toggleSelect(product.id)}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{product.name}</span>
                {isLowStock && (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
                {isExpiringSoon && (
                  <Clock className="h-3.5 w-3.5 text-warning shrink-0" />
                )}
              </div>
              {/* Mobile: show details inline */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden mt-0.5">
                <span>{product.quantity}&nbsp;{product.unit}</span>
                <span>·</span>
                <span>{product.category}</span>
              </div>
            </div>

            <span className="w-20 text-center text-sm hidden sm:block">
              {product.quantity}&nbsp;{product.unit}
            </span>

            <span className="w-24 hidden md:block">
              <Badge variant="outline" className="text-xs truncate max-w-full">
                {product.category}
              </Badge>
            </span>

            <span className="w-20 hidden md:block">
              <Badge variant="secondary" className="text-xs">
                {product.location}
              </Badge>
            </span>

            <div className="w-32 hidden lg:flex flex-wrap gap-1">
              {product.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs bg-accent/50">
                  {tag}
                </Badge>
              ))}
              {(product.tags?.length || 0) > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{(product.tags?.length || 0) - 2}&nbsp;
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
