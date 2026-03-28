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
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, ShoppingListItem } from '@/types';
import { productService } from '@/services/productService';
import { shoppingListService } from '@/services/shoppingListService';
import { useSettings } from '@/hooks/useSettings';
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
  const { categories, locations, categoryLabels, locationLabels } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [catFilterOpen, setCatFilterOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('יחידות');
  
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('other');
  const [newProductLocation, setNewProductLocation] = useState('pantry');
  const [newProductMinQuantity, setNewProductMinQuantity] = useState('1');

  const [catOpen, setCatOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

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
    let filtered = products;
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }
    if (searchValue) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    return filtered;
  }, [products, searchValue, filterCategory]);

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
    setFilterCategory('all');
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

      if (isNewProduct) {
        const newProduct = await productService.create({
          name: newProductName.trim(),
          category: newProductCategory as any,
          location: newProductLocation as any,
          quantity: 0,
          min_quantity: Number(newProductMinQuantity) || 1,
          unit: unit,
        });
        productToUse = newProduct;
        toast.success(`המוצר "${newProductName}" נוסף למלאי`);
      }

      const shoppingItem = await shoppingListService.addItem({
        product_id: productToUse?.id || null,
        name: productToUse?.name || newProductName.trim(),
        quantity: Number(quantity) || 1,
        unit: unit,
        category: (productToUse?.category || newProductCategory) as any,
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
          {/* Category Filter */}
          <div className="space-y-2">
            <Label>סנן לפי קטגוריה</Label>
            <Popover open={catFilterOpen} onOpenChange={setCatFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {filterCategory === 'all' ? 'כל הקטגוריות' : filterCategory}
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
                        <CommandItem key={cat.id} value={cat.name} onSelect={() => { setFilterCategory(cat.name); setCatFilterOpen(false); }}>
                          <Check className={cn("me-2 h-4 w-4", filterCategory === cat.name ? "opacity-100" : "opacity-0")} />
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

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
                            {product.category}
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
                  <Popover open={catOpen} onOpenChange={setCatOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between text-sm">
                        {newProductCategory}
                        <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="חפש..." />
                        <CommandList>
                          <CommandEmpty>לא נמצא</CommandEmpty>
                          <CommandGroup>
                            {categories.map((cat) => (
                              <CommandItem key={cat.id} value={cat.name} onSelect={() => { setNewProductCategory(cat.name); setCatOpen(false); }}>
                                <Check className={cn("me-2 h-4 w-4", newProductCategory === cat.name ? "opacity-100" : "opacity-0")} />
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
                      <Button variant="outline" role="combobox" className="w-full justify-between text-sm">
                        {newProductLocation}
                        <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="חפש..." />
                        <CommandList>
                          <CommandEmpty>לא נמצא</CommandEmpty>
                          <CommandGroup>
                            {locations.map((loc) => (
                              <CommandItem key={loc.id} value={loc.name} onSelect={() => { setNewProductLocation(loc.name); setLocOpen(false); }}>
                                <Check className={cn("me-2 h-4 w-4", newProductLocation === loc.name ? "opacity-100" : "opacity-0")} />
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