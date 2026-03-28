import { PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';


interface CategoryPieChartProps {
  categoryCounts: Partial<Record<string, number>>;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 70%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(30, 70%, 50%)',
  'hsl(330, 60%, 50%)',
  'hsl(var(--muted-foreground))',
];

export const CategoryPieChart = ({ categoryCounts }: CategoryPieChartProps) => {

  const data = Object.entries(categoryCounts).map(([category, count], i) => ({
    name: category,
    value: count,
    category,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">מוצרים לפי קטגוריה</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">אין עדיין מוצרים</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((d) => [
      d.category,
      { label: d.name, color: d.color }
    ])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">מוצרים לפי קטגוריה</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry) => (
                <Cell 
                  key={`cell-${entry.category}`} 
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {data.map((entry) => (
            <div key={entry.category} className="flex items-center gap-1.5 text-xs">
              <div 
                className="w-2.5 h-2.5 rounded-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};