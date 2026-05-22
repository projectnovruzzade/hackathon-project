import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface SkillDistributionDonutProps {
  data: Array<{ name: string; value: number }>;
}

const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#A78BFA'];

export const SkillDistributionDonut = ({ data }: SkillDistributionDonutProps) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92}>
          {data.map((item, index) => (
            <Cell key={item.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#0f172a',
            border: '1px solid rgba(148,163,184,0.2)',
            color: '#e2e8f0'
          }}
          itemStyle={{ color: '#e2e8f0' }}
          labelStyle={{ color: '#94a3b8' }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
