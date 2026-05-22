import { motion } from 'framer-motion';

interface ScoreRingProps {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}

export const ScoreRing = ({ value, size = 96, color = '#7C3AED', label }: ScoreRingProps) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(148, 163, 184, 0.25)" strokeWidth="8" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-semibold text-slate-100">{Math.round(value)}</p>
        {label && <p className="text-[10px] text-slate-400">{label}</p>}
      </div>
    </div>
  );
};
