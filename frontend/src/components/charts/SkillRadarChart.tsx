import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SkillRadarChartProps {
  data: Array<{ category: string; team: number; ideal: number }>;
}

const AxisTick = ({ payload, x, y, cx, cy }: any) => {
  const offset = 16;
  const dx = x - cx;
  const dy = y - cy;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const tx = x + (dx / length) * offset;
  const ty = y + (dy / length) * offset;

  return (
    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#CBD5E1" fontSize={13}>
      {payload.value}
    </text>
  );
};

export const SkillRadarChart = ({ data }: SkillRadarChartProps) => (
  <div className="h-80 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} cx="50%" cy="48%" outerRadius="58%">
        <PolarGrid stroke="rgba(148,163,184,0.25)" />
        <PolarRadiusAxis axisLine={false} tick={false} domain={[0, 25]} />
        <PolarAngleAxis dataKey="category" tick={<AxisTick />} />
        <Radar dataKey="team" name="Your Team" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
        <Radar
          dataKey="ideal"
          name="Ideal Profile"
          stroke="#22D3EE"
          fill="#22D3EE"
          fillOpacity={0.3}
          strokeDasharray="6 4"
        />
        <Legend wrapperStyle={{ paddingTop: 16 }} />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);
