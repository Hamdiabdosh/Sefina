import { cn } from '../lib/utils';

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
} as const;

export type AppLogoProps = {
  /** Display size preset */
  size?: keyof typeof sizeClasses;
  /** `light` — white mark on teal/dark sidebar; `dark` — original grey on cream/white */
  tone?: 'light' | 'dark';
  className?: string;
};

export const AppLogo = ({ size = 'md', tone = 'dark', className }: AppLogoProps) => (
  <img
    src="/logo.png"
    alt=""
    aria-hidden
    className={cn(
      sizeClasses[size],
      'shrink-0 object-contain object-center',
      tone === 'light' && 'brightness-0 invert',
      className
    )}
  />
);
