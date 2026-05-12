import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, UtensilsCrossed, AlertTriangle, Clock } from 'lucide-react';
import { toJewishDate, toHebrewJewishDate } from 'jewish-date';
import { monthlyCalendarService, type CalendarEvent } from '@/services/monthlyCalendarService';
import { weeklyPlanService, type WeeklySlotRecipe } from '@/services/weeklyPlanService';
import { recipeService } from '@/services/recipeService';
import { productService } from '@/services/productService';
import { Recipe, Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MEAL_TYPES = [
  { key: 'lunch' as const, label: 'צהריים' },
  { key: 'dinner' as const, label: 'ערב' },
];

const todayDateStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DailyView = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todayRecipes, setTodayRecipes] = useState<Record<'lunch' | 'dinner', Recipe[]>>({ lunch: [], dinner: [] });
  const [lowStock, setLowStock] = useState<Product[]>([]);

  const today = new Date();
  const dateStr = todayDateStr();
  const dayOfWeek = today.getDay();
  const dayName = DAYS_HE[dayOfWeek];

  const hebrewLabel = (() => {
    const heb = toHebrewJewishDate(toJewishDate(today));
    return `${heb.day} ${heb.monthName} ${heb.year}`;
  })();

  const gregLabel = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  useEffect(() => {
    (async () => {
      try {
        const weekStart = weeklyPlanService.getWeekStart(today);
        const [evts, plan, allRecipes, low] = await Promise.all([
          monthlyCalendarService.getEventsForRange(dateStr, dateStr),
          weeklyPlanService.getOrCreatePlan(weekStart),
          recipeService.getAll(),
          productService.getLowStock(),
        ]);
        setEvents(evts);
        setLowStock(low);

        const slotRecipes: WeeklySlotRecipe[] = await weeklyPlanService.getSlotRecipes(plan.id);
        const resolve = (mt: 'lunch' | 'dinner') =>
          slotRecipes
            .filter(sr => sr.day_of_week === dayOfWeek && sr.meal_type === mt)
            .map(sr => allRecipes.find(r => r.id === sr.recipe_id))
            .filter(Boolean) as Recipe[];
        setTodayRecipes({ lunch: resolve('lunch'), dinner: resolve('dinner') });
      } catch (e) {
        console.error('Failed to load daily view:', e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  const isWeekday = dayOfWeek >= 0 && dayOfWeek <= 4;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">יום {dayName}</h1>
        <p className="text-muted-foreground">{hebrewLabel} · {gregLabel}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's events */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle>אירועי היום</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין אירועים מתוכננים להיום</p>
            ) : (
              <div className="space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 rounded-md border p-2">
                    {ev.time_display && (
                      <span className="font-mono text-xs text-primary shrink-0 mt-0.5" dir="ltr">
                        {ev.time_display}
                      </span>
                    )}
                    <span className="text-sm">{ev.description}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's meals */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <CardTitle>ארוחות היום</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!isWeekday ? (
              <p className="text-sm text-muted-foreground">תכנון הארוחות זמין לימים ראשון–חמישי</p>
            ) : (
              <div className="space-y-3">
                {MEAL_TYPES.map(({ key, label }) => {
                  const recipes = todayRecipes[key];
                  return (
                    <div key={key} className="rounded-md border p-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">{label}</span>
                      </div>
                      {recipes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">לא תוכנן</p>
                      ) : (
                        <ul className="space-y-1">
                          {recipes.map(r => (
                            <li key={r.id} className="text-sm bg-muted/50 rounded px-2 py-1">{r.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock products */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>מלאי נמוך</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">כל המוצרים מעל כמות המינימום ✓</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lowStock.map(product => (
                <ProductCard key={product.id} product={product} variant="compact" showLowStock />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyView;
