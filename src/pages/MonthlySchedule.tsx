import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { toJewishDate, toHebrewJewishDate, toGregorianDate, JewishMonth } from 'jewish-date';
import { monthlyCalendarService } from '@/services/monthlyCalendarService';
import { toast } from 'sonner';

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

type JewishMonthName = typeof JewishMonth[keyof typeof JewishMonth];

const HEBREW_MONTHS_ORDER: JewishMonthName[] = [
  JewishMonth.Tishri, JewishMonth.Cheshvan, JewishMonth.Kislev,
  JewishMonth.Tevet, JewishMonth.Shevat, JewishMonth.Adar,
  JewishMonth.Nisan, JewishMonth.Iyyar, JewishMonth.Sivan,
  JewishMonth.Tammuz, JewishMonth.Av, JewishMonth.Elul,
];

const HEBREW_MONTHS_ORDER_LEAP: JewishMonthName[] = [
  JewishMonth.Tishri, JewishMonth.Cheshvan, JewishMonth.Kislev,
  JewishMonth.Tevet, JewishMonth.Shevat, JewishMonth.Adar, JewishMonth.AdarII,
  JewishMonth.Nisan, JewishMonth.Iyyar, JewishMonth.Sivan,
  JewishMonth.Tammuz, JewishMonth.Av, JewishMonth.Elul,
];

const GREG_MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

function isLeapYear(hebrewYear: number): boolean {
  return [3, 6, 8, 11, 14, 17, 19].includes(hebrewYear % 19);
}

function getMonthsForYear(hebrewYear: number): JewishMonthName[] {
  return isLeapYear(hebrewYear) ? HEBREW_MONTHS_ORDER_LEAP : HEBREW_MONTHS_ORDER;
}

interface DayCell {
  date: Date;
  dateStr: string;
  gregDay: number;
  gregMonthYear: string;
  hebrewDay: string;
  hebrewDayNum: number;
  hebrewMonthName: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function buildHebrewMonthGrid(hebrewYear: number, hebrewMonth: JewishMonthName): DayCell[] {
  // Find Gregorian date of 1st of Hebrew month
  const firstGreg = toGregorianDate({ year: hebrewYear, monthName: hebrewMonth, day: 1 });

  // Find all days in this Hebrew month by iterating until month changes
  const daysInMonth: Date[] = [];
  for (let dayNum = 1; dayNum <= 30; dayNum++) {
    try {
      const g = toGregorianDate({ year: hebrewYear, monthName: hebrewMonth, day: dayNum });
      // Verify it's valid by converting back
      const check = toJewishDate(g);
      if (check.monthName !== hebrewMonth || check.year !== hebrewYear) break;
      daysInMonth.push(g);
    } catch {
      break;
    }
  }

  if (daysInMonth.length === 0) return [];

  const lastDay = daysInMonth[daysInMonth.length - 1];

  // Pad to full weeks (Sunday start)
  const startOffset = firstGreg.getDay(); // 0=Sunday
  const startDate = new Date(firstGreg);
  startDate.setDate(startDate.getDate() - startOffset);

  const endDayOfWeek = lastDay.getDay();
  const endPad = endDayOfWeek === 6 ? 0 : 6 - endDayOfWeek;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells: DayCell[] = [];
  const totalDays = startOffset + daysInMonth.length + endPad;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);

    const jd = toJewishDate(d);
    const heb = toHebrewJewishDate(jd);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isInMonth = jd.monthName === hebrewMonth && jd.year === hebrewYear;

    cells.push({
      date: d,
      dateStr,
      gregDay: d.getDate(),
      gregMonthYear: `${GREG_MONTHS_HE[d.getMonth()]} ${d.getFullYear()}`,
      hebrewDay: heb.day,
      hebrewDayNum: jd.day,
      hebrewMonthName: heb.monthName,
      isCurrentMonth: isInMonth,
      isToday: dateStr === todayStr,
    });
  }

  return cells;
}

const MonthlySchedule = () => {
  const [hebrewYear, setHebrewYear] = useState<number>(() => toJewishDate(new Date()).year);
  const [hebrewMonth, setHebrewMonth] = useState<JewishMonthName>(() => toJewishDate(new Date()).monthName);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [saving, setSaving] = useState(false);

  const cells = useMemo(() => buildHebrewMonthGrid(hebrewYear, hebrewMonth), [hebrewYear, hebrewMonth]);

  // Get Hebrew month display name
  const hebrewMonthLabel = useMemo(() => {
    const heb = toHebrewJewishDate({ year: hebrewYear, monthName: hebrewMonth, day: 1 } as any);
    return `${heb.monthName} ${heb.year}`;
  }, [hebrewYear, hebrewMonth]);

  // Get Gregorian months that overlap
  const gregMonthsLabel = useMemo(() => {
    const gregMonths = new Set<string>();
    cells.filter(c => c.isCurrentMonth).forEach(c => gregMonths.add(c.gregMonthYear));
    return Array.from(gregMonths).join(' / ');
  }, [cells]);

  const loadNotes = useCallback(async () => {
    if (cells.length === 0) return;
    setLoading(true);
    try {
      const firstCell = cells[0];
      const lastCell = cells[cells.length - 1];
      const data = await monthlyCalendarService.getNotesForRange(firstCell.dateStr, lastCell.dateStr);
      const map: Record<string, string> = {};
      data.forEach(n => { map[n.date] = n.content; });
      setNotes(map);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בטעינת הערות');
    } finally {
      setLoading(false);
    }
  }, [hebrewYear, hebrewMonth]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const navigateMonth = (dir: number) => {
    const months = getMonthsForYear(hebrewYear);
    const currentIdx = months.indexOf(hebrewMonth);

    if (dir === 1) {
      if (currentIdx < months.length - 1) {
        setHebrewMonth(months[currentIdx + 1]);
      } else {
        const nextYear = hebrewYear + 1;
        const nextMonths = getMonthsForYear(nextYear);
        setHebrewYear(nextYear);
        setHebrewMonth(nextMonths[0]);
      }
    } else {
      if (currentIdx > 0) {
        setHebrewMonth(months[currentIdx - 1]);
      } else {
        const prevYear = hebrewYear - 1;
        const prevMonths = getMonthsForYear(prevYear);
        setHebrewYear(prevYear);
        setHebrewMonth(prevMonths[prevMonths.length - 1]);
      }
    }
  };

  const goToday = () => {
    const jd = toJewishDate(new Date());
    setHebrewYear(jd.year);
    setHebrewMonth(jd.monthName);
  };

  const openDay = (cell: DayCell) => {
    setSelectedDay(cell);
    setEditingNote(notes[cell.dateStr] || '');
  };

  const saveNote = async () => {
    if (!selectedDay) return;
    setSaving(true);
    try {
      await monthlyCalendarService.upsertNote(selectedDay.dateStr, editingNote);
      setNotes(prev => {
        const next = { ...prev };
        if (editingNote.trim() === '') {
          delete next[selectedDay.dateStr];
        } else {
          next[selectedDay.dateStr] = editingNote;
        }
        return next;
      });
      setSelectedDay(null);
    } catch (e) {
      toast.error('שגיאה בשמירת ההערה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">לוח חודשי</h1>
        <p className="text-muted-foreground">תכנון חודשי לפי חודשים עבריים</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-medium text-lg">{hebrewMonthLabel}</span>
          <span className="text-sm text-muted-foreground">{gregMonthsLabel}</span>
        </div>
        <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={goToday}>
          היום
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_HE.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const hasNote = !!notes[cell.dateStr];
              return (
                <button
                  key={cell.dateStr}
                  onClick={() => openDay(cell)}
                  className={`
                    relative flex flex-col items-start p-1.5 sm:p-2 rounded-md min-h-[60px] sm:min-h-[80px] text-start transition-colors
                    border border-transparent hover:border-primary/30 hover:bg-accent/50
                    ${!cell.isCurrentMonth ? 'opacity-40' : ''}
                    ${cell.isToday ? 'bg-primary/10 border-primary/40' : ''}
                  `}
                >
                  <div className="flex items-center justify-between w-full gap-1">
                    <span className={`text-sm font-medium ${cell.isToday ? 'text-primary' : ''}`}>
                      {cell.hebrewDay}
                    </span>
                    <span className="text-xs text-muted-foreground">{cell.gregDay}</span>
                  </div>
                  {hasNote && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 w-full">
                      {notes[cell.dateStr]}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Note editing dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => { if (!open) setSelectedDay(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDay && (
                <span>
                  {selectedDay.hebrewDay} {selectedDay.hebrewMonthName}
                  {' — '}
                  {selectedDay.gregDay}/{selectedDay.date.getMonth() + 1}/{selectedDay.date.getFullYear()}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingNote}
            onChange={(e) => setEditingNote(e.target.value)}
            placeholder="הוסף הערה ליום..."
            rows={5}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)}>ביטול</Button>
            <Button onClick={saveNote} disabled={saving}>
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlySchedule;
