import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, CalendarDays, UtensilsCrossed, X, StickyNote } from 'lucide-react';
import { weeklyPlanService, WeeklyPlanSlot, WeeklyPlanDayNote } from '@/services/weeklyPlanService';
import { mealService, Meal } from '@/services/mealService';
import { toast } from 'sonner';

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MEAL_TYPES = [
  { key: 'lunch' as const, label: 'ארוחת צהריים' },
  { key: 'dinner' as const, label: 'ארוחת ערב' },
];

const WeeklyMealPlan = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => weeklyPlanService.getWeekStart());
  const [planId, setPlanId] = useState<string | null>(null);
  const [slots, setSlots] = useState<WeeklyPlanSlot[]>([]);
  const [notes, setNotes] = useState<WeeklyPlanDayNote[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingNotes, setPendingNotes] = useState<Record<string, string>>({});
  const [noteTimers, setNoteTimers] = useState<Record<string, NodeJS.Timeout>>({});

  const loadWeek = useCallback(async (weekStart: string) => {
    setLoading(true);
    try {
      const [plan, mealsData] = await Promise.all([
        weeklyPlanService.getOrCreatePlan(weekStart),
        mealService.getAll(),
      ]);
      setPlanId(plan.id);
      setMeals(mealsData);

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

  useEffect(() => {
    loadWeek(currentWeekStart);
  }, [currentWeekStart, loadWeek]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      Object.values(noteTimers).forEach(clearTimeout);
    };
  }, [noteTimers]);

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
    const note = notes.find(n => n.day_of_week === day && n.note_type === noteType);
    return note?.content || '';
  };

  const handleSlotChange = async (day: number, mealType: 'lunch' | 'dinner', mealId: string | null) => {
    if (!planId) return;
    try {
      await weeklyPlanService.upsertSlot(planId, day, mealType, mealId);
      const updatedSlots = await weeklyPlanService.getSlots(planId);
      setSlots(updatedSlots);
    } catch (e) {
      toast.error('שגיאה בעדכון');
    }
  };

  const handleNoteChange = (day: number, noteType: 'lunch' | 'dinner' | 'general', value: string) => {
    const key = `${day}-${noteType}`;
    setPendingNotes(prev => ({ ...prev, [key]: value }));

    // Debounce save
    if (noteTimers[key]) clearTimeout(noteTimers[key]);
    const timer = setTimeout(async () => {
      if (!planId) return;
      try {
        await weeklyPlanService.upsertNote(planId, day, noteType, value);
      } catch (e) {
        toast.error('שגיאה בשמירת הערה');
      }
    }, 800);
    setNoteTimers(prev => ({ ...prev, [key]: timer }));
  };

  const getMealName = (mealId: string | null) => {
    if (!mealId) return null;
    return meals.find(m => m.id === mealId)?.name || null;
  };

  const formatWeekRange = () => {
    const start = new Date(currentWeekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">תכנון שבועי</h1>
          <p className="text-muted-foreground">תכנן את הארוחות שלך לכל ימי השבוע</p>
        </div>
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeekStart(weeklyPlanService.getWeekStart())}
        >
          היום
        </Button>
      </div>

      {/* Weekly grid */}
      <div className="grid gap-4">
        {DAYS_HE.map((dayName, dayIndex) => (
          <Card key={dayIndex}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge variant="outline" className="font-normal">
                  {getDayDate(dayIndex)}
                </Badge>
                יום {dayName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* General note for the day */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5" />
                  <span>הערות כלליות</span>
                </div>
                <Textarea
                  placeholder="הערות ליום..."
                  value={getNoteContent(dayIndex, 'general')}
                  onChange={(e) => handleNoteChange(dayIndex, 'general', e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>

              {/* Meal slots */}
              {MEAL_TYPES.map(({ key, label }) => {
                const slot = getSlot(dayIndex, key);
                const selectedMealId = slot?.meal_id || '';

                return (
                  <div key={key} className="space-y-2 border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{label}</span>
                    </div>

                    {/* Note before meal */}
                    <Textarea
                      placeholder={`הערות ל${label}...`}
                      value={getNoteContent(dayIndex, key)}
                      onChange={(e) => handleNoteChange(dayIndex, key, e.target.value)}
                      rows={2}
                      className="resize-none text-sm"
                    />

                    {/* Meal selector */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedMealId}
                        onValueChange={(val) => handleSlotChange(dayIndex, key, val || null)}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleSlotChange(dayIndex, key, null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WeeklyMealPlan;
