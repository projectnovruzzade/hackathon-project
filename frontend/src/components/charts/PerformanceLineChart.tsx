import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PerformanceLineChartProps {
  data: Array<{ name: string; score: number }>;
}

export const PerformanceLineChart = ({ data }: PerformanceLineChartProps) => (
  <div className="h-60 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="4 4" />
        <XAxis dataKey="name" stroke="#94A3B8" />
        <YAxis stroke="#94A3B8" domain={[0, 100]} />
        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)' }} />
        <Line type="monotone" dataKey="score" stroke="#22D3EE" strokeWidth={3} dot={{ fill: '#22D3EE' }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
