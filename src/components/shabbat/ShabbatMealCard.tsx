import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UtensilsCrossed, Plus, Trash2, ChefHat, X, Eye, User, ChevronDown, Check, GripVertical } from 'lucide-react';
import { ShabbatPlanSection } from '@/services/shabbatPlanService';
import { Recipe, Product } from '@/types';
import { cn } from '@/lib/utils';

interface ShabbatMealCardProps {
  title: string;
  sections: ShabbatPlanSection[];
  allRecipes: Recipe[];
  products: Product[];
  onAddSection: (name: string, sortOrder: number) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onAddRecipe: (sectionId: string, recipeId: string, sortOrder: number) => Promise<void>;
  onRemoveRecipe: (recipeEntryId: string) => Promise<void>;
  onUpdateRecipe: (recipeEntryId: string, updates: { is_done?: boolean; assigned_to?: string }) => Promise<void>;
  onReorderSections: (sectionIds: string[]) => Promise<void>;
  onReorderRecipes: (sectionId: string, recipeEntryIds: string[]) => Promise<void>;
  onPreview?: () => void;
}

export const ShabbatMealCard = ({
  title,
  sections,
  allRecipes,
  products,
  onAddSection,
  onDeleteSection,
  onAddRecipe,
  onRemoveRecipe,
  onUpdateRecipe,
  onPreview,
}: ShabbatMealCardProps) => {
  const [showAddSection, setShowAddSection] = useState(false);
  const [addingSectionName, setAddingSectionName] = useState('');
  const [addRecipeForSection, setAddRecipeForSection] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeDropdownOpen, setRecipeDropdownOpen] = useState(false);
  const recipeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (addRecipeForSection) {
      setRecipeSearch('');
      setRecipeDropdownOpen(true);
    }
  }, [addRecipeForSection]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (recipeDropdownRef.current && !recipeDropdownRef.current.contains(e.target as Node)) {
        setRecipeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    if (!q) return allRecipes;
    return allRecipes.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [allRecipes, recipeSearch]);

  const selectedRecipe = useMemo(() =>
    allRecipes.find(r => r.id === selectedRecipeId),
  [allRecipes, selectedRecipeId]);

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setRecipeSearch(recipe.name);
    setRecipeDropdownOpen(false);
  };

  const handleAddSection = async () => {
    if (!addingSectionName.trim()) return;
    await onAddSection(addingSectionName.trim(), sections.length);
    setAddingSectionName('');
    setShowAddSection(false);
  };

  const handleAddRecipe = async (sectionId: string) => {
    if (!selectedRecipeId) return;
    const section = sections.find(s => s.id === sectionId);
    await onAddRecipe(sectionId, selectedRecipeId, section?.recipes.length || 0);
    setSelectedRecipeId('');
    setRecipeSearch('');
    setAddRecipeForSection(null);
  };

  const hasRecipes = sections.some(s => s.recipes.length > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <UtensilsCrossed className="h-5 w-5" />
            {title}
          </div>
          {hasRecipes && onPreview && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onPreview}>
              <Eye className="h-3.5 w-3.5 me-1" />
              תצוגה מקדימה
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map(section => (
          <div key={section.id} className="border rounded-lg p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-xs">{section.name}</h4>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setAddRecipeForSection(section.id);
                    setSelectedRecipeId('');
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת חלק</AlertDialogTitle>
                      <AlertDialogDescription>
                        האם למחוק את "{section.name}" וכל המתכונים בו?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteSection(section.id)}>מחק</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {section.recipes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">אין מתכונים</p>
            ) : (
              <div className="space-y-1">
                {section.recipes.map(sr => (
                  <div
                    key={sr.id}
                    className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1.5 text-xs"
                  >
                    <Checkbox
                      checked={sr.is_done}
                      onCheckedChange={(checked) => onUpdateRecipe(sr.id, { is_done: !!checked })}
                      className="h-3.5 w-3.5"
                    />
                    <ChefHat className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className={`flex-1 truncate ${sr.is_done ? 'line-through text-muted-foreground' : ''}`}>
                      {sr.recipe?.name || 'מתכון לא נמצא'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <Input
                        defaultValue={sr.assigned_to}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== sr.assigned_to) onUpdateRecipe(sr.id, { assigned_to: v });
                        }}
                        placeholder="מי?"
                        className="h-6 w-16 text-xs px-1.5"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => onRemoveRecipe(sr.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {addRecipeForSection === section.id && (
              <div className="flex gap-1.5 mt-1" ref={recipeDropdownRef}>
                <div className="relative flex-1">
                  <Input
                    placeholder="חפש מתכון לפי שם או תגית..."
                    value={recipeSearch}
                    onChange={(e) => {
                      setRecipeSearch(e.target.value);
                      setRecipeDropdownOpen(true);
                      if (selectedRecipeId && e.target.value !== (selectedRecipe?.name || '')) {
                        setSelectedRecipeId('');
                      }
                    }}
                    onFocus={() => setRecipeDropdownOpen(true)}
                    className="h-8 text-xs pe-8"
                    autoFocus
                  />
                  <ChevronDown
                    className="absolute end-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                    onClick={() => setRecipeDropdownOpen(!recipeDropdownOpen)}
                  />
                  {recipeDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                      <ScrollArea className="max-h-48">
                        {filteredRecipes.length === 0 ? (
                          <div className="p-3 text-xs text-muted-foreground text-center">
                            לא נמצאו מתכונים
                          </div>
                        ) : (
                          <div className="py-1">
                            {filteredRecipes.map(recipe => (
                              <button
                                key={recipe.id}
                                type="button"
                                className={cn(
                                  'flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors',
                                  selectedRecipeId === recipe.id && 'bg-accent/50'
                                )}
                                onClick={() => handleRecipeSelect(recipe)}
                              >
                                <span className="flex items-center gap-2">
                                  {selectedRecipeId === recipe.id && <Check className="h-3 w-3" />}
                                  <span>{recipe.name}</span>
                                </span>
                                {recipe.tags.length > 0 && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[50%]">
                                    {recipe.tags.join(', ')}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>
                <Button size="sm" className="h-8 text-xs" onClick={() => handleAddRecipe(section.id)} disabled={!selectedRecipeId}>
                  הוסף
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAddRecipeForSection(null); setSelectedRecipeId(''); setRecipeSearch(''); }}>
                  ביטול
                </Button>
              </div>
            )}
          </div>
        ))}

        {showAddSection ? (
          <div className="flex gap-1.5">
            <Input
              placeholder="שם החלק (למשל: סלטים)"
              value={addingSectionName}
              onChange={e => setAddingSectionName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSection();
                if (e.key === 'Escape') { setShowAddSection(false); setAddingSectionName(''); }
              }}
              autoFocus
              className="h-8 text-xs"
            />
            <Button size="sm" className="h-8 text-xs" onClick={handleAddSection} disabled={!addingSectionName.trim()}>
              הוסף
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowAddSection(false); setAddingSectionName(''); }}>
              ביטול
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => setShowAddSection(true)}
          >
            <Plus className="h-3 w-3 me-1" />
            הוסף חלק
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
