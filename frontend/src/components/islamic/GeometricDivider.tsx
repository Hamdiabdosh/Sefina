import { cn } from '../../lib/utils';

type GeometricDividerProps = {
  className?: string;
  /** Height of the decorative strip */
  height?: 'sm' | 'md';
};

export const GeometricDivider = ({ className, height = 'sm' }: GeometricDividerProps) => (
  <div
    aria-hidden
    className={cn(
      'w-full overflow-hidden islamic-geometric-bg',
      height === 'sm' ? 'h-1' : 'h-1.5',
      className
    )}
  >
    <div className="h-full w-full bg-gradient-to-r from-islamic-gold via-islamic-gold-hover to-islamic-gold opacity-90" />
  </div>
);
