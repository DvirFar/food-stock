import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, ChefHat, X, Eye } from 'lucide-react';
import { Meal } from '@/services/mealService';

interface ShabbatMealCardProps {
  title: string;
  selectedMealId: string | null;
  meals: Meal[];
  onMealChange: (mealId: string | null) => void;
  onPreview?: (meal: Meal) => void;
}

export const ShabbatMealCard = ({ title, selectedMealId, meals, onMealChange, onPreview }: ShabbatMealCardProps) => {
  const selectedMeal = meals.find(m => m.id === selectedMealId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UtensilsCrossed className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Select
            value={selectedMealId || ''}
            onValueChange={(val) => onMealChange(val || null)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="בחר ארוחה..." />
            </SelectTrigger>
            <SelectContent>
              {meals.map(meal => (
                <SelectItem key={meal.id} value={meal.id}>
                  {meal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMealId && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onMealChange(null)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {selectedMeal && (
          <div className="space-y-2">
            {selectedMeal.sections.map(section => (
              section.recipes.length > 0 && (
                <div key={section.id} className="border rounded-lg p-2 space-y-1">
                  <h4 className="font-medium text-xs text-muted-foreground">{section.name}</h4>
                  {section.recipes.map(sr => (
                    <div key={sr.id} className="flex items-center gap-2 text-sm">
                      <ChefHat className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{sr.recipe?.name || 'מתכון לא נמצא'}</span>
                    </div>
                  ))}
                </div>
              )
            ))}
            {onPreview && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => onPreview(selectedMeal)}>
                <Eye className="h-4 w-4 me-1" />
                תצוגה מקדימה
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
