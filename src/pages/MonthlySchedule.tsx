import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { toJewishDate, toHebrewJewishDate } from 'jewish-date';
import { monthlyCalendarService, type CalendarEvent } from '@/services/monthlyCalendarService';
import { CalendarEventItem } from '@/components/calendar/CalendarEventItem';
import { DAYS_HE, buildHebrewMonthGrid, getMonthsForYear, type DayCell, type JewishMonthName } from '@/components/calendar/HebrewCalendarUtils';
import { toast } from 'sonner';

const MonthlySchedule = () => {
  const [hebrewYear, setHebrewYear] = useState<number>(() => toJewishDate(new Date()).year);
  const [hebrewMonth, setHebrewMonth] = useState<JewishMonthName>(() => toJewishDate(new Date()).monthName);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);
  const [newDesc, setNewDesc] = useState('');
  const [newTime, setNewTime] = useState('');
  const [adding, setAdding] = useState(false);

  const cells = useMemo(() => buildHebrewMonthGrid(hebrewYear, hebrewMonth), [hebrewYear, hebrewMonth]);

  const hebrewMonthLabel = useMemo(() => {
    const heb = toHebrewJewishDate({ year: hebrewYear, monthName: hebrewMonth, day: 1 } as any);
    return `${heb.monthName} ${heb.year}`;
  }, [hebrewYear, hebrewMonth]);

  const gregMonthsLabel = useMemo(() => {
    const gregMonths = new Set<string>();
    cells.filter(c => c.isCurrentMonth).forEach(c => gregMonths.add(c.gregMonthYear));
    return Array.from(gregMonths).join(' / ');
  }, [cells]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const loadEvents = useCallback(async () => {
    if (cells.length === 0) return;
    setLoading(true);
    try {
      const data = await monthlyCalendarService.getEventsForRange(cells[0].dateStr, cells[cells.length - 1].dateStr);
      setEvents(data);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בטעינת אירועים');
    } finally {
      setLoading(false);
    }
  }, [hebrewYear, hebrewMonth]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const navigateMonth = (dir: number) => {
    const months = getMonthsForYear(hebrewYear);
    const currentIdx = months.indexOf(hebrewMonth);
    if (dir === 1) {
      if (currentIdx < months.length - 1) setHebrewMonth(months[currentIdx + 1]);
      else { const y = hebrewYear + 1; setHebrewYear(y); setHebrewMonth(getMonthsForYear(y)[0]); }
    } else {
      if (currentIdx > 0) setHebrewMonth(months[currentIdx - 1]);
      else { const y = hebrewYear - 1; const m = getMonthsForYear(y); setHebrewYear(y); setHebrewMonth(m[m.length - 1]); }
    }
  };

  const goToday = () => { const jd = toJewishDate(new Date()); setHebrewYear(jd.year); setHebrewMonth(jd.monthName); };

  const handleAddEvent = async () => {
    if (!selectedDay || !newDesc.trim()) return;
    setAdding(true);
    try {
      const ev = await monthlyCalendarService.addEvent(selectedDay.dateStr, newDesc.trim(), newTime.trim() || null);
      setEvents(prev => [...prev, ev]);
      setNewDesc('');
      setNewTime('');
    } catch { toast.error('שגיאה בהוספת אירוע'); }
    finally { setAdding(false); }
  };

  const handleUpdateEvent = async (id: string, updates: { description?: string; time_display?: string | null }) => {
    try {
      await monthlyCalendarService.updateEvent(id, updates);
      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e));
    } catch { toast.error('שגיאה בעדכון אירוע'); }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await monthlyCalendarService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch { toast.error('שגיאה במחיקת אירוע'); }
  };

  const dayEvents = selectedDay ? (eventsByDate[selectedDay.dateStr] || []) : [];

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Compact header */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center leading-tight">
          <span className="font-semibold">{hebrewMonthLabel}</span>
          <span className="text-xs text-muted-foreground">{gregMonthsLabel}</span>
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={goToday}>היום</Button>
      </div>

      {/* Calendar Grid */}
      <Card className="flex-1 min-h-0">
        <CardContent className="p-1.5 sm:p-2 h-full">
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {DAYS_HE.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-0.5">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map(cell => {
              const cellEvents = eventsByDate[cell.dateStr] || [];
              return (
                <button
                  key={cell.dateStr}
                  onClick={() => { setSelectedDay(cell); setNewDesc(''); setNewTime(''); }}
                  className={`
                    relative flex flex-col items-start p-1 sm:p-1.5 rounded min-h-[56px] sm:min-h-[70px] text-start transition-colors
                    border border-transparent hover:border-primary/30 hover:bg-accent/50
                    ${!cell.isCurrentMonth ? 'opacity-40' : ''}
                    ${cell.isToday ? 'bg-primary/10 border-primary/40' : ''}
                  `}
                >
                  <div className="flex items-center justify-between w-full gap-0.5">
                    <span className={`text-xs font-medium ${cell.isToday ? 'text-primary' : ''}`}>{cell.hebrewDay}</span>
                    <span className="text-[10px] text-muted-foreground">{cell.gregDay}</span>
                  </div>
                  {cellEvents.slice(0, 2).map(ev => (
                    <div key={ev.id} className="w-full mt-0.5">
                      <div className="text-[10px] leading-tight truncate w-full rounded bg-primary/10 px-0.5">
                        {ev.time_display && <span className="font-mono text-primary/70" dir="ltr">{ev.time_display} </span>}
                        {ev.description}
                      </div>
                    </div>
                  ))}
                  {cellEvents.length > 2 && (
                    <span className="text-[9px] text-muted-foreground mt-0.5">+{cellEvents.length - 2} עוד</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDay} onOpenChange={open => { if (!open) setSelectedDay(null); }}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" />
              {selectedDay && (
                <span>
                  {selectedDay.hebrewDay} {selectedDay.hebrewMonthName}
                  {' — '}
                  {selectedDay.gregDay}/{selectedDay.date.getMonth() + 1}/{selectedDay.date.getFullYear()}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {dayEvents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">אין אירועים ליום זה</p>
            )}
            {dayEvents.map(ev => (
              <CalendarEventItem key={ev.id} event={ev} onUpdate={handleUpdateEvent} onDelete={handleDeleteEvent} />
            ))}
          </div>

          {/* Add new event */}
          <div className="border-t pt-2 space-y-1.5">
            <Input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="אירוע חדש..."
              className="h-8 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newDesc.trim()) handleAddEvent(); }}
            />
            <div className="flex items-center gap-2">
              <Input
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                placeholder="שעה (לא חובה) 09:00-10:30"
                className="h-7 text-xs flex-1"
                dir="ltr"
              />
              <Button size="sm" className="h-7 px-3 text-xs" onClick={handleAddEvent} disabled={adding || !newDesc.trim()}>
                <Plus className="h-3 w-3 me-1" />
                הוסף
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlySchedule;
