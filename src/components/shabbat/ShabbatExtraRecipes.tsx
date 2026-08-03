import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChefHat, Plus, X, CakeSlice, User } from 'lucide-react';
import { Recipe } from '@/types';
import { ShabbatExtraRecipe } from '@/services/shabbatPlanService';

interface ShabbatExtraRecipesProps {
  extraRecipes: ShabbatExtraRecipe[];
  allRecipes: Recipe[];
  onAdd: (recipeId: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: { is_done?: boolean; assigned_to?: string }) => void;
}

export const ShabbatExtraRecipes = ({ extraRecipes, allRecipes, onAdd, onRemove, onUpdate }: ShabbatExtraRecipesProps) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  const getRecipeName = (recipeId: string) => allRecipes.find(r => r.id === recipeId)?.name || 'מתכון לא נמצא';

  const handleAdd = () => {
    if (!selectedRecipeId) return;
    onAdd(selectedRecipeId);
    setSelectedRecipeId('');
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
        <div className="flex items-center gap-2">
          <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="בחר מתכון..." />
            </SelectTrigger>
            <SelectContent>
              {allRecipes.map(recipe => (
                <SelectItem key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAdd} disabled={!selectedRecipeId}>
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
                className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-muted-foreground" />
                  <span>{getRecipeName(er.recipe_id)}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(er.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
