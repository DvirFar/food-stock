import { useState, useMemo } from 'react';
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
import { ProductTagInput } from '@/components/ProductTagInput';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: (product: Product) => void;
}

export const AddProductDialog = ({
  open,
  onOpenChange,
  onProductAdded,
}: AddProductDialogProps) => {
  const { categories, locations } = useSettings();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('אחר');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [location, setLocation] = useState('מקרר');
  const [expirationDate, setExpirationDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [locOpen, setLocOpen] = useState(false);
  const [locSearch, setLocSearch] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !quantity || !unit.trim() || !minQuantity) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    setLoading(true);
    try {
      const product = await productService.create({
        name: name.trim(),
        category: category as any,
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        min_quantity: parseFloat(minQuantity),
        location: location as any,
        expiration_date: expirationDate || null,
        tags,
      });
      
      onProductAdded(product);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('שגיאה בהוספת מוצר');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('אחר');
    setQuantity('');
    setUnit('');
    setMinQuantity('');
    setLocation('מקרר');
    setExpirationDate('');
    setTags([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>הוספת מוצר חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: חלב"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Popover open={catOpen} onOpenChange={setCatOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {category}
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
                            value={cat.name}
                            onSelect={() => { setCategory(cat.name); setCatOpen(false); }}
                          >
                            <Check className={cn("me-2 h-4 w-4", category === cat.name ? "opacity-100" : "opacity-0")} />
                            {cat.name}
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
                    {location}
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
                            value={loc.name}
                            onSelect={() => { setLocation(loc.name); setLocOpen(false); }}
                          >
                            <Check className={cn("me-2 h-4 w-4", location === loc.name ? "opacity-100" : "opacity-0")} />
                            {loc.name}
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
              <Label htmlFor="quantity">כמות *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="לדוגמה: 2"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">יחידה *</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="לדוגמה: ליטר"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minQuantity">כמות מינימום *</Label>
              <Input
                id="minQuantity"
                type="number"
                step="0.01"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="לדוגמה: 1"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">תאריך תפוגה</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>

          <ProductTagInput tags={tags} onChange={setTags} />

          <div className="flex justify-start gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'מוסיף...' : 'הוסף מוצר'}
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