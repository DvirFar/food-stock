import { useState, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { ProductCategory, ShoppingListItem, categoryLabels } from '@/types';
import { shoppingListService } from '@/services/shoppingListService';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface BatchShoppingEntry {
  name: string;
  quantity: string;
  unit: string;
  category: ProductCategory;
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
  category: 'other',
});

export const BatchAddShoppingListDialog = ({
  open,
  onOpenChange,
  onItemsAdded,
}: BatchAddShoppingListDialogProps) => {
  const [entries, setEntries] = useState<BatchShoppingEntry[]>([createEmptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addEntry = () => {
    setEntries([...entries, createEmptyEntry()]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof BatchShoppingEntry, value: string) => {
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

      const parsedEntries: BatchShoppingEntry[] = jsonData.map((row) => ({
        name: row['שם'] || row['name'] || '',
        quantity: String(row['כמות'] || row['quantity'] || '1'),
        unit: row['יחידה'] || row['unit'] || 'יחידות',
        category: (row['קטגוריה'] || row['category'] || 'other') as ProductCategory,
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

  const handleSubmit = async (e?: React.FormEvent) => {
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
          category: entry.category,
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">הזנה ידנית</TabsTrigger>
            <TabsTrigger value="file">העלאת קובץ</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="flex-1 overflow-hidden flex flex-col mt-4">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
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
                            dir="ltr"
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
                                {Object.entries(categoryLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
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
                  <Button onClick={() => handleSubmit()} disabled={loading} className="w-full">
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
