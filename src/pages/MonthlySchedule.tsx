import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { toJewishDate, formatJewishDateInHebrew, toHebrewJewishDate } from 'jewish-date';
import { monthlyCalendarService, CalendarNote } from '@/services/monthlyCalendarService';
import { toast } from 'sonner';

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const GREG_MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

interface DayCell {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  hebrewDay: string;
  hebrewMonthYear: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function getHebrewMonthName(date: Date): string {
  const jd = toJewishDate(date);
  const heb = toHebrewJewishDate(jd);
  return `${heb.monthName} ${heb.year}`;
}

function buildCalendarGrid(year: number, month: number): DayCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sunday
  const startDate = new Date(year, month, 1 - startOffset);
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const cells: DayCell[] = [];
  const totalCells = 42; // 6 weeks
  
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    
    const jd = toJewishDate(d);
    const heb = toHebrewJewishDate(jd);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    cells.push({
      date: d,
      dateStr,
      dayOfMonth: d.getDate(),
      hebrewDay: heb.day,
      hebrewMonthYear: `${heb.monthName} ${heb.year}`,
      isCurrentMonth: d.getMonth() === month,
      isToday: dateStr === todayStr,
    });
  }
  
  // Trim trailing empty week if all outside current month
  const lastWeekStart = cells.length - 7;
  if (cells.slice(lastWeekStart).every(c => !c.isCurrentMonth)) {
    cells.splice(lastWeekStart, 7);
  }
  
  return cells;
}

const MonthlySchedule = () => {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [saving, setSaving] = useState(false);

  const cells = buildCalendarGrid(currentYear, currentMonth);

  const loadNotes = useCallback(async () => {
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
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const navigateMonth = (dir: number) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const goToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
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

  // Determine Hebrew months displayed
  const hebrewMonthsInView = new Set<string>();
  cells.filter(c => c.isCurrentMonth).forEach(c => hebrewMonthsInView.add(c.hebrewMonthYear));
  const hebrewMonthLabel = Array.from(hebrewMonthsInView).join(' / ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">לוח חודשי</h1>
        <p className="text-muted-foreground">תכנון חודשי עם תאריכים עבריים</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-medium text-lg">
            {GREG_MONTHS_HE[currentMonth]} {currentYear}
          </span>
          <span className="text-sm text-muted-foreground">{hebrewMonthLabel}</span>
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
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_HE.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Cells */}
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
                      {cell.dayOfMonth}
                    </span>
                    <span className="text-xs text-muted-foreground">{cell.hebrewDay}</span>
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
                  {selectedDay.dayOfMonth}/{currentMonth + 1}/{currentYear}
                  {' — '}
                  {selectedDay.hebrewDay} {selectedDay.hebrewMonthYear.split(' ')[0]}
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
