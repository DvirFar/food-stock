import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Product, categoryLabels, ProductCategory } from '@/types';

interface StockLevelChartProps {
  products: Product[];
}

export const StockLevelChart = ({ products }: StockLevelChartProps) => {
  // Show top 8 products by stock level concern (lowest percentage of min)
  const stockData = products
    .map(product => ({
      name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
      fullName: product.name,
      quantity: product.quantity,
      minQuantity: product.min_quantity,
      percentage: product.min_quantity > 0 
        ? Math.round((product.quantity / product.min_quantity) * 100) 
        : 100,
      isLow: product.quantity < product.min_quantity,
    }))
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 8);

  const chartConfig: ChartConfig = {
    percentage: { 
      label: 'רמת מלאי %',
      color: 'hsl(var(--chart-1))'
    },
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">רמות מלאי</CardTitle>
          <CardDescription>מלאי נוכחי מול מינימום נדרש</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">אין עדיין מוצרים</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">רמות מלאי</CardTitle>
        <CardDescription>אחוז מהמלאי המינימלי הנדרש</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={stockData} layout="vertical">
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              domain={[0, 'dataMax']}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  labelFormatter={(_, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullName;
                    }
                    return '';
                  }}
                  formatter={(value, name, item) => (
                    <span className="text-foreground">
                      {item.payload.quantity} / {item.payload.minQuantity} ({value}%)
                    </span>
                  )}
                />
              } 
            />
            <ReferenceLine x={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Bar 
              dataKey="percentage" 
              radius={[0, 4, 4, 0]}
              name="רמת מלאי"
            >
              {stockData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isLow ? 'hsl(var(--destructive))' : 'hsl(var(--chart-1))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
