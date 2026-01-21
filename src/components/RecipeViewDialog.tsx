import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  Users,
  ChefHat,
  Timer,
  Flame,
  ListChecks
} from 'lucide-react';
import { Recipe } from '@/types';
import { useState } from 'react';

interface RecipeViewDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecipeViewDialog = ({ recipe, open, onOpenChange }: RecipeViewDialogProps) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  if (!recipe) return null;

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleStep = (index: number) => {
    setCheckedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Reset checked items when dialog opens with new recipe
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCheckedIngredients(new Set());
      setCheckedSteps(new Set());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">{recipe.name}</DialogTitle>
              {recipe.description && (
                <p className="text-muted-foreground mt-1">{recipe.description}</p>
              )}
            </div>
          </div>

          {/* Time and Servings Info */}
          <div className="flex flex-wrap gap-4 mt-4">
            {recipe.prep_time && recipe.prep_time > 0 && (
              <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span>הכנה: {recipe.prep_time} דק׳</span>
              </div>
            )}
            {recipe.cook_time && recipe.cook_time > 0 && (
              <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <span>בישול: {recipe.cook_time} דק׳</span>
              </div>
            )}
            {totalTime > 0 && (
              <div className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-1.5 rounded-full font-medium">
                <Clock className="h-4 w-4 text-primary" />
                <span>סה״כ: {totalTime} דק׳</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{recipe.servings} מנות</span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {recipe.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 max-h-[calc(90vh-280px)]">
          <div className="p-6 space-y-6">
            {/* Ingredients Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">מרכיבים</h3>
                <span className="text-sm text-muted-foreground">
                  ({checkedIngredients.size}/{recipe.ingredients.length})
                </span>
              </div>
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      checkedIngredients.has(index) ? 'bg-muted/50 border-primary/30' : 'bg-background'
                    }`}
                    onClick={() => toggleIngredient(index)}
                  >
                    <Checkbox
                      checked={checkedIngredients.has(index)}
                      onCheckedChange={() => toggleIngredient(index)}
                      className="pointer-events-none"
                    />
                    <span className={`flex-1 ${checkedIngredients.has(index) ? 'line-through text-muted-foreground' : ''}`}>
                      <span className="font-medium">{ingredient.name}</span>
                      {ingredient.optional && (
                        <span className="text-muted-foreground text-sm me-1">(אופציונלי)</span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground" dir="ltr">
                      {ingredient.amount || ingredient.quantity} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Instructions Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">שלבי הכנה</h3>
                <span className="text-sm text-muted-foreground">
                  ({checkedSteps.size}/{recipe.instructions.length})
                </span>
              </div>
              <div className="space-y-3">
                {recipe.instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      checkedSteps.has(index) ? 'bg-muted/50 border-primary/30' : 'bg-background'
                    }`}
                    onClick={() => toggleStep(index)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={checkedSteps.has(index)}
                        onCheckedChange={() => toggleStep(index)}
                        className="mt-0.5 pointer-events-none"
                      />
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          checkedSteps.has(index)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <p className={`flex-1 leading-relaxed ${checkedSteps.has(index) ? 'text-muted-foreground' : ''}`}>
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
