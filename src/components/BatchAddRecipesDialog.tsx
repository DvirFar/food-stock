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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Upload, FileSpreadsheet, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Recipe, RecipeIngredient } from '@/types';
import { recipeService } from '@/services/recipeService';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BatchRecipeEntry {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
  isExpanded: boolean;
}

interface BatchAddRecipesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecipesAdded: () => void;
}

const createEmptyEntry = (): BatchRecipeEntry => ({
  name: '',
  description: '',
  prepTime: '',
  cookTime: '',
  servings: '4',
  ingredients: [{ name: '', quantity: 1, unit: 'יחידות' }],
  instructions: [''],
  tags: [],
  isExpanded: true,
});

export const BatchAddRecipesDialog = ({
  open,
  onOpenChange,
  onRecipesAdded,
}: BatchAddRecipesDialogProps) => {
  const [entries, setEntries] = useState<BatchRecipeEntry[]>([createEmptyEntry()]);
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

  const toggleExpanded = (index: number) => {
    const updated = [...entries];
    updated[index].isExpanded = !updated[index].isExpanded;
    setEntries(updated);
  };

  const updateEntry = (index: number, field: keyof BatchRecipeEntry, value: unknown) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const addIngredient = (recipeIndex: number) => {
    const updated = [...entries];
    updated[recipeIndex].ingredients.push({ name: '', quantity: 1, unit: 'יחידות' });
    setEntries(updated);
  };

  const updateIngredient = (recipeIndex: number, ingredientIndex: number, field: keyof RecipeIngredient, value: string | number) => {
    const updated = [...entries];
    updated[recipeIndex].ingredients[ingredientIndex] = {
      ...updated[recipeIndex].ingredients[ingredientIndex],
      [field]: value,
    };
    setEntries(updated);
  };

  const removeIngredient = (recipeIndex: number, ingredientIndex: number) => {
    const updated = [...entries];
    if (updated[recipeIndex].ingredients.length > 1) {
      updated[recipeIndex].ingredients = updated[recipeIndex].ingredients.filter((_, i) => i !== ingredientIndex);
      setEntries(updated);
    }
  };

  const addInstruction = (recipeIndex: number) => {
    const updated = [...entries];
    updated[recipeIndex].instructions.push('');
    setEntries(updated);
  };

  const updateInstruction = (recipeIndex: number, instructionIndex: number, value: string) => {
    const updated = [...entries];
    updated[recipeIndex].instructions[instructionIndex] = value;
    setEntries(updated);
  };

  const removeInstruction = (recipeIndex: number, instructionIndex: number) => {
    const updated = [...entries];
    if (updated[recipeIndex].instructions.length > 1) {
      updated[recipeIndex].instructions = updated[recipeIndex].instructions.filter((_, i) => i !== instructionIndex);
      setEntries(updated);
    }
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

      const parsedEntries: BatchRecipeEntry[] = jsonData.map((row) => {
        // Parse ingredients from comma-separated string
        const ingredientsStr = row['מרכיבים'] || row['ingredients'] || '';
        const ingredients: RecipeIngredient[] = ingredientsStr
          .split(',')
          .map(ing => ing.trim())
          .filter(Boolean)
          .map(ing => ({ name: ing, quantity: 1, unit: 'יחידות' }));

        // Parse instructions from numbered string or comma-separated
        const instructionsStr = row['הוראות'] || row['instructions'] || '';
        const instructions = instructionsStr
          .split(/[,\n]/)
          .map(inst => inst.trim().replace(/^\d+\.\s*/, ''))
          .filter(Boolean);

        // Parse tags
        const tagsStr = row['תגיות'] || row['tags'] || '';
        const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

        return {
          name: row['שם'] || row['name'] || '',
          description: row['תיאור'] || row['description'] || '',
          prepTime: String(row['זמן הכנה'] || row['prep_time'] || ''),
          cookTime: String(row['זמן בישול'] || row['cook_time'] || ''),
          servings: String(row['מנות'] || row['servings'] || '4'),
          ingredients: ingredients.length > 0 ? ingredients : [{ name: '', quantity: 1, unit: 'יחידות' }],
          instructions: instructions.length > 0 ? instructions : [''],
          tags,
          isExpanded: false,
        };
      });

      setEntries(parsedEntries.filter(entry => entry.name.trim()));
      toast.success(`${parsedEntries.length} מתכונים נטענו מהקובץ`);
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
        'שם': 'פסטה ברוטב עגבניות',
        'תיאור': 'פסטה קלה וטעימה',
        'זמן הכנה': '10',
        'זמן בישול': '20',
        'מנות': '4',
        'מרכיבים': 'פסטה, רוטב עגבניות, בצל, שום',
        'הוראות': 'בשלו את הפסטה, הכינו את הרוטב, ערבבו יחד',
        'תגיות': 'איטלקי, קל',
      },
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recipes');
    XLSX.writeFile(wb, 'recipes_template.xlsx');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const validEntries = entries.filter(entry => {
      const hasName = entry.name.trim();
      const hasIngredients = entry.ingredients.some(ing => ing.name.trim());
      const hasInstructions = entry.instructions.some(inst => inst.trim());
      return hasName && hasIngredients && hasInstructions;
    });

    if (validEntries.length === 0) {
      toast.error('נא למלא לפחות מתכון אחד עם שם, מרכיבים והוראות');
      return;
    }

    setLoading(true);

    try {
      for (const entry of validEntries) {
        await recipeService.create({
          name: entry.name.trim(),
          description: entry.description.trim() || null,
          prep_time: entry.prepTime ? parseInt(entry.prepTime) : null,
          cook_time: entry.cookTime ? parseInt(entry.cookTime) : null,
          servings: parseInt(entry.servings) || 4,
          ingredients: entry.ingredients.filter(ing => ing.name.trim()),
          instructions: entry.instructions.filter(inst => inst.trim()),
          tags: entry.tags,
          is_public: false,
        });
      }

      onRecipesAdded();
      toast.success(`${validEntries.length} מתכונים נוספו בהצלחה`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('שגיאה בהוספת מתכונים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>הוספת מתכונים בכמות</DialogTitle>
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
                  {entries.map((entry, recipeIndex) => (
                    <Collapsible
                      key={recipeIndex}
                      open={entry.isExpanded}
                      onOpenChange={() => toggleExpanded(recipeIndex)}
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div className="p-4 bg-muted/30 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              {entry.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span className="font-medium">
                                {entry.name || `מתכון ${recipeIndex + 1}`}
                              </span>
                            </div>
                            {entries.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeEntry(recipeIndex);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="p-4 space-y-4 border-t">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="col-span-2 space-y-1">
                                <Label className="text-xs">שם המתכון *</Label>
                                <Input
                                  value={entry.name}
                                  onChange={(e) => updateEntry(recipeIndex, 'name', e.target.value)}
                                  placeholder="שם המתכון"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">זמן הכנה (דק׳)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={entry.prepTime}
                                  onChange={(e) => updateEntry(recipeIndex, 'prepTime', e.target.value)}
                                   dir="rtl"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">זמן בישול (דק׳)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={entry.cookTime}
                                  onChange={(e) => updateEntry(recipeIndex, 'cookTime', e.target.value)}
                                   dir="rtl"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">מנות</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={entry.servings}
                                  onChange={(e) => updateEntry(recipeIndex, 'servings', e.target.value)}
                                   dir="rtl"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">תיאור</Label>
                                <Input
                                  value={entry.description}
                                  onChange={(e) => updateEntry(recipeIndex, 'description', e.target.value)}
                                  placeholder="תיאור קצר"
                                />
                              </div>
                            </div>

                            {/* Ingredients */}
                            <div className="space-y-2">
                              <Label className="text-xs">מרכיבים *</Label>
                              {entry.ingredients.map((ing, ingIndex) => (
                                <div key={ingIndex} className="flex gap-2">
                                  <Input
                                    placeholder="שם מרכיב"
                                    value={ing.name}
                                    onChange={(e) => updateIngredient(recipeIndex, ingIndex, 'name', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={ing.quantity}
                                    onChange={(e) => updateIngredient(recipeIndex, ingIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="w-20"
                                    dir="rtl"
                                  />
                                  <Input
                                    placeholder="יחידה"
                                    value={ing.unit}
                                    onChange={(e) => updateIngredient(recipeIndex, ingIndex, 'unit', e.target.value)}
                                    className="w-24"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeIngredient(recipeIndex, ingIndex)}
                                    disabled={entry.ingredients.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addIngredient(recipeIndex)}
                              >
                                <Plus className="h-4 w-4 me-1" />
                                הוסף מרכיב
                              </Button>
                            </div>

                            {/* Instructions */}
                            <div className="space-y-2">
                              <Label className="text-xs">הוראות הכנה *</Label>
                              {entry.instructions.map((inst, instIndex) => (
                                <div key={instIndex} className="flex gap-2 items-start">
                                  <span className="text-sm text-muted-foreground mt-2 w-6">{instIndex + 1}.</span>
                                  <Textarea
                                    value={inst}
                                    onChange={(e) => updateInstruction(recipeIndex, instIndex, e.target.value)}
                                    placeholder={`שלב ${instIndex + 1}...`}
                                    rows={2}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeInstruction(recipeIndex, instIndex)}
                                    disabled={entry.instructions.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addInstruction(recipeIndex)}
                              >
                                <Plus className="h-4 w-4 me-1" />
                                הוסף שלב
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={addEntry} className="w-full">
                  <Plus className="h-4 w-4 me-2" />
                  הוסף מתכון נוסף
                </Button>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  ביטול
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'מוסיף...' : `הוסף ${entries.filter(e => e.name.trim()).length} מתכונים`}
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
                  הקובץ צריך להכיל עמודות: שם, תיאור, זמן הכנה, זמן בישול, מנות, מרכיבים (מופרדים בפסיקים), הוראות, תגיות
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
                  <h4 className="font-medium">מתכונים שנטענו ({entries.filter(e => e.name.trim()).length})</h4>
                  <ScrollArea className="h-[200px] border rounded-lg p-2">
                    <div className="space-y-1">
                      {entries.filter(e => e.name.trim()).map((entry, index) => (
                        <div key={index} className="text-sm p-2 bg-muted/50 rounded flex justify-between">
                          <span>{entry.name}</span>
                          <span className="text-muted-foreground">
                            {entry.ingredients.filter(i => i.name).length} מרכיבים
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button onClick={() => handleSubmit()} disabled={loading} className="w-full">
                    {loading ? 'מוסיף...' : `הוסף ${entries.filter(e => e.name.trim()).length} מתכונים`}
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
