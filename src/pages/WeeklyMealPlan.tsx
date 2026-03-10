import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, CalendarDays, StickyNote, Plus, UtensilsCrossed, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { weeklyPlanService, WeeklyPlanSlot, WeeklyPlanDayNote } from '@/services/weeklyPlanService';
import { mealService, Meal } from '@/services/mealService';
import { recipeService } from '@/services/recipeService';
import { productService } from '@/services/productService';
import { Recipe, Product } from '@/types';
import { InlineMealEditor } from '@/components/InlineMealEditor';
import { MealPreviewDialog } from '@/components/MealPreviewDialog';
import { toast } from 'sonner';

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']; // Sun-Thu only
const MEAL_TYPES = [
  { key: 'lunch' as const, label: 'צהריים' },
  { key: 'dinner' as const, label: 'ערב' },
];

const WeeklyMealPlan = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => weeklyPlanService.getWeekStart());
  const [planId, setPlanId] = useState<string | null>(null);
  const [slots, setSlots] = useState<WeeklyPlanSlot[]>([]);
  const [notes, setNotes] = useState<WeeklyPlanDayNote[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingNotes, setPendingNotes] = useState<Record<string, string>>({});
  const [noteTimers, setNoteTimers] = useState<Record<string, ReturnType<typeof setTimeout>>>({});
  const [previewMeal, setPreviewMeal] = useState<Meal | null>(null);

  // Create meal dialog
  const [createMealFor, setCreateMealFor] = useState<{ day: number; mealType: 'lunch' | 'dinner' } | null>(null);
  const [newMealName, setNewMealName] = useState('');

  const loadWeek = useCallback(async (weekStart: string) => {
    setLoading(true);
    try {
      const [plan, mealsData, recipesData, productsData] = await Promise.all([
        weeklyPlanService.getOrCreatePlan(weekStart),
        mealService.getAll(),
        recipeService.getAll(),
        productService.getAll(),
      ]);
      setPlanId(plan.id);
      setMeals(mealsData);
      setAllRecipes(recipesData);
      setProducts(productsData);

      const [slotsData, notesData] = await Promise.all([
        weeklyPlanService.getSlots(plan.id),
        weeklyPlanService.getNotes(plan.id),
      ]);
      setSlots(slotsData);
      setNotes(notesData);
      setPendingNotes({});
    } catch (e) {
      console.error('Failed to load weekly plan:', e);
      toast.error('שגיאה בטעינת תכנון שבועי');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWeek(currentWeekStart); }, [currentWeekStart, loadWeek]);
  useEffect(() => { return () => { Object.values(noteTimers).forEach(clearTimeout); }; }, [noteTimers]);

  const navigateWeek = (direction: number) => {
    const d = new Date(currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + direction * 7);
    setCurrentWeekStart(weeklyPlanService.getWeekStart(d));
  };

  const getSlot = (day: number, mealType: 'lunch' | 'dinner') =>
    slots.find(s => s.day_of_week === day && s.meal_type === mealType);

  const getNoteContent = (day: number, noteType: 'lunch' | 'dinner' | 'general') => {
    const key = `${day}-${noteType}`;
    if (key in pendingNotes) return pendingNotes[key];
    return notes.find(n => n.day_of_week === day && n.note_type === noteType)?.content || '';
  };

  const handleNoteChange = (day: number, noteType: 'lunch' | 'dinner' | 'general', value: string) => {
    const key = `${day}-${noteType}`;
    setPendingNotes(prev => ({ ...prev, [key]: value }));
    if (noteTimers[key]) clearTimeout(noteTimers[key]);
    const timer = setTimeout(async () => {
      if (!planId) return;
      try { await weeklyPlanService.upsertNote(planId, day, noteType, value); } catch { toast.error('שגיאה בשמירת הערה'); }
    }, 800);
    setNoteTimers(prev => ({ ...prev, [key]: timer }));
  };

  const handleCreateMeal = async () => {
    if (!newMealName.trim() || !createMealFor || !planId) return;
    try {
      const meal = await mealService.create(newMealName.trim());
      // Assign to slot
      await weeklyPlanService.upsertSlot(planId, createMealFor.day, createMealFor.mealType, meal.id);
      setNewMealName('');
      setCreateMealFor(null);
      await loadWeek(currentWeekStart);
      toast.success('ארוחה נוצרה בהצלחה');
    } catch { toast.error('שגיאה ביצירת ארוחה'); }
  };

  const handleRemoveMealFromSlot = async (day: number, mealType: 'lunch' | 'dinner') => {
    if (!planId) return;
    try {
      await weeklyPlanService.upsertSlot(planId, day, mealType, null);
      const updated = await weeklyPlanService.getSlots(planId);
      setSlots(updated);
    } catch { toast.error('שגיאה בהסרת ארוחה'); }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await mealService.deleteMeal(mealId);
      await loadWeek(currentWeekStart);
      toast.success('ארוחה נמחקה');
    } catch { toast.error('שגיאה במחיקת ארוחה'); }
  };

  // Meal editing handlers
  const handleAddSection = async (mealId: string, name: string, sortOrder: number) => {
    await mealService.addSection(mealId, name, sortOrder);
    await loadWeek(currentWeekStart);
  };
  const handleDeleteSection = async (sectionId: string) => {
    await mealService.deleteSection(sectionId);
    await loadWeek(currentWeekStart);
  };
  const handleAddRecipe = async (sectionId: string, recipeId: string, sortOrder: number) => {
    await mealService.addRecipeToSection(sectionId, recipeId, sortOrder);
    await loadWeek(currentWeekStart);
  };
  const handleRemoveRecipe = async (recipeEntryId: string) => {
    await mealService.removeRecipeFromSection(recipeEntryId);
    await loadWeek(currentWeekStart);
  };

  const formatWeekRange = () => {
    const start = new Date(currentWeekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 4); // Thu
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const getDayDate = (dayIndex: number) => {
    const d = new Date(currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + dayIndex);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">תכנון שבועי</h1>
        <p className="text-muted-foreground">תכנן את הארוחות שלך לימים ראשון עד חמישי</p>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-lg">{formatWeekRange()}</span>
        </div>
        <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(weeklyPlanService.getWeekStart())}>
          היום
        </Button>
      </div>

      {/* Horizontal day grid - Sun to Thu */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {DAYS_HE.map((dayName, dayIndex) => (
          <Card key={dayIndex} className="min-w-0">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Badge variant="outline" className="font-normal text-xs">
                  {getDayDate(dayIndex)}
                </Badge>
                יום {dayName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3">
              {/* General note */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <StickyNote className="h-3 w-3" />
                  <span>הערות</span>
                </div>
                <Textarea
                  placeholder="הערות ליום..."
                  value={getNoteContent(dayIndex, 'general')}
                  onChange={(e) => handleNoteChange(dayIndex, 'general', e.target.value)}
                  rows={2}
                  className="resize-none text-xs"
                />
              </div>

              {/* Meal slots */}
              {MEAL_TYPES.map(({ key, label }) => {
                const slot = getSlot(dayIndex, key);
                const mealId = slot?.meal_id || null;
                const meal = mealId ? meals.find(m => m.id === mealId) : null;

                return (
                  <div key={key} className="space-y-1.5 border rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs">{label}</span>
                      </div>
                      {meal && (
                        <div className="flex items-center gap-0.5">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive">
                                <Trash2 className="h-3 w-3" />
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
                                <AlertDialogAction onClick={() => handleDeleteMeal(meal.id)}>מחק</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>

                    {/* Note for this meal type */}
                    <Textarea
                      placeholder={`הערות ל${label}...`}
                      value={getNoteContent(dayIndex, key)}
                      onChange={(e) => handleNoteChange(dayIndex, key, e.target.value)}
                      rows={1}
                      className="resize-none text-xs"
                    />

                    {meal ? (
                      <div>
                        <p className="text-xs font-medium mb-1">{meal.name}</p>
                        <InlineMealEditor
                          meal={meal}
                          allRecipes={allRecipes}
                          onAddSection={handleAddSection}
                          onDeleteSection={handleDeleteSection}
                          onAddRecipe={handleAddRecipe}
                          onRemoveRecipe={handleRemoveRecipe}
                          onPreview={setPreviewMeal}
                          compact
                        />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs border-dashed"
                        onClick={() => { setCreateMealFor({ day: dayIndex, mealType: key }); setNewMealName(''); }}
                      >
                        <Plus className="h-3 w-3 me-1" />
                        צור ארוחה
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Meal Dialog */}
      <Dialog open={!!createMealFor} onOpenChange={(open) => { if (!open) setCreateMealFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>יצירת ארוחה חדשה</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="שם הארוחה"
            value={newMealName}
            onChange={e => setNewMealName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateMeal()}
          />
          <DialogFooter>
            <Button onClick={handleCreateMeal} disabled={!newMealName.trim()}>צור ארוחה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meal Preview */}
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

export default WeeklyMealPlan;
