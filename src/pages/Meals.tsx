import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Trash2, UtensilsCrossed, ChefHat, Eye, GripVertical, Pencil, X
} from 'lucide-react';
import { mealService, Meal, MealSection } from '@/services/mealService';
import { recipeService } from '@/services/recipeService';
import { productService } from '@/services/productService';
import { Recipe, Product } from '@/types';
import { MealPreviewDialog } from '@/components/MealPreviewDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { toast } from 'sonner';


const Meals = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMealName, setNewMealName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [previewMeal, setPreviewMeal] = useState<Meal | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Section editing
  const [addSectionMealId, setAddSectionMealId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');

  // Recipe adding
  const [addRecipeState, setAddRecipeState] = useState<{ sectionId: string; mealId: string } | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mealsData, recipesData, productsData] = await Promise.all([
        mealService.getAll(),
        recipeService.getAll(),
        productService.getAll(),
      ]);
      setMeals(mealsData);
      setAllRecipes(recipesData);
      setProducts(productsData);
    } catch (e) {
      console.error('Failed to load meals data:', e);
      toast.error('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeal = async () => {
    if (!newMealName.trim()) return;
    try {
      await mealService.create(newMealName.trim());
      setNewMealName('');
      setCreateOpen(false);
      await loadData();
      toast.success('ארוחה נוצרה בהצלחה');
    } catch (e) {
      toast.error('שגיאה ביצירת ארוחה');
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await mealService.deleteMeal(id);
      setMeals(prev => prev.filter(m => m.id !== id));
      toast.success('ארוחה נמחקה');
    } catch (e) {
      toast.error('שגיאה במחיקת ארוחה');
    }
  };

  const handleAddSection = async (mealId: string) => {
    if (!newSectionName.trim()) return;
    try {
      const meal = meals.find(m => m.id === mealId);
      const sortOrder = meal ? meal.sections.length : 0;
      await mealService.addSection(mealId, newSectionName.trim(), sortOrder);
      setNewSectionName('');
      setAddSectionMealId(null);
      await loadData();
    } catch (e) {
      toast.error('שגיאה בהוספת חלק');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await mealService.deleteSection(sectionId);
      await loadData();
    } catch (e) {
      toast.error('שגיאה במחיקת חלק');
    }
  };

  const handleAddRecipe = async () => {
    if (!addRecipeState || !selectedRecipeId) return;
    try {
      const meal = meals.find(m => m.id === addRecipeState.mealId);
      const section = meal?.sections.find(s => s.id === addRecipeState.sectionId);
      const sortOrder = section ? section.recipes.length : 0;
      await mealService.addRecipeToSection(addRecipeState.sectionId, selectedRecipeId, sortOrder);
      setAddRecipeState(null);
      setSelectedRecipeId('');
      await loadData();
    } catch (e) {
      toast.error('שגיאה בהוספת מתכון');
    }
  };

  const handleRemoveRecipe = async (recipeEntryId: string) => {
    try {
      await mealService.removeRecipeFromSection(recipeEntryId);
      await loadData();
    } catch (e) {
      toast.error('שגיאה בהסרת מתכון');
    }
  };

  const { requestConfirm, confirm, cancel, isOpen } = useConfirmDelete<string>(handleRemoveRecipe);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">תכנון ארוחות</h1>
          <p className="text-muted-foreground">תכנן ארוחות שלמות ובדוק זמינות מרכיבים</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              ארוחה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>יצירת ארוחה חדשה</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="שם הארוחה (למשל: ארוחת שישי)"
              value={newMealName}
              onChange={e => setNewMealName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateMeal()}
            />
            <DialogFooter>
              <Button onClick={handleCreateMeal} disabled={!newMealName.trim()}>
                צור ארוחה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {meals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">עדיין לא תכננת ארוחות</p>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 me-2" />
              צור ארוחה ראשונה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {meals.map(meal => (
            <Card key={meal.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    {meal.name}
                  </CardTitle>
                  {meal.description && (
                    <CardDescription>{meal.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMeal(meal)}
                  >
                    <Eye className="h-4 w-4 me-1" />
                    תצוגה מקדימה
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
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
                        <AlertDialogAction onClick={() => handleDeleteMeal(meal.id)}>
                          מחק
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {meal.sections.map(section => (
                  <div key={section.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{section.name}</h4>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setAddRecipeState({ sectionId: section.id, mealId: meal.id })}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
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
                              <AlertDialogAction onClick={() => handleDeleteSection(section.id)}>
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {section.recipes.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        אין מתכונים בחלק זה
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {section.recipes.map(sr => (
                          <div
                            key={sr.id}
                            className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4 text-muted-foreground" />
                              <span>{sr.recipe?.name || 'מתכון לא נמצא'}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => requestConfirm(sr.id)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add section button */}
                {addSectionMealId === meal.id ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="שם החלק (למשל: סלטים)"
                      value={newSectionName}
                      onChange={e => setNewSectionName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddSection(meal.id);
                        if (e.key === 'Escape') { setAddSectionMealId(null); setNewSectionName(''); }
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleAddSection(meal.id)} disabled={!newSectionName.trim()}>
                      הוסף
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddSectionMealId(null); setNewSectionName(''); }}>
                      ביטול
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setAddSectionMealId(meal.id)}
                  >
                    <Plus className="h-4 w-4 me-2" />
                    הוסף חלק
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Recipe Dialog */}
      <Dialog open={!!addRecipeState} onOpenChange={(open) => { if (!open) { setAddRecipeState(null); setSelectedRecipeId(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת מתכון</DialogTitle>
          </DialogHeader>
          <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
            <SelectTrigger>
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
          <DialogFooter>
            <Button onClick={handleAddRecipe} disabled={!selectedRecipeId}>
              הוסף מתכון
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meal Preview Dialog */}
      {previewMeal && (
        <MealPreviewDialog
          meal={previewMeal}
          products={products}
          open={!!previewMeal}
          onOpenChange={(open) => { if (!open) setPreviewMeal(null); }}
        />
      )}
    </div>
  );
};

export default Meals;
