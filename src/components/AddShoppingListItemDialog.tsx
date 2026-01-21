import { useState, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, ProductCategory, StorageLocation, categoryLabels, locationLabels, ShoppingListItem } from '@/types';
import { productService } from '@/services/productService';
import { shoppingListService } from '@/services/shoppingListService';
import { toast } from 'sonner';

interface AddShoppingListItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (item: ShoppingListItem) => void;
}

export const AddShoppingListItemDialog = ({
  open,
  onOpenChange,
  onItemAdded,
}: AddShoppingListItemDialogProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Selected product or new product mode
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  
  // Form fields for shopping list item
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('יחידות');
  
  // New product fields
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<ProductCategory>('other');
  const [newProductLocation, setNewProductLocation] = useState<StorageLocation>('pantry');
  const [newProductMinQuantity, setNewProductMinQuantity] = useState('1');

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      toast.error('שגיאה בטעינת המוצרים');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchValue) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [products, searchValue]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsNewProduct(false);
    setUnit(product.unit);
    setSearchOpen(false);
  };

  const handleCreateNewProduct = () => {
    setIsNewProduct(true);
    setSelectedProduct(null);
    setNewProductName(searchValue);
    setSearchOpen(false);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setIsNewProduct(false);
    setSearchValue('');
    setQuantity('1');
    setUnit('יחידות');
    setNewProductName('');
    setNewProductCategory('other');
    setNewProductLocation('pantry');
    setNewProductMinQuantity('1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct && !isNewProduct) {
      toast.error('יש לבחור מוצר או ליצור חדש');
      return;
    }

    if (isNewProduct && !newProductName.trim()) {
      toast.error('יש להזין שם מוצר');
      return;
    }

    setLoading(true);

    try {
      let productToUse: Product | null = selectedProduct;

      // If creating a new product, create it first
      if (isNewProduct) {
        const newProduct = await productService.create({
          name: newProductName.trim(),
          category: newProductCategory,
          location: newProductLocation,
          quantity: 0,
          min_quantity: Number(newProductMinQuantity) || 1,
          unit: unit,
        });
        productToUse = newProduct;
        toast.success(`המוצר "${newProductName}" נוסף למלאי`);
      }

      // Add to shopping list
      const shoppingItem = await shoppingListService.addItem({
        product_id: productToUse?.id || null,
        name: productToUse?.name || newProductName.trim(),
        quantity: Number(quantity) || 1,
        unit: unit,
        category: productToUse?.category || newProductCategory,
      });

      onItemAdded(shoppingItem);
      toast.success('הפריט נוסף לרשימת הקניות');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('שגיאה בהוספת הפריט');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>הוסף פריט לרשימת הקניות</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label>בחר מוצר</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                >
                  {selectedProduct 
                    ? selectedProduct.name 
                    : isNewProduct 
                      ? `מוצר חדש: ${newProductName}`
                      : 'חפש או הוסף מוצר...'}
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="חפש מוצר..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          לא נמצאו מוצרים
                        </p>
                        {searchValue && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleCreateNewProduct}
                          >
                            <Plus className="h-4 w-4 me-2" />
                            צור מוצר חדש: "{searchValue}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => handleSelectProduct(product)}
                        >
                          <Check
                            className={cn(
                              "me-2 h-4 w-4",
                              selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{product.name}</span>
                          <span className="ms-auto text-xs text-muted-foreground">
                            {categoryLabels[product.category]}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {searchValue && filteredProducts.length > 0 && (
                      <CommandGroup heading="או">
                        <CommandItem onSelect={handleCreateNewProduct}>
                          <Plus className="me-2 h-4 w-4" />
                          צור מוצר חדש: "{searchValue}"
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* New Product Fields */}
          {isNewProduct && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm">פרטי מוצר חדש</h4>
              
              <div className="space-y-2">
                <Label>שם המוצר</Label>
                <Input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>קטגוריה</Label>
                  <Select
                    value={newProductCategory}
                    onValueChange={(v) => setNewProductCategory(v as ProductCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>מיקום</Label>
                  <Select
                    value={newProductLocation}
                    onValueChange={(v) => setNewProductLocation(v as StorageLocation)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(locationLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>כמות מינימום</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newProductMinQuantity}
                  onChange={(e) => setNewProductMinQuantity(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>כמות</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>יחידה</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="יחידות"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'מוסיף...' : 'הוסף לרשימה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
