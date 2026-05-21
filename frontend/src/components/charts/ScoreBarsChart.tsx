import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import { useMemo } from 'react';

interface ScoreBarsChartProps {
  data: Array<{
    name: string;
    technical: number;
    presentation: number;
    innovation: number;
    teamwork: number;
  }>;
}

export const ScoreBarsChart = ({ data }: ScoreBarsChartProps) => {
  const yMax = useMemo(() => {
    const allValues = data.flatMap((item) => [item.technical, item.presentation, item.innovation, item.teamwork]);
    const peak = Math.max(...allValues, 0);
    return peak <= 25 ? 25 : Math.ceil((peak + 5) / 10) * 10;
  }, [data]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} barCategoryGap="20%">
          <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="4 4" />
          <XAxis dataKey="name" stroke="#94A3B8" tickMargin={10} />
          <YAxis stroke="#94A3B8" domain={[0, yMax]} />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: '#0B1730',
              border: '1px solid rgba(148,163,184,0.25)',
              borderRadius: '12px'
            }}
          />
          <Legend />
          <Bar dataKey="technical" name="Technical" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
          <Bar dataKey="presentation" name="Presentation" fill="#06B6D4" radius={[6, 6, 0, 0]} />
          <Bar dataKey="innovation" name="Innovation" fill="#10B981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="teamwork" name="Team Work" fill="#F59E0B" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
