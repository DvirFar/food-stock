import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/types';
import { useSettings } from '@/hooks/useSettings';

interface AddProductToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allProducts: Product[];
  alreadyVisibleIds: Set<string>;
  onProductsAdded: (productIds: string[]) => void;
}

export const AddProductToListDialog = ({
  open,
  onOpenChange,
  allProducts,
  alreadyVisibleIds,
  onProductsAdded,
}: AddProductToListDialogProps) => {
  const { categories, categoryLabels } = useSettings();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [catFilterOpen, setCatFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const availableProducts = useMemo(() => {
    let filtered = allProducts.filter(p => !alreadyVisibleIds.has(p.id));
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }
    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [allProducts, alreadyVisibleIds, filterCategory, search]);

  const toggleProduct = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    onProductsAdded(Array.from(selected));
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelected(new Set());
    setSearch('');
    setFilterCategory('all');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>הוסף מוצרים לרשימה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label>סנן לפי קטגוריה</Label>
            <Popover open={catFilterOpen} onOpenChange={setCatFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {filterCategory === 'all' ? 'כל הקטגוריות' : (categoryLabels[filterCategory] || filterCategory)}
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="חפש קטגוריה..." />
                  <CommandList>
                    <CommandEmpty>לא נמצא</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="כל הקטגוריות" onSelect={() => { setFilterCategory('all'); setCatFilterOpen(false); }}>
                        <Check className={cn("me-2 h-4 w-4", filterCategory === 'all' ? "opacity-100" : "opacity-0")} />
                        כל הקטגוריות
                      </CommandItem>
                      {categories.map((cat) => (
                        <CommandItem key={cat.id} value={cat.label} onSelect={() => { setFilterCategory(cat.name); setCatFilterOpen(false); }}>
                          <Check className={cn("me-2 h-4 w-4", filterCategory === cat.name ? "opacity-100" : "opacity-0")} />
                          {cat.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Input placeholder="חפש מוצר..." value={search} onChange={(e) => setSearch(e.target.value)} />

          <ScrollArea className="flex-1 min-h-[150px] max-h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {availableProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">לא נמצאו מוצרים להוספה</p>
              ) : (
                availableProducts.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                      selected.has(product.id) && "bg-accent"
                    )}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <Checkbox checked={selected.has(product.id)} />
                    <span className="flex-1 text-sm font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.quantity} {product.unit}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabels[product.category] || product.category}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {selected.size > 0 && (
            <p className="text-sm text-muted-foreground">{selected.size} מוצרים נבחרו</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={resetAndClose}>ביטול</Button>
          <Button onClick={handleSubmit} disabled={selected.size === 0}>
            הוסף {selected.size > 0 ? `${selected.size} מוצרים` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
