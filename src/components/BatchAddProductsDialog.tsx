import { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Product } from '@/types';
import { productService } from '@/services/productService';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';


// Helper function to normalize text for matching
const normalizeText = (text: string): string => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[_\s]+/g, " ").trim();
};

interface BatchProductEntry {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  minQuantity: string;
  location: string;
  expirationDate: string;
}

interface BatchAddProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductsAdded: (products: Product[]) => void;
}

const createEmptyEntry = (): BatchProductEntry => ({
  name: '',
  category: 'אחר',
  quantity: '',
  unit: '',
  minQuantity: '',
  location: 'מקרר',
  expirationDate: ''
});

export const BatchAddProductsDialog = ({
  open,
  onOpenChange,
  onProductsAdded
}: BatchAddProductsDialogProps) => {
  const { categories, locations } = useSettings();
  const [entries, setEntries] = useState<BatchProductEntry[]>([createEmptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build matching maps from dynamic settings
  const matchCategory = useMemo(() => {
    return (value: string): string => {
      const normalized = normalizeText(String(value || ''));
      const directMatch = categories.find(c => normalizeText(c.name) === normalized);
      if (directMatch) return directMatch.name;
      const partialMatch = categories.find(c => 
        normalizeText(c.name).includes(normalized) || normalized.includes(normalizeText(c.name))
      );
      if (partialMatch) return partialMatch.name;
      return 'אחר';
    };
  }, [categories]);

  const matchLocation = useMemo(() => {
    return (value: string): string => {
      const normalized = normalizeText(String(value || ''));
      const directMatch = locations.find(l => normalizeText(l.name) === normalized);
      if (directMatch) return directMatch.name;
      const partialMatch = locations.find(l => 
        normalizeText(l.name).includes(normalized) || normalized.includes(normalizeText(l.name))
      );
      if (partialMatch) return partialMatch.name;
      return 'מקרר';
    };
  }, [locations]);

  const addEntry = () => {
    setEntries([...entries, createEmptyEntry()]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof BatchProductEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const resetForm = () => {
    setEntries([createEmptyEntry()]);
    setActiveTab('manual');
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
      const parsedEntries: BatchProductEntry[] = jsonData.map(row => ({
        name: row['שם'] || row['name'] || '',
        category: matchCategory(row['קטגוריה'] || row['category'] || ''),
        quantity: String(row['כמות'] || row['quantity'] || ''),
        unit: row['יחידה'] || row['unit'] || '',
        minQuantity: String(row['כמות מינימום'] || row['min_quantity'] || ''),
        location: matchLocation(row['מיקום'] || row['location'] || ''),
        expirationDate: row['תאריך תפוגה'] || row['expiration_date'] || ''
      }));
      setEntries(parsedEntries.filter(entry => entry.name.trim()));
      toast.success(`${parsedEntries.length} מוצרים נטענו מהקובץ`);
    } catch (error) {
      toast.error('שגיאה בקריאת הקובץ');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [{
      'שם': 'חלב',
      'קטגוריה': 'dairy',
      'כמות': '2',
      'יחידה': 'ליטר',
      'כמות מינימום': '1',
      'מיקום': 'מקרר',
      'תאריך תפוגה': '2025-02-15'
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products_template.xlsx');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validEntries = entries.filter(entry => entry.name.trim() && entry.quantity && entry.unit.trim() && entry.minQuantity);
    if (validEntries.length === 0) {
      toast.error('נא למלא לפחות מוצר אחד עם כל השדות הנדרשים');
      return;
    }
    setLoading(true);
    try {
      const addedProducts: Product[] = [];
      for (const entry of validEntries) {
        const product = await productService.create({
          name: entry.name.trim(),
          category: entry.category as any,
          quantity: parseFloat(entry.quantity),
          unit: entry.unit.trim(),
          min_quantity: parseFloat(entry.minQuantity),
          location: entry.location as any,
          expiration_date: entry.expirationDate || null
        });
        addedProducts.push(product);
      }
      onProductsAdded(addedProducts);
      toast.success(`${addedProducts.length} מוצרים נוספו בהצלחה`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('שגיאה בהוספת מוצרים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>הוספת מוצרים בכמות</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">הזנה ידנית</TabsTrigger>
            <TabsTrigger value="file">העלאת קובץ</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="flex-1 overflow-hidden flex flex-col mt-4">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 pe-4">
                <div className="space-y-4">
                  {entries.map((entry, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">מוצר {index + 1}</span>
                        {entries.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">שם *</Label>
                          <Input value={entry.name} onChange={e => updateEntry(index, 'name', e.target.value)} placeholder="שם המוצר" />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">קטגוריה</Label>
                          <Select value={entry.category} onValueChange={v => updateEntry(index, 'category', v)}>
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

                        <div className="space-y-1">
                          <Label className="text-xs">מיקום</Label>
                          <Select value={entry.location} onValueChange={v => updateEntry(index, 'location', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">כמות *</Label>
                          <Input type="number" step="0.01" min="0" value={entry.quantity} onChange={e => updateEntry(index, 'quantity', e.target.value)} placeholder="2" dir="rtl" />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">יחידה *</Label>
                          <Input value={entry.unit} onChange={e => updateEntry(index, 'unit', e.target.value)} placeholder="ליטר" />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">כמות מינימום *</Label>
                          <Input type="number" step="0.01" min="0" value={entry.minQuantity} onChange={e => updateEntry(index, 'minQuantity', e.target.value)} placeholder="1" dir="rtl" />
                        </div>

                        <div className="space-y-1 col-span-2 md:col-span-1">
                          <Label className="text-xs">תאריך תפוגה</Label>
                          <Input type="date" value={entry.expirationDate} onChange={e => updateEntry(index, 'expirationDate', e.target.value)} dir="rtl" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={addEntry} className="w-full">
                  <Plus className="h-4 w-4 me-2" />
                  הוסף מוצר נוסף
                </Button>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  ביטול
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'מוסיף...' : `הוסף ${entries.filter(e => e.name.trim()).length} מוצרים`}
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
                  הקובץ צריך להכיל עמודות: שם, קטגוריה, כמות, יחידה, כמות מינימום, מיקום, תאריך תפוגה
                </p>
                <div className="flex justify-center gap-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 me-2" />
                    בחר קובץ
                  </Button>
                  <Button type="button" variant="ghost" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 me-2" />
                    הורד תבנית
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
              </div>

              {entries.length > 0 && entries[0].name && (
                <div className="space-y-2">
                  <h4 className="font-medium">מוצרים שנטענו ({entries.filter(e => e.name.trim()).length})</h4>
                  <ScrollArea className="h-[300px] border rounded-lg p-2">
                    <div className="space-y-1">
                      {entries.filter(e => e.name.trim()).map((entry, index) => (
                        <div key={index} className="text-sm p-2 bg-muted/50 rounded flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {entry.category} • {entry.location}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {entry.quantity} {entry.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button onClick={handleSubmit} disabled={loading} className="w-full">
                    {loading ? 'מוסיף...' : `הוסף ${entries.filter(e => e.name.trim()).length} מוצרים`}
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