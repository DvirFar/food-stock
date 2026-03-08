import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react';
import { shabbatPlanService, ShabbatExtraRecipe, ShabbatDishAssignment } from '@/services/shabbatPlanService';
import { mealService, Meal } from '@/services/mealService';
import { recipeService } from '@/services/recipeService';
import { productService } from '@/services/productService';
import { Recipe, Product } from '@/types';
import { ShabbatMealCard } from '@/components/shabbat/ShabbatMealCard';
import { ShabbatExtraRecipes } from '@/components/shabbat/ShabbatExtraRecipes';
import { DishWashingTable } from '@/components/shabbat/DishWashingTable';
import { MealPreviewDialog } from '@/components/MealPreviewDialog';
import { toast } from 'sonner';

const ShabbatPlan = () => {
  const [currentFriday, setCurrentFriday] = useState(() => shabbatPlanService.getWeekFriday());
  const [planId, setPlanId] = useState<string | null>(null);
  const [fridayMealId, setFridayMealId] = useState<string | null>(null);
  const [saturdayMealId, setSaturdayMealId] = useState<string | null>(null);
  const [extraRecipes, setExtraRecipes] = useState<ShabbatExtraRecipe[]>([]);
  const [dishAssignments, setDishAssignments] = useState<Record<string, string>>({});
  const [meals, setMeals] = useState<Meal[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMeal, setPreviewMeal] = useState<Meal | null>(null);
  const [dishTimers, setDishTimers] = useState<Record<string, NodeJS.Timeout>>({});

  const loadData = useCallback(async (friday: string) => {
    setLoading(true);
    try {
      const [plan, mealsData, recipesData, productsData] = await Promise.all([
        shabbatPlanService.getOrCreatePlan(friday),
        mealService.getAll(),
        recipeService.getAll(),
        productService.getAll(),
      ]);
      setPlanId(plan.id);
      setFridayMealId(plan.friday_meal_id);
      setSaturdayMealId(plan.saturday_meal_id);
      setMeals(mealsData);
      setAllRecipes(recipesData);
      setProducts(productsData);

      const [extras, dishes] = await Promise.all([
        shabbatPlanService.getExtraRecipes(plan.id),
        shabbatPlanService.getDishAssignments(plan.id),
      ]);
      setExtraRecipes(extras);

      const dishMap: Record<string, string> = {};
      dishes.forEach(d => { dishMap[`${d.round}-${d.sink}`] = d.person; });
      setDishAssignments(dishMap);
    } catch (e) {
      console.error('Failed to load shabbat plan:', e);
      toast.error('שגיאה בטעינת תכנון שבת');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(currentFriday);
  }, [currentFriday, loadData]);

  useEffect(() => {
    return () => { Object.values(dishTimers).forEach(clearTimeout); };
  }, [dishTimers]);

  const navigateWeek = (direction: number) => {
    const d = new Date(currentFriday + 'T00:00:00');
    d.setDate(d.getDate() + direction * 7);
    setCurrentFriday(shabbatPlanService.getWeekFriday(d));
  };

  const handleMealChange = async (field: 'friday_meal_id' | 'saturday_meal_id', mealId: string | null) => {
    if (!planId) return;
    try {
      await shabbatPlanService.updateMealAssignment(planId, field, mealId);
      if (field === 'friday_meal_id') setFridayMealId(mealId);
      else setSaturdayMealId(mealId);
    } catch {
      toast.error('שגיאה בעדכון');
    }
  };

  const handleAddExtraRecipe = async (recipeId: string) => {
    if (!planId) return;
    try {
      await shabbatPlanService.addExtraRecipe(planId, recipeId, extraRecipes.length);
      const updated = await shabbatPlanService.getExtraRecipes(planId);
      setExtraRecipes(updated);
    } catch {
      toast.error('שגיאה בהוספת מתכון');
    }
  };

  const handleRemoveExtraRecipe = async (id: string) => {
    if (!planId) return;
    try {
      await shabbatPlanService.removeExtraRecipe(id);
      setExtraRecipes(prev => prev.filter(r => r.id !== id));
    } catch {
      toast.error('שגיאה בהסרת מתכון');
    }
  };

  const handleDishChange = (round: string, sink: number, person: string) => {
    const key = `${round}-${sink}`;
    setDishAssignments(prev => ({ ...prev, [key]: person }));

    if (dishTimers[key]) clearTimeout(dishTimers[key]);
    const timer = setTimeout(async () => {
      if (!planId) return;
      try {
        await shabbatPlanService.upsertDishAssignment(planId, round, sink, person);
      } catch {
        toast.error('שגיאה בשמירת חלוקת כלים');
      }
    }, 800);
    setDishTimers(prev => ({ ...prev, [key]: timer }));
  };

  const formatFridayDate = () => {
    const d = new Date(currentFriday + 'T00:00:00');
    const sat = new Date(d);
    sat.setDate(sat.getDate() + 1);
    const fmt = (dt: Date) => `${dt.getDate()}/${dt.getMonth() + 1}`;
    return `שבת ${fmt(d)} - ${fmt(sat)}`;
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
        <h1 className="text-3xl font-bold tracking-tight">תכנון שבת</h1>
        <p className="text-muted-foreground">תכנן את ארוחות השבת, הכנות נוספות וחלוקת כלים</p>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-lg">{formatFridayDate()}</span>
        </div>
        <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentFriday(shabbatPlanService.getWeekFriday())}>
          השבת הקרובה
        </Button>
      </div>

      {/* Main layout: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Extra recipes + Dish washing */}
        <div className="space-y-6 order-2 lg:order-1">
          <ShabbatExtraRecipes
            extraRecipes={extraRecipes}
            allRecipes={allRecipes}
            onAdd={handleAddExtraRecipe}
            onRemove={handleRemoveExtraRecipe}
          />
          <DishWashingTable
            assignments={dishAssignments}
            onChange={handleDishChange}
          />
        </div>

        {/* Right column: Two meals */}
        <div className="space-y-6 order-1 lg:order-2">
          <ShabbatMealCard
            title="ארוחת שישי"
            selectedMealId={fridayMealId}
            meals={meals}
            onMealChange={(id) => handleMealChange('friday_meal_id', id)}
            onPreview={setPreviewMeal}
          />
          <ShabbatMealCard
            title="ארוחת שבת"
            selectedMealId={saturdayMealId}
            meals={meals}
            onMealChange={(id) => handleMealChange('saturday_meal_id', id)}
            onPreview={setPreviewMeal}
          />
        </div>
      </div>

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

export default ShabbatPlan;
