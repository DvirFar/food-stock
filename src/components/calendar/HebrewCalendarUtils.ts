import { toJewishDate, toHebrewJewishDate, toGregorianDate, JewishMonth } from 'jewish-date';

export const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

type JewishMonthName = typeof JewishMonth[keyof typeof JewishMonth];

export type { JewishMonthName };

const GREG_MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

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

function isLeapYear(hebrewYear: number): boolean {
  return [3, 6, 8, 11, 14, 17, 19].includes(hebrewYear % 19);
}

export function getMonthsForYear(hebrewYear: number): JewishMonthName[] {
  return isLeapYear(hebrewYear) ? HEBREW_MONTHS_ORDER_LEAP : HEBREW_MONTHS_ORDER;
}

export interface DayCell {
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

export function buildHebrewMonthGrid(hebrewYear: number, hebrewMonth: JewishMonthName): DayCell[] {
  const firstGreg = toGregorianDate({ year: hebrewYear, monthName: hebrewMonth, day: 1 });

  const daysInMonth: Date[] = [];
  for (let dayNum = 1; dayNum <= 30; dayNum++) {
    try {
      const g = toGregorianDate({ year: hebrewYear, monthName: hebrewMonth, day: dayNum });
      const check = toJewishDate(g);
      if (check.monthName !== hebrewMonth || check.year !== hebrewYear) break;
      daysInMonth.push(g);
    } catch {
      break;
    }
  }

  if (daysInMonth.length === 0) return [];

  const lastDay = daysInMonth[daysInMonth.length - 1];
  const startOffset = firstGreg.getDay();
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
