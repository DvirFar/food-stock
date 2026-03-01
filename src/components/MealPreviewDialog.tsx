import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertTriangle, ChefHat } from 'lucide-react';
import { Meal } from '@/services/mealService';
import { Product, RecipeIngredient } from '@/types';
import { checkIngredientAvailability, IngredientAvailability } from '@/lib/unitConversion';

interface MealPreviewDialogProps {
  meal: Meal;
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MealPreviewDialog = ({ meal, products, open, onOpenChange }: MealPreviewDialogProps) => {
  // Aggregate all ingredients across all recipes
  const allIngredients: { sectionName: string; recipeName: string; ingredient: RecipeIngredient }[] = [];

  for (const section of meal.sections) {
    for (const sr of section.recipes) {
      if (!sr.recipe) continue;
      const ingredients = sr.recipe.ingredients as RecipeIngredient[];
      for (const ing of ingredients) {
        allIngredients.push({
          sectionName: section.name,
          recipeName: sr.recipe.name,
          ingredient: ing,
        });
      }
    }
  }

  // Check availability for each ingredient
  const availabilityResults = allIngredients.map(item => ({
    ...item,
    availability: checkIngredientAvailability(
      item.ingredient.name,
      item.ingredient.quantity || item.ingredient.amount,
      item.ingredient.unit,
      products,
    ),
  }));

  const missingItems = availabilityResults.filter(r => !r.availability.isAvailable);
  const availableItems = availabilityResults.filter(r => r.availability.isAvailable);

  // Deduplicate missing items by ingredient name
  const uniqueMissing = new Map<string, typeof missingItems[0]>();
  for (const item of missingItems) {
    const key = item.ingredient.name.toLowerCase();
    if (!uniqueMissing.has(key)) {
      uniqueMissing.set(key, item);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {meal.name} - תצוגה מקדימה
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pe-4">
            {/* Sections overview */}
            {meal.sections.map(section => (
              section.recipes.length > 0 && (
                <div key={section.id}>
                  <h4 className="font-medium text-sm mb-1">{section.name}</h4>
                  <div className="space-y-1">
                    {section.recipes.map(sr => (
                      <div key={sr.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ChefHat className="h-3.5 w-3.5" />
                        <span>{sr.recipe?.name || 'לא נמצא'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}

            <Separator />

            {/* Missing ingredients summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {uniqueMissing.size > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                )}
                <h4 className="font-medium text-sm">
                  {uniqueMissing.size > 0
                    ? `${uniqueMissing.size} מרכיבים חסרים`
                    : 'כל המרכיבים זמינים!'}
                </h4>
              </div>

              {uniqueMissing.size > 0 && (
                <div className="space-y-1.5">
                  {[...uniqueMissing.values()].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        <span>{item.ingredient.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.availability.percentageAvailable > 0
                            ? `${Math.round(item.availability.percentageAvailable)}% זמין`
                            : 'לא במלאי'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available ingredients */}
            {availableItems.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  מרכיבים זמינים ({availableItems.length})
                </h4>
                <div className="space-y-1">
                  {availableItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                      <span>{item.ingredient.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
