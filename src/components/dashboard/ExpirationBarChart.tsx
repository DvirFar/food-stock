import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Product } from '@/types';
import { differenceInDays, format, addDays, startOfDay } from 'date-fns';

interface ExpirationBarChartProps {
  products: Product[];
}

export const ExpirationBarChart = ({ products }: ExpirationBarChartProps) => {
  const today = startOfDay(new Date());
  
  // Group products by days until expiration
  const expirationData = [
    { label: 'Expired', range: 'expired', count: 0, fill: 'hsl(var(--destructive))' },
    { label: 'Today', range: 'today', count: 0, fill: 'hsl(var(--chart-4))' },
    { label: '1-3 days', range: '1-3', count: 0, fill: 'hsl(var(--chart-5))' },
    { label: '4-7 days', range: '4-7', count: 0, fill: 'hsl(var(--chart-3))' },
    { label: '8-14 days', range: '8-14', count: 0, fill: 'hsl(var(--chart-2))' },
    { label: '15+ days', range: '15+', count: 0, fill: 'hsl(var(--chart-1))' },
  ];

  products.forEach(product => {
    if (!product.expiration_date) return;
    
    const expirationDate = startOfDay(new Date(product.expiration_date));
    const daysUntil = differenceInDays(expirationDate, today);
    
    if (daysUntil < 0) {
      expirationData[0].count++;
    } else if (daysUntil === 0) {
      expirationData[1].count++;
    } else if (daysUntil <= 3) {
      expirationData[2].count++;
    } else if (daysUntil <= 7) {
      expirationData[3].count++;
    } else if (daysUntil <= 14) {
      expirationData[4].count++;
    } else {
      expirationData[5].count++;
    }
  });

  const chartConfig: ChartConfig = {
    count: { label: 'Products' },
    expired: { label: 'Expired', color: 'hsl(var(--destructive))' },
    today: { label: 'Today', color: 'hsl(var(--chart-4))' },
    '1-3': { label: '1-3 days', color: 'hsl(var(--chart-5))' },
    '4-7': { label: '4-7 days', color: 'hsl(var(--chart-3))' },
    '8-14': { label: '8-14 days', color: 'hsl(var(--chart-2))' },
    '15+': { label: '15+ days', color: 'hsl(var(--chart-1))' },
  };

  const hasExpirationData = products.some(p => p.expiration_date);

  if (!hasExpirationData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expiration Timeline</CardTitle>
          <CardDescription>Products by days until expiration</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">No expiration dates set</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expiration Timeline</CardTitle>
        <CardDescription>Products by days until expiration</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={expirationData} layout="vertical">
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis 
              dataKey="label" 
              type="category" 
              width={70} 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="count" 
              radius={[0, 4, 4, 0]}
              name="Products"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
