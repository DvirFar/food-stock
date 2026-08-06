import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, CalendarDays, StickyNote, Plus, UtensilsCrossed, X, Eye, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { weeklyPlanService, WeeklySlotRecipe, WeeklyPlanDayNote } from '@/services/weeklyPlanService';
import { recipeService } from '@/services/recipeService';
import { productService } from '@/services/productService';
import { Recipe, Product } from '@/types';
import { SlotPreviewDialog } from '@/components/SlotPreviewDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { toast } from 'sonner';


const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const MEAL_TYPES = [
  { key: 'lunch' as const, label: 'צהריים' },
  { key: 'dinner' as const, label: 'ערב' },
];

const WeeklyMealPlan = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => weeklyPlanService.getWeekStart());
  const [planId, setPlanId] = useState<string | null>(null);
  const [slotRecipes, setSlotRecipes] = useState<WeeklySlotRecipe[]>([]);
  const [notes, setNotes] = useState<WeeklyPlanDayNote[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingNotes, setPendingNotes] = useState<Record<string, string>>({});
  const [noteTimers, setNoteTimers] = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  // Adding recipe state
  const [addingFor, setAddingFor] = useState<{ day: number; mealType: 'lunch' | 'dinner' } | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  // Preview state
  const [previewSlot, setPreviewSlot] = useState<{ day: number; mealType: 'lunch' | 'dinner'; title: string } | null>(null);

  const loadWeek = useCallback(async (weekStart: string) => {
    setLoading(true);
    try {
      const [plan, recipesData, productsData] = await Promise.all([
        weeklyPlanService.getOrCreatePlan(weekStart),
        recipeService.getAll(),
        productService.getAll(),
      ]);
      setPlanId(plan.id);
      setAllRecipes(recipesData);
      setProducts(productsData);

      const [slotRecipesData, notesData] = await Promise.all([
        weeklyPlanService.getSlotRecipes(plan.id),
        weeklyPlanService.getNotes(plan.id),
      ]);
      setSlotRecipes(slotRecipesData);
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

  const getSlotRecipesList = (day: number, mealType: 'lunch' | 'dinner') =>
    slotRecipes.filter(sr => sr.day_of_week === day && sr.meal_type === mealType);

  const getSlotRecipesResolved = (day: number, mealType: 'lunch' | 'dinner'): Recipe[] => {
    const entries = getSlotRecipesList(day, mealType);
    return entries
      .map(sr => allRecipes.find(r => r.id === sr.recipe_id))
      .filter(Boolean) as Recipe[];
  };

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

  const handleAddRecipe = async (day: number, mealType: 'lunch' | 'dinner') => {
    if (!selectedRecipeId || !planId) return;
    try {
      const currentCount = getSlotRecipesList(day, mealType).length;
      await weeklyPlanService.addSlotRecipe(planId, day, mealType, selectedRecipeId, currentCount);
      const updated = await weeklyPlanService.getSlotRecipes(planId);
      setSlotRecipes(updated);
      setSelectedRecipeId('');
      setAddingFor(null);
    } catch { toast.error('שגיאה בהוספת מתכון'); }
  };

  const handleRemoveRecipe = async (id: string) => {
    if (!planId) return;
    try {
      await weeklyPlanService.removeSlotRecipe(id);
      const updated = await weeklyPlanService.getSlotRecipes(planId);
      setSlotRecipes(updated);
    } catch { toast.error('שגיאה בהסרת מתכון'); }
  };

  const handleClearSlot = async (day: number, mealType: 'lunch' | 'dinner') => {
    if (!planId) return;
    try {
      await weeklyPlanService.clearSlotRecipes(planId, day, mealType);
      const updated = await weeklyPlanService.getSlotRecipes(planId);
      setSlotRecipes(updated);
    } catch { toast.error('שגיאה בניקוי ארוחה'); }
  };

  const formatWeekRange = () => {
    const start = new Date(currentWeekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 4);
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

      {/* Day grid */}
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
                const recipes = getSlotRecipesList(dayIndex, key);
                const resolvedRecipes = getSlotRecipesResolved(dayIndex, key);
                const hasRecipes = recipes.length > 0;

                return (
                  <div key={key} className="space-y-1.5 border rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs">{label}</span>
                        {hasRecipes && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            {recipes.length}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {hasRecipes && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setPreviewSlot({ day: dayIndex, mealType: key, title: `יום ${dayName} - ${label}` })}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ניקוי ארוחה</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    האם להסיר את כל המתכונים מארוחת {label} ביום {dayName}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleClearSlot(dayIndex, key)}>נקה</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Note */}
                    <Textarea
                      placeholder={`הערות ל${label}...`}
                      value={getNoteContent(dayIndex, key)}
                      onChange={(e) => handleNoteChange(dayIndex, key, e.target.value)}
                      rows={1}
                      className="resize-none text-xs"
                    />

                    {/* Compact recipe list */}
                    {hasRecipes && (
                      <div className="space-y-0.5">
                        {recipes.map(sr => {
                          const recipe = allRecipes.find(r => r.id === sr.recipe_id);
                          return (
                            <div key={sr.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-1.5 py-1">
                              <span className="truncate">{recipe?.name || 'לא נמצא'}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => handleRemoveRecipe(sr.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add recipe */}
                    {addingFor?.day === dayIndex && addingFor?.mealType === key ? (
                      <div className="flex gap-1.5">
                        <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                          <SelectTrigger className="flex-1 h-7 text-xs">
                            <SelectValue placeholder="בחר מתכון..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allRecipes.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleAddRecipe(dayIndex, key)} disabled={!selectedRecipeId}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setAddingFor(null); setSelectedRecipeId(''); }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs border-dashed"
                        onClick={() => { setAddingFor({ day: dayIndex, mealType: key }); setSelectedRecipeId(''); }}
                      >
                        <Plus className="h-3 w-3 me-1" />
                        הוסף מתכון
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview dialog */}
      {previewSlot && (
        <SlotPreviewDialog
          recipes={getSlotRecipesResolved(previewSlot.day, previewSlot.mealType)}
          products={products}
          title={previewSlot.title}
          open={!!previewSlot}
          onOpenChange={(open) => { if (!open) setPreviewSlot(null); }}
        />
      )}
    </div>
  );
};

export default WeeklyMealPlan;
