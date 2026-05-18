import { GeometricPattern } from "./GeometricPattern";
import { LucideIcon, ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  onBack,
  rightAction,
  icon: Icon,
  children,
}: PageHeaderProps) => (
  <div className="bg-teal-400 p-4 relative overflow-hidden">
    <GeometricPattern />
    <div className="relative z-10">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        {Icon && (
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <Icon size={24} />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-[15px] font-medium text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-white/75 mt-0.5">{subtitle}</p>
          )}
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  </div>
);
