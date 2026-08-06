import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react';
import { shabbatPlanService, ShabbatPlanSection } from '@/services/shabbatPlanService';
import { recipeService } from '@/services/recipeService';
import { productService } from '@/services/productService';
import { Recipe, Product, RecipeIngredient } from '@/types';
import { ShabbatMealCard } from '@/components/shabbat/ShabbatMealCard';
import { ShabbatExtraRecipes } from '@/components/shabbat/ShabbatExtraRecipes';
import { DishWashingTable } from '@/components/shabbat/DishWashingTable';
import { SlotPreviewDialog } from '@/components/SlotPreviewDialog';
import { toast } from 'sonner';

const ShabbatPlan = () => {
  const [currentFriday, setCurrentFriday] = useState(() => shabbatPlanService.getWeekFriday());
  const [planId, setPlanId] = useState<string | null>(null);
  const [sections, setSections] = useState<ShabbatPlanSection[]>([]);
  const [extraRecipes, setExtraRecipes] = useState<any[]>([]);
  const [dishAssignments, setDishAssignments] = useState<Record<string, string>>({});
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dishTimers, setDishTimers] = useState<Record<string, ReturnType<typeof setTimeout>>>({});
  const [previewSlot, setPreviewSlot] = useState<'friday' | 'saturday' | null>(null);

  const fridaySections = useMemo(() => sections.filter(s => s.slot === 'friday'), [sections]);
  const saturdaySections = useMemo(() => sections.filter(s => s.slot === 'saturday'), [sections]);

  const loadData = useCallback(async (friday: string) => {
    setLoading(true);
    try {
      const [plan, recipesData, productsData] = await Promise.all([
        shabbatPlanService.getOrCreatePlan(friday),
        recipeService.getAll(),
        productService.getAll(),
      ]);
      setPlanId(plan.id);
      setAllRecipes(recipesData);
      setProducts(productsData);

      const [secs, extras, dishes] = await Promise.all([
        shabbatPlanService.getSections(plan.id),
        shabbatPlanService.getExtraRecipes(plan.id),
        shabbatPlanService.getDishAssignments(plan.id),
      ]);
      setSections(secs);
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

  useEffect(() => { loadData(currentFriday); }, [currentFriday, loadData]);
  useEffect(() => { return () => { Object.values(dishTimers).forEach(clearTimeout); }; }, [dishTimers]);

  const navigateWeek = (direction: number) => {
    const d = new Date(currentFriday + 'T00:00:00');
    d.setDate(d.getDate() + direction * 7);
    setCurrentFriday(shabbatPlanService.getWeekFriday(d));
  };

  const handleAddSection = async (slot: string, name: string, sortOrder: number) => {
    if (!planId) return;
    try {
      await shabbatPlanService.addSection(planId, slot, name, sortOrder);
      await loadData(currentFriday);
    } catch { toast.error('שגיאה בהוספת חלק'); }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await shabbatPlanService.deleteSection(sectionId);
      await loadData(currentFriday);
    } catch { toast.error('שגיאה במחיקת חלק'); }
  };

  const handleAddRecipe = async (sectionId: string, recipeId: string | null, sortOrder: number, customName?: string) => {
    try {
      await shabbatPlanService.addRecipeToSection(sectionId, recipeId, sortOrder, customName);
      await loadData(currentFriday);
    } catch { toast.error('שגיאה בהוספת מתכון'); }
  };

  const handleRemoveRecipe = async (recipeEntryId: string) => {
    try {
      await shabbatPlanService.removeRecipeFromSection(recipeEntryId);
      await loadData(currentFriday);
    } catch { toast.error('שגיאה בהסרת מתכון'); }
  };

  const handleUpdateRecipe = async (recipeEntryId: string, updates: { is_done?: boolean; assigned_to?: string }) => {
    setSections(prev => prev.map(s => ({
      ...s,
      recipes: s.recipes.map(r => r.id === recipeEntryId ? { ...r, ...updates } : r),
    })));
    try {
      await shabbatPlanService.updateSectionRecipe(recipeEntryId, updates);
    } catch {
      toast.error('שגיאה בעדכון מתכון');
      await loadData(currentFriday);
    }
  };

  const handleReorderSections = async (sectionIds: string[]) => {
    setSections(prev => {
      const map = new Map(prev.map(s => [s.id, s]));
      const reordered = sectionIds.map(id => map.get(id)!).filter(Boolean);
      const rest = prev.filter(s => !sectionIds.includes(s.id));
      return [...reordered, ...rest].map((s, i) =>
        sectionIds.includes(s.id) ? { ...s, sort_order: sectionIds.indexOf(s.id) } : s
      ).sort((a, b) => a.sort_order - b.sort_order);
    });
    try {
      await shabbatPlanService.reorderSections(sectionIds);
      await loadData(currentFriday);
    } catch {
      toast.error('שגיאה בשינוי הסדר');
      await loadData(currentFriday);
    }
  };

  const handleReorderRecipes = async (sectionId: string, recipeEntryIds: string[]) => {
    setSections(prev => prev.map(s => s.id !== sectionId ? s : {
      ...s,
      recipes: recipeEntryIds.map(id => s.recipes.find(r => r.id === id)!).filter(Boolean),
    }));
    try {
      await shabbatPlanService.reorderSectionRecipes(recipeEntryIds);
    } catch {
      toast.error('שגיאה בשינוי הסדר');
      await loadData(currentFriday);
    }
  };

  const handleAddExtraRecipe = async (recipeId: string | null, customName?: string) => {
    if (!planId) return;
    try {
      await shabbatPlanService.addExtraRecipe(planId, recipeId, extraRecipes.length, customName);
      const updated = await shabbatPlanService.getExtraRecipes(planId);
      setExtraRecipes(updated);
    } catch { toast.error('שגיאה בהוספת מתכון'); }
  };

  const handleRemoveExtraRecipe = async (id: string) => {
    if (!planId) return;
    try {
      await shabbatPlanService.removeExtraRecipe(id);
      setExtraRecipes(prev => prev.filter(r => r.id !== id));
    } catch { toast.error('שגיאה בהסרת מתכון'); }
  };

  const handleUpdateExtraRecipe = async (id: string, updates: { is_done?: boolean; assigned_to?: string }) => {
    setExtraRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    try {
      await shabbatPlanService.updateExtraRecipe(id, updates);
    } catch {
      toast.error('שגיאה בעדכון מתכון');
      if (planId) setExtraRecipes(await shabbatPlanService.getExtraRecipes(planId));
    }
  };

  const handleDishChange = (round: string, sink: number, person: string) => {
    const key = `${round}-${sink}`;
    setDishAssignments(prev => ({ ...prev, [key]: person }));
    if (dishTimers[key]) clearTimeout(dishTimers[key]);
    const timer = setTimeout(async () => {
      if (!planId) return;
      try { await shabbatPlanService.upsertDishAssignment(planId, round, sink, person); }
      catch { toast.error('שגיאה בשמירת חלוקת כלים'); }
    }, 800);
    setDishTimers(prev => ({ ...prev, [key]: timer }));
  };

  const handleApplyDefaults = async () => {
    if (!planId) return;
    try {
      await shabbatPlanService.applyDefaultsToPlan(planId);
      await loadData(currentFriday);
      toast.success('ברירות המחדל נטענו');
    } catch {
      toast.error('שגיאה בטעינת ברירות המחדל');
    }
  };

  const formatFridayDate = () => {
    const d = new Date(currentFriday + 'T00:00:00');
    const sat = new Date(d);
    sat.setDate(sat.getDate() + 1);
    const fmt = (dt: Date) => `${dt.getDate()}/${dt.getMonth() + 1}`;
    return `שבת ${fmt(d)} - ${fmt(sat)}`;
  };

  // Build preview recipes for SlotPreviewDialog
  const getPreviewRecipes = (slot: 'friday' | 'saturday') => {
    const slotSections = sections.filter(s => s.slot === slot);
    const recipeIds = slotSections.flatMap(s => s.recipes.map(r => r.recipe_id).filter(Boolean));
    return allRecipes.filter(r => recipeIds.includes(r.id));
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
        <h1 className="text-3xl font-bold tracking-tight">תכנון שבת</h1>
        <p className="text-muted-foreground">תכנן את ארוחות השבת, הכנות נוספות וחלוקת כלים</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
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
        <Button variant="outline" size="sm" onClick={handleApplyDefaults}>
          טען ברירות מחדל
        </Button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6 order-2 lg:order-1">
          <ShabbatExtraRecipes
            extraRecipes={extraRecipes}
            allRecipes={allRecipes}
            onAdd={handleAddExtraRecipe}
            onRemove={handleRemoveExtraRecipe}
            onUpdate={handleUpdateExtraRecipe}
          />
          <DishWashingTable assignments={dishAssignments} onChange={handleDishChange} />
        </div>

        <div className="space-y-6 order-1 lg:order-2">
          <ShabbatMealCard
            title="ערב שבת"
            sections={fridaySections}
            allRecipes={allRecipes}
            products={products}
            onAddSection={(name, order) => handleAddSection('friday', name, order)}
            onDeleteSection={handleDeleteSection}
            onAddRecipe={handleAddRecipe}
            onRemoveRecipe={handleRemoveRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onReorderSections={handleReorderSections}
            onReorderRecipes={handleReorderRecipes}
            onPreview={() => setPreviewSlot('friday')}
          />
          <ShabbatMealCard
            title="שבת בוקר"
            sections={saturdaySections}
            allRecipes={allRecipes}
            products={products}
            onAddSection={(name, order) => handleAddSection('saturday', name, order)}
            onDeleteSection={handleDeleteSection}
            onAddRecipe={handleAddRecipe}
            onRemoveRecipe={handleRemoveRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onReorderSections={handleReorderSections}
            onReorderRecipes={handleReorderRecipes}
            onPreview={() => setPreviewSlot('saturday')}
          />
        </div>
      </div>

      {previewSlot && (
        <SlotPreviewDialog
          open={!!previewSlot}
          onOpenChange={(open) => { if (!open) setPreviewSlot(null); }}
          title={previewSlot === 'friday' ? 'ערב שבת' : 'שבת בוקר'}
          recipes={getPreviewRecipes(previewSlot)}
          products={products}
        />
      )}
    </div>
  );
};

export default ShabbatPlan;
