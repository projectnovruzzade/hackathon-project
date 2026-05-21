import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  accent?: 'violet' | 'cyan';
}

const colorClass = {
  violet: 'text-violet-200 bg-violet-500/20',
  cyan: 'text-cyan-200 bg-cyan-500/20'
};

export const StatCard = ({ title, value, icon: Icon, accent = 'violet' }: StatCardProps) => (
  <Card className="overflow-hidden">
    <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-100">{value.toLocaleString()}</p>
      </div>
      <span className={`rounded-xl p-2 ${colorClass[accent]}`}>
        <Icon className="h-5 w-5" />
      </span>
    </motion.div>
  </Card>
);
