import { useState, useRef, useMemo, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, FileSpreadsheet, Download, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, ShoppingListItem } from '@/types';
import { productService } from '@/services/productService';
import { shoppingListService } from '@/services/shoppingListService';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';


interface BatchShoppingEntry {
  name: string;
  quantity: string;
  unit: string;
  category: string;
}

interface SelectedProductEntry {
  product: Product;
  quantity: string;
}

interface BatchAddShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemsAdded: (items: ShoppingListItem[]) => void;
}

const createEmptyEntry = (): BatchShoppingEntry => ({
  name: '',
  quantity: '1',
  unit: 'יחידות',
  category: 'אחר',
});

export const BatchAddShoppingListDialog = ({
  open,
  onOpenChange,
  onItemsAdded,
}: BatchAddShoppingListDialogProps) => {
  const { categories } = useSettings();
  const [entries, setEntries] = useState<BatchShoppingEntry[]>([createEmptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product selection state
  const [products, setProducts] = useState<Product[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [catFilterOpen, setCatFilterOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductEntry[]>([]);
  const [productSearch, setProductSearch] = useState('');

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
    if (productSearch) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
      );
    }
    return filtered;
  }, [products, filterCategory, productSearch]);

  const isProductSelected = (id: string) => selectedProducts.some(sp => sp.product.id === id);

  const toggleProduct = (product: Product) => {
    setSelectedProducts(prev => {
      if (prev.some(sp => sp.product.id === product.id)) {
        return prev.filter(sp => sp.product.id !== product.id);
      }
      return [...prev, { product, quantity: '1' }];
    });
  };

  const updateSelectedQuantity = (productId: string, quantity: string) => {
    setSelectedProducts(prev =>
      prev.map(sp => sp.product.id === productId ? { ...sp, quantity } : sp)
    );
  };

  const removeSelectedProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(sp => sp.product.id !== productId));
  };

  const addEntry = () => {
    setEntries([...entries, createEmptyEntry()]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const {
    requestConfirm: requestRemoveEntry,
    confirm: confirmRemoveEntry,
    cancel: cancelRemoveEntry,
    isOpen: isOpenRemoveEntry,
  } = useConfirmDelete<number>(removeEntry);


  const updateEntry = (index: number, field: keyof BatchShoppingEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const resetForm = () => {
    setEntries([createEmptyEntry()]);
    setActiveTab('products');
    setSelectedProducts([]);
    setFilterCategory('all');
    setProductSearch('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

      if (jsonData.length === 0) {
        toast.error('הקובץ ריק');
        return;
      }

      const parsedEntries: BatchShoppingEntry[] = jsonData.map((row) => ({
        name: row['שם'] || row['name'] || '',
        quantity: String(row['כמות'] || row['quantity'] || '1'),
        unit: row['יחידה'] || row['unit'] || 'יחידות',
        category: row['קטגוריה'] || row['category'] || 'אחר',
      }));

      setEntries(parsedEntries.filter(entry => entry.name.trim()));
      toast.success(`${parsedEntries.length} פריטים נטענו מהקובץ`);
    } catch (error) {
      toast.error('שגיאה בקריאת הקובץ');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'שם': 'חלב',
        'כמות': '2',
        'יחידה': 'ליטר',
        'קטגוריה': 'dairy',
      },
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ShoppingList');
    XLSX.writeFile(wb, 'shopping_list_template.xlsx');
  };

  const handleSubmitProducts = async () => {
    if (selectedProducts.length === 0) {
      toast.error('נא לבחור לפחות מוצר אחד');
      return;
    }

    setLoading(true);
    try {
      const addedItems: ShoppingListItem[] = [];
      for (const sp of selectedProducts) {
        const item = await shoppingListService.addItem({
          product_id: sp.product.id,
          name: sp.product.name,
          quantity: parseFloat(sp.quantity) || 1,
          unit: sp.product.unit,
          category: sp.product.category as any,
        });
        addedItems.push(item);
      }
      onItemsAdded(addedItems);
      toast.success(`${addedItems.length} פריטים נוספו לרשימת הקניות`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('שגיאה בהוספת פריטים');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManual = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const validEntries = entries.filter(entry => entry.name.trim());
    if (validEntries.length === 0) {
      toast.error('נא למלא לפחות פריט אחד');
      return;
    }

    setLoading(true);
    try {
      const addedItems: ShoppingListItem[] = [];
      for (const entry of validEntries) {
        const item = await shoppingListService.addItem({
          name: entry.name.trim(),
          quantity: parseFloat(entry.quantity) || 1,
          unit: entry.unit.trim() || 'יחידות',
          category: entry.category as any,
        });
        addedItems.push(item);
      }
      onItemsAdded(addedItems);
      toast.success(`${addedItems.length} פריטים נוספו לרשימת הקניות`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('שגיאה בהוספת פריטים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>הוספת פריטים בכמות לרשימת הקניות</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">בחירה מהמלאי</TabsTrigger>
            <TabsTrigger value="manual">הזנה ידנית</TabsTrigger>
            <TabsTrigger value="file">העלאת קובץ</TabsTrigger>
          </TabsList>

          {/* Products Selection Tab */}
          <TabsContent value="products" className="flex-1 overflow-auto flex flex-col mt-4">
            <div className="flex-1 flex flex-col space-y-4">
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

              {/* Product Search */}
              <Input
                placeholder="חפש מוצר..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />

              {/* Product List */}
              <ScrollArea className="min-h-[100px] max-h-[250px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">לא נמצאו מוצרים</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                          isProductSelected(product.id) && "bg-accent"
                        )}
                        onClick={() => toggleProduct(product)}
                      >
                        <Checkbox checked={isProductSelected(product.id)} />
                        <span className="flex-1 text-sm font-medium">{product.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Selected Products with quantities */}
              {selectedProducts.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <Label>מוצרים נבחרים ({selectedProducts.length})</Label>
                  <ScrollArea className="max-h-[150px]">
                    <div className="space-y-2">
                      {selectedProducts.map((sp) => (
                        <div key={sp.product.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                          <span className="flex-1 text-sm">{sp.product.name}</span>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={sp.quantity}
                            onChange={(e) => updateSelectedQuantity(sp.product.id, e.target.value)}
                            className="w-20 h-8 text-sm"
                            dir="rtl"
                          />
                          <span className="text-xs text-muted-foreground">{sp.product.unit}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeSelectedProduct(sp.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  ביטול
                </Button>
                <Button onClick={handleSubmitProducts} disabled={loading || selectedProducts.length === 0}>
                  {loading ? 'מוסיף...' : `הוסף ${selectedProducts.length} פריטים`}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-hidden flex flex-col mt-4">
            <form onSubmit={handleSubmitManual} className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 pe-4">
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/30">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">שם *</Label>
                          <Input
                            value={entry.name}
                            onChange={(e) => updateEntry(index, 'name', e.target.value)}
                            placeholder="שם הפריט"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">כמות</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={entry.quantity}
                            onChange={(e) => updateEntry(index, 'quantity', e.target.value)}
                            dir="rtl"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">יחידה</Label>
                          <Input
                            value={entry.unit}
                            onChange={(e) => updateEntry(index, 'unit', e.target.value)}
                            placeholder="יחידות"
                          />
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">קטגוריה</Label>
                            <Select
                              value={entry.category}
                              onValueChange={(v) => updateEntry(index, 'category', v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {entries.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mt-5"
                              onClick={() => removeEntry(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={addEntry} className="w-full">
                  <Plus className="h-4 w-4 me-2" />
                  הוסף פריט נוסף
                </Button>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  ביטול
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'מוסיף...' : `הוסף ${entries.filter(e => e.name.trim()).length} פריטים`}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="file" className="flex-1 flex flex-col mt-4">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">העלה קובץ Excel או CSV</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  הקובץ צריך להכיל עמודות: שם, כמות, יחידה, קטגוריה
                </p>
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 me-2" />
                    בחר קובץ
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 me-2" />
                    הורד תבנית
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {entries.length > 0 && entries[0].name && (
                <div className="space-y-2">
                  <h4 className="font-medium">פריטים שנטענו ({entries.filter(e => e.name.trim()).length})</h4>
                  <ScrollArea className="h-[200px] border rounded-lg p-2">
                    <div className="space-y-1">
                      {entries.filter(e => e.name.trim()).map((entry, index) => (
                        <div key={index} className="text-sm p-2 bg-muted/50 rounded flex justify-between">
                          <span>{entry.name}</span>
                          <span className="text-muted-foreground">
                            {entry.quantity} {entry.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button onClick={() => handleSubmitManual()} disabled={loading} className="w-full">
                    {loading ? 'מוסיף...' : `הוסף ${entries.filter(e => e.name.trim()).length} פריטים`}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
