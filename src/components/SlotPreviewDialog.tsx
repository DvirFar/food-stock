import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertTriangle, ChefHat } from 'lucide-react';
import { Product, Recipe, RecipeIngredient } from '@/types';
import { checkIngredientAvailability } from '@/lib/unitConversion';

interface SlotPreviewDialogProps {
  recipes: Recipe[];
  products: Product[];
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SlotPreviewDialog = ({ recipes, products, title, open, onOpenChange }: SlotPreviewDialogProps) => {
  const allIngredients: { recipeName: string; ingredient: RecipeIngredient }[] = [];

  for (const recipe of recipes) {
    const ingredients = recipe.ingredients as RecipeIngredient[];
    for (const ing of ingredients) {
      allIngredients.push({ recipeName: recipe.name, ingredient: ing });
    }
  }

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

  const uniqueMissing = new Map<string, typeof missingItems[0]>();
  for (const item of missingItems) {
    const key = item.ingredient.name.toLowerCase();
    if (!uniqueMissing.has(key)) uniqueMissing.set(key, item);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pe-4">
            {/* Recipes list */}
            <div>
              <h4 className="font-medium text-sm mb-2">מתכונים</h4>
              <div className="space-y-1">
                {recipes.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChefHat className="h-3.5 w-3.5" />
                    <span>{r.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Missing ingredients */}
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
                      <Badge variant="outline" className="text-xs">
                        {item.availability.percentageAvailable > 0
                          ? `${Math.round(item.availability.percentageAvailable)}% זמין`
                          : 'לא במלאי'}
                      </Badge>
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
