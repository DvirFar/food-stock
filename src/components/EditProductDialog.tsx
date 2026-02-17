import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onProductUpdated: (product: Product) => void;
}

export const EditProductDialog = ({
  open,
  onOpenChange,
  product,
  onProductUpdated,
}: EditProductDialogProps) => {
  const { categories, locations, categoryLabels, locationLabels } = useSettings();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [locOpen, setLocOpen] = useState(false);
  const [locSearch, setLocSearch] = useState('');

  useEffect(() => {
    if (product && open) {
      setName(product.name);
      setCategory(product.category);
      setQuantity(String(product.quantity));
      setUnit(product.unit);
      setMinQuantity(String(product.min_quantity));
      setLocation(product.location);
      setExpirationDate(product.expiration_date || '');
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !quantity || !unit.trim() || !minQuantity) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    setLoading(true);
    try {
      const updated = await productService.update(product.id, {
        name: name.trim(),
        category,
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        min_quantity: parseFloat(minQuantity),
        location,
        expiration_date: expirationDate || null,
      });

      if (updated) {
        onProductUpdated(updated);
        onOpenChange(false);
        toast.success('המוצר עודכן בהצלחה');
      }
    } catch (error) {
      toast.error('שגיאה בעדכון מוצר');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>עריכת מוצר</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">שם *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Popover open={catOpen} onOpenChange={setCatOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {categoryLabels[category] || category}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="חפש קטגוריה..." value={catSearch} onValueChange={setCatSearch} />
                    <CommandList>
                      <CommandEmpty>לא נמצאה קטגוריה</CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.label}
                            onSelect={() => { setCategory(cat.name); setCatOpen(false); }}
                          >
                            <Check className={cn("me-2 h-4 w-4", category === cat.name ? "opacity-100" : "opacity-0")} />
                            {cat.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>מיקום</Label>
              <Popover open={locOpen} onOpenChange={setLocOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {locationLabels[location] || location}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="חפש מיקום..." value={locSearch} onValueChange={setLocSearch} />
                    <CommandList>
                      <CommandEmpty>לא נמצא מיקום</CommandEmpty>
                      <CommandGroup>
                        {locations.map((loc) => (
                          <CommandItem
                            key={loc.id}
                            value={loc.label}
                            onSelect={() => { setLocation(loc.name); setLocOpen(false); }}
                          >
                            <Check className={cn("me-2 h-4 w-4", location === loc.name ? "opacity-100" : "opacity-0")} />
                            {loc.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">כמות *</Label>
              <Input
                id="edit-quantity"
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">יחידה *</Label>
              <Input
                id="edit-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-minQuantity">כמות מינימום *</Label>
              <Input
                id="edit-minQuantity"
                type="number"
                step="0.01"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expirationDate">תאריך תפוגה</Label>
              <Input
                id="edit-expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex justify-start gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'מעדכן...' : 'עדכן מוצר'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
