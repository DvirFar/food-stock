import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChefHat, Plus, X, CakeSlice, User, ChevronDown, Check } from 'lucide-react';
import { Recipe } from '@/types';
import { ShabbatExtraRecipe } from '@/services/shabbatPlanService';
import { cn } from '@/lib/utils';
import { RecipeViewDialog } from '@/components/RecipeViewDialog';

interface ShabbatExtraRecipesProps {
  extraRecipes: ShabbatExtraRecipe[];
  allRecipes: Recipe[];
  onAdd: (recipeId: string | null, customName?: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: { is_done?: boolean; assigned_to?: string }) => void;
}

export const ShabbatExtraRecipes = ({ extraRecipes, allRecipes, onAdd, onRemove, onUpdate }: ShabbatExtraRecipesProps) => {
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRecipes;
    return allRecipes.filter(r =>
      r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [allRecipes, search]);

  const getName = (er: ShabbatExtraRecipe) =>
    (er.recipe_id ? allRecipes.find(r => r.id === er.recipe_id)?.name : er.custom_name) ||
    er.custom_name ||
    'מתכון לא נמצא';

  const handleAdd = () => {
    const freeText = search.trim();
    if (!selectedRecipeId && !freeText) return;
    onAdd(selectedRecipeId || null, selectedRecipeId ? undefined : freeText);
    setSelectedRecipeId('');
    setSearch('');
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CakeSlice className="h-5 w-5" />
          הכנות נוספות
        </CardTitle>
        <p className="text-xs text-muted-foreground">עוגות, סלטים, והכנות שאינן חלק מהארוחות</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2" ref={dropdownRef}>
          <div className="relative flex-1">
            <Input
              placeholder="חפש מתכון או כתוב טקסט חופשי..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
                if (selectedRecipeId) setSelectedRecipeId('');
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
                if (e.key === 'Escape') setOpen(false);
              }}
              className="pe-8"
            />
            <ChevronDown
              className="absolute end-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
              onClick={() => setOpen(!open)}
            />
            {open && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                <ScrollArea className="max-h-48">
                  {filteredRecipes.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      {search.trim()
                        ? `לא נמצאו מתכונים — יתווסף כטקסט חופשי: "${search.trim()}"`
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
                          onClick={() => {
                            setSelectedRecipeId(recipe.id);
                            setSearch(recipe.name);
                            setOpen(false);
                          }}
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
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAdd} disabled={!selectedRecipeId && !search.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {extraRecipes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            לא נבחרו הכנות נוספות
          </p>
        ) : (
          <div className="space-y-1.5">
            {extraRecipes.map(er => (
              <div
                key={er.id}
                className="flex items-center gap-1.5 bg-muted/50 rounded-md px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={er.is_done}
                  onCheckedChange={(checked) => onUpdate(er.id, { is_done: !!checked })}
                  className="h-3.5 w-3.5"
                />
                <ChefHat className="h-4 w-4 text-muted-foreground shrink-0" />
                {er.recipe_id && allRecipes.find(r => r.id === er.recipe_id) ? (
                  <button
                    type="button"
                    onClick={() => setViewRecipe(allRecipes.find(r => r.id === er.recipe_id) || null)}
                    className={cn(
                      'flex-1 truncate text-right hover:underline',
                      er.is_done && 'line-through text-muted-foreground'
                    )}
                  >
                    {getName(er)}
                  </button>
                ) : (
                  <span className={`flex-1 truncate ${er.is_done ? 'line-through text-muted-foreground' : ''}`}>
                    {getName(er)}
                  </span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <Input
                    defaultValue={er.assigned_to}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== er.assigned_to) onUpdate(er.id, { assigned_to: v });
                    }}
                    placeholder="מי?"
                    className="h-6 w-16 text-xs px-1.5"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(er.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <RecipeViewDialog recipe={viewRecipe} open={!!viewRecipe} onOpenChange={(o) => !o && setViewRecipe(null)} />
    </Card>
  );
};
