import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UtensilsCrossed, Plus, Trash2 } from 'lucide-react';
import { Meal } from '@/services/mealService';
import { Recipe } from '@/types';
import { InlineMealEditor } from '@/components/InlineMealEditor';

interface ShabbatMealCardProps {
  title: string;
  meal: Meal | null;
  allMeals: Meal[];
  allRecipes: Recipe[];
  onMealChange: (mealId: string | null) => void;
  onCreateMeal: (name: string) => Promise<Meal>;
  onDeleteMeal: (mealId: string) => Promise<void>;
  onAddSection: (mealId: string, name: string, sortOrder: number) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onAddRecipe: (sectionId: string, recipeId: string, sortOrder: number) => Promise<void>;
  onRemoveRecipe: (recipeEntryId: string) => Promise<void>;
  onPreview?: (meal: Meal) => void;
}

export const ShabbatMealCard = ({
  title,
  meal,
  allMeals,
  allRecipes,
  onMealChange,
  onCreateMeal,
  onDeleteMeal,
  onAddSection,
  onDeleteSection,
  onAddRecipe,
  onRemoveRecipe,
  onPreview,
}: ShabbatMealCardProps) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedExistingMealId, setSelectedExistingMealId] = useState('');

  const handleCreate = async () => {
    if (!newMealName.trim()) return;
    const created = await onCreateMeal(newMealName.trim());
    onMealChange(created.id);
    setNewMealName('');
    setShowCreate(false);
  };

  const handlePickExisting = () => {
    if (!selectedExistingMealId) return;
    onMealChange(selectedExistingMealId);
    setSelectedExistingMealId('');
    setShowPicker(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <UtensilsCrossed className="h-5 w-5" />
            {title}
          </div>
          {meal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>מחיקת ארוחה</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם למחוק את "{meal.name}"? פעולה זו לא ניתנת לביטול.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteMeal(meal.id)}>מחק</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {meal ? (
          <div>
            <p className="font-medium text-sm mb-2">{meal.name}</p>
            <InlineMealEditor
              meal={meal}
              allRecipes={allRecipes}
              onAddSection={onAddSection}
              onDeleteSection={onDeleteSection}
              onAddRecipe={onAddRecipe}
              onRemoveRecipe={onRemoveRecipe}
              onPreview={onPreview}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => { setShowCreate(true); setNewMealName(''); }}
            >
              <Plus className="h-4 w-4 me-1" />
              צור ארוחה חדשה
            </Button>
            {allMeals.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => { setShowPicker(true); setSelectedExistingMealId(''); }}
              >
                בחר ארוחה קיימת
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>יצירת ארוחה חדשה</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="שם הארוחה"
            value={newMealName}
            onChange={e => setNewMealName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!newMealName.trim()}>צור ארוחה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pick Existing Dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>בחירת ארוחה קיימת</DialogTitle>
          </DialogHeader>
          <Select value={selectedExistingMealId} onValueChange={setSelectedExistingMealId}>
            <SelectTrigger>
              <SelectValue placeholder="בחר ארוחה..." />
            </SelectTrigger>
            <SelectContent>
              {allMeals.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={handlePickExisting} disabled={!selectedExistingMealId}>בחר</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
