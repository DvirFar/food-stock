import { useState, useEffect, useRef, useMemo } from 'react';
import { Product } from '@/types';
import { productService } from '@/services/productService';
import { useSettings } from '@/hooks/useSettings';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductIngredientPickerProps {
  value: string;
  onSelect: (product: Product) => void;
  onChange: (name: string) => void;
  className?: string;
}

export const ProductIngredientPicker = ({
  value,
  onSelect,
  onChange,
  className,
}: ProductIngredientPickerProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { categories } = useSettings();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    productService.getAll().then(setProducts).catch(console.error);
  }, []);

  // Sync external value changes
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter(p => p.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, search, selectedCategory]);

  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats.sort();
  }, [products]);

  const handleInputChange = (val: string) => {
    setSearch(val);
    onChange(val);
    if (!open) setOpen(true);
  };

  const handleSelect = (product: Product) => {
    setSearch(product.name);
    onSelect(product);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          placeholder="חפש מוצר..."
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          className="pe-8"
        />
        <ChevronDown
          className="absolute end-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {/* Category filter chips */}
          {uniqueCategories.length > 1 && (
            <div className="flex flex-wrap gap-1 p-2 border-b">
              <Badge
                variant={selectedCategory === null ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedCategory(null)}
              >
                <Filter className="h-3 w-3 me-1" />
                הכל
              </Badge>
              {uniqueCategories.map(cat => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedCategory(prev => prev === cat ? null : cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="max-h-48">
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                לא נמצאו מוצרים
              </div>
            ) : (
              <div className="py-1">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                      product.name === value && 'bg-accent/50'
                    )}
                    onClick={() => handleSelect(product)}
                  >
                    <span className="flex items-center gap-2">
                      {product.name === value && <Check className="h-3 w-3" />}
                      <span>{product.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {product.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
