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
import { RecipeViewDialog } from '@/components/RecipeViewDialog';

interface ShabbatMealCardProps {
  title: string;
  sections: ShabbatPlanSection[];
  allRecipes: Recipe[];
  products: Product[];
  onAddSection: (name: string, sortOrder: number) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onAddRecipe: (sectionId: string, recipeId: string | null, sortOrder: number, customName?: string) => Promise<void>;
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
  onReorderSections,
  onReorderRecipes,
  onPreview,
}: ShabbatMealCardProps) => {
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [addingSectionName, setAddingSectionName] = useState('');
  const [addRecipeForSection, setAddRecipeForSection] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeDropdownOpen, setRecipeDropdownOpen] = useState(false);
  const recipeDropdownRef = useRef<HTMLDivElement>(null);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [overSectionId, setOverSectionId] = useState<string | null>(null);
  const [dragRecipe, setDragRecipe] = useState<{ sectionId: string; id: string } | null>(null);
  const [overRecipeId, setOverRecipeId] = useState<string | null>(null);

  const moveItem = <T,>(arr: T[], from: number, to: number) => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const handleSectionDrop = (targetId: string) => {
    const fromIdx = sections.findIndex(s => s.id === dragSectionId);
    const toIdx = sections.findIndex(s => s.id === targetId);
    setDragSectionId(null);
    setOverSectionId(null);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    onReorderSections(moveItem(sections, fromIdx, toIdx).map(s => s.id));
  };

  const handleRecipeDrop = (sectionId: string, targetId: string) => {
    const section = sections.find(s => s.id === sectionId);
    setOverRecipeId(null);
    if (!section || !dragRecipe || dragRecipe.sectionId !== sectionId) { setDragRecipe(null); return; }
    const fromIdx = section.recipes.findIndex(r => r.id === dragRecipe.id);
    const toIdx = section.recipes.findIndex(r => r.id === targetId);
    setDragRecipe(null);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    onReorderRecipes(sectionId, moveItem(section.recipes, fromIdx, toIdx).map(r => r.id));
  };


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
    const freeText = recipeSearch.trim();
    if (!selectedRecipeId && !freeText) return;
    const section = sections.find(s => s.id === sectionId);
    await onAddRecipe(
      sectionId,
      selectedRecipeId || null,
      section?.recipes.length || 0,
      selectedRecipeId ? undefined : freeText,
    );
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
          <div
            key={section.id}
            className={cn(
              'border rounded-lg p-2 space-y-1.5 transition-colors',
              dragSectionId === section.id && 'opacity-50',
              overSectionId === section.id && dragSectionId !== section.id && 'border-primary bg-accent/40'
            )}
            onDragOver={(e) => { if (dragSectionId) { e.preventDefault(); setOverSectionId(section.id); } }}
            onDragLeave={() => setOverSectionId(prev => (prev === section.id ? null : prev))}
            onDrop={(e) => { if (dragSectionId) { e.preventDefault(); handleSectionDrop(section.id); } }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span
                  draggable
                  onDragStart={() => setDragSectionId(section.id)}
                  onDragEnd={() => { setDragSectionId(null); setOverSectionId(null); }}
                  className="cursor-grab active:cursor-grabbing text-muted-foreground"
                  title="גרור לשינוי סדר"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <h4 className="font-medium text-xs">{section.name}</h4>
              </div>
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
                    className={cn(
                      'flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1.5 text-xs transition-colors',
                      dragRecipe?.id === sr.id && 'opacity-50',
                      overRecipeId === sr.id && dragRecipe?.id !== sr.id && 'ring-1 ring-primary'
                    )}
                    onDragOver={(e) => { if (dragRecipe) { e.preventDefault(); e.stopPropagation(); setOverRecipeId(sr.id); } }}
                    onDragLeave={() => setOverRecipeId(prev => (prev === sr.id ? null : prev))}
                    onDrop={(e) => { if (dragRecipe) { e.preventDefault(); e.stopPropagation(); handleRecipeDrop(section.id, sr.id); } }}
                  >
                    <span
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); setDragRecipe({ sectionId: section.id, id: sr.id }); }}
                      onDragEnd={() => { setDragRecipe(null); setOverRecipeId(null); }}
                      className="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0"
                      title="גרור לשינוי סדר"
                    >
                      <GripVertical className="h-3 w-3" />
                    </span>
                    <Checkbox
                      checked={sr.is_done}
                      onCheckedChange={(checked) => onUpdateRecipe(sr.id, { is_done: !!checked })}
                      className="h-3.5 w-3.5"
                    />
                    <ChefHat className="h-3 w-3 text-muted-foreground shrink-0" />
                    {sr.recipe ? (
                      <button
                        type="button"
                        onClick={() => setViewRecipe(sr.recipe as Recipe)}
                        className={cn(
                          'flex-1 truncate text-right hover:underline',
                          sr.is_done && 'line-through text-muted-foreground'
                        )}
                      >
                        {sr.recipe.name}
                      </button>
                    ) : (
                      <span className={`flex-1 truncate ${sr.is_done ? 'line-through text-muted-foreground' : ''}`}>
                        {sr.custom_name || 'מתכון לא נמצא'}
                      </span>
                    )}
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
                    placeholder="חפש מתכון או כתוב טקסט חופשי..."
                    value={recipeSearch}
                    onChange={(e) => {
                      setRecipeSearch(e.target.value);
                      setRecipeDropdownOpen(true);
                      if (selectedRecipeId && e.target.value !== (selectedRecipe?.name || '')) {
                        setSelectedRecipeId('');
                      }
                    }}
                    onFocus={() => setRecipeDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddRecipe(section.id); }
                      if (e.key === 'Escape') { setAddRecipeForSection(null); setSelectedRecipeId(''); setRecipeSearch(''); }
                    }}
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
                            {recipeSearch.trim()
                              ? `לא נמצאו מתכונים — יתווסף כטקסט חופשי: "${recipeSearch.trim()}"`
                              : 'לא נמצאו מתכונים'}
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
                <Button size="sm" className="h-8 text-xs" onClick={() => handleAddRecipe(section.id)} disabled={!selectedRecipeId && !recipeSearch.trim()}>
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
      <RecipeViewDialog recipe={viewRecipe} open={!!viewRecipe} onOpenChange={(o) => !o && setViewRecipe(null)} />
    </Card>
  );
};
