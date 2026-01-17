import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productService } from '@/services/productService';
import { Product, ProductCategory, StorageLocation, categoryLabels, locationLabels } from '@/types';
import { toast } from 'sonner';

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
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('other');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [location, setLocation] = useState<StorageLocation>('fridge');
  const [expirationDate, setExpirationDate] = useState('');
  const [loading, setLoading] = useState(false);

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
        category,
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        min_quantity: parseFloat(minQuantity),
        location,
        expiration_date: expirationDate || null,
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
    setCategory('other');
    setQuantity('');
    setUnit('');
    setMinQuantity('');
    setLocation('fridge');
    setExpirationDate('');
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
              <Label htmlFor="category">קטגוריה</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">מיקום</Label>
              <Select value={location} onValueChange={(v) => setLocation(v as StorageLocation)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(locationLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                dir="ltr"
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
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">תאריך תפוגה</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

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
