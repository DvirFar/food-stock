import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Droplets } from 'lucide-react';

const ROUNDS = [
  { key: 'friday', label: 'שישי' },
  { key: 'saturday_morning', label: 'שבת בוקר' },
  { key: 'saturday_evening', label: 'מוצ"ש' },
] as const;

interface DishWashingTableProps {
  assignments: Record<string, string>; // key: `${round}-${sink}`, value: person
  onChange: (round: string, sink: number, person: string) => void;
}

export const DishWashingTable = ({ assignments, onChange }: DishWashingTableProps) => {
  const getValue = (round: string, sink: number) => assignments[`${round}-${sink}`] || '';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Droplets className="h-5 w-5" />
          חלוקת כלים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-[100px]">סבב</TableHead>
              <TableHead className="text-right">כיור 1</TableHead>
              <TableHead className="text-right">כיור 2</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROUNDS.map(({ key, label }) => (
              <TableRow key={key}>
                <TableCell className="font-medium text-sm">{label}</TableCell>
                <TableCell>
                  <Input
                    placeholder="שם..."
                    value={getValue(key, 1)}
                    onChange={(e) => onChange(key, 1, e.target.value)}
                    className="h-8 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="שם..."
                    value={getValue(key, 2)}
                    onChange={(e) => onChange(key, 2, e.target.value)}
                    className="h-8 text-sm"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
