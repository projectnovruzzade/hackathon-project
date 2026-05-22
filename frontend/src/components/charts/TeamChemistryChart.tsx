import { ScoreRing } from '@/components/ui/ScoreRing';

interface TeamChemistryChartProps {
  score: number;
}

export const TeamChemistryChart = ({ score }: TeamChemistryChartProps) => {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#FB7185';
  return (
    <div className="flex flex-col items-center gap-2">
      <ScoreRing value={score} color={color} label="Chemistry" />
      <p className="text-xs text-slate-400">Team chemistry gauge</p>
    </div>
  );
};
