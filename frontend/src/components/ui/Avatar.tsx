import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl'
};

export const Avatar = ({ name, color, size = 'md' }: AvatarProps) => (
  <div className={cn('flex items-center justify-center rounded-full font-semibold text-white', color, sizes[size])}>
    {initials(name)}
  </div>
);
