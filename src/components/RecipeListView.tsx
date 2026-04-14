import { useState } from 'react';
import { Recipe } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, Tag, X } from 'lucide-react';
import { recipeService } from '@/services/recipeService';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface RecipeListViewProps {
  recipes: Recipe[];
  allTags: string[];
  onView?: (recipe: Recipe) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
  onRecipesUpdated: () => void;
}

export const RecipeListView = ({
  recipes,
  allTags,
  onView,
  onEdit,
  onDelete,
  onRecipesUpdated,
}: RecipeListViewProps) => {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const ownRecipes = recipes.filter(r => r.user_id === user?.id);
  const selectableIds = new Set(ownRecipes.map(r => r.id));

  const toggleSelect = (id: string) => {
    if (!selectableIds.has(id)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === ownRecipes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ownRecipes.map(r => r.id)));
    }
  };

  const selectedRecipes = recipes.filter(r => selectedIds.has(r.id));

  const bulkAddTag = async (tag: string) => {
    try {
      for (const r of selectedRecipes) {
        if (!r.tags.includes(tag)) {
          await recipeService.update(r.id, { tags: [...r.tags, tag] });
        }
      }
      onRecipesUpdated();
      toast.success(`נוסף תג "${tag}" ל-${selectedRecipes.length} מתכונים`);
      setSelectedIds(new Set());
    } catch {
      toast.error('שגיאה בהוספת תג');
    }
  };

  return (
    <div className="space-y-2">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/50 sticky top-0 z-10">
          <span className="text-sm font-medium">
            {selectedIds.size}&nbsp;נבחרו
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4 me-1" />
            ביטול
          </Button>
          <div className="h-4 w-px bg-border" />

          <Select onValueChange={bulkAddTag}>
            <SelectTrigger className="w-auto h-8 text-xs gap-1">
              <Tag className="h-3.5 w-3.5" />
              <span>תג</span>
            </SelectTrigger>
            <SelectContent>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        <Checkbox
          checked={selectedIds.size === ownRecipes.length && ownRecipes.length > 0}
          onCheckedChange={toggleAll}
          className="shrink-0"
        />
        <span className="flex-1 min-w-0">שם</span>
        <span className="w-16 text-center hidden sm:block">זמן</span>
        <span className="w-16 text-center hidden sm:block">מנות</span>
        <span className="w-24 hidden md:block">מרכיבים</span>
        <span className="w-32 hidden lg:block">תגים</span>
      </div>

      {/* Rows */}
      {recipes.map(recipe => {
        const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
        const canSelect = selectableIds.has(recipe.id);

        return (
          <div
            key={recipe.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors hover:bg-muted/30 cursor-pointer ${
              selectedIds.has(recipe.id) ? 'bg-primary/5 border-primary/30' : ''
            }`}
            onClick={() => onView?.(recipe)}
          >
            <Checkbox
              checked={selectedIds.has(recipe.id)}
              onCheckedChange={() => toggleSelect(recipe.id)}
              onClick={(e) => e.stopPropagation()}
              disabled={!canSelect}
              className="shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{recipe.name}</span>
                {recipe.is_public && !canSelect && (
                  <Badge variant="outline" className="text-xs">ציבורי</Badge>
                )}
              </div>
              {recipe.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {recipe.description}
                </p>
              )}
              {/* Mobile details */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden mt-0.5">
                {totalTime > 0 && <span>{totalTime}&nbsp;דק׳</span>}
                <span>{recipe.servings}&nbsp;מנות</span>
              </div>
            </div>

            <span className="w-16 text-center text-sm hidden sm:flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {totalTime > 0 ? `${totalTime}` : '-'}
            </span>

            <span className="w-16 text-center text-sm hidden sm:flex items-center justify-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              {recipe.servings}
            </span>

            <span className="w-24 text-sm hidden md:block text-muted-foreground">
              {recipe.ingredients.length}&nbsp;מרכיבים
            </span>

            <div className="w-32 hidden lg:flex flex-wrap gap-1">
              {recipe.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {recipe.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{recipe.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
