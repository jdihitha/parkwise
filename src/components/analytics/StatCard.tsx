import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-slate-100 dark:bg-slate-800',
  iconColor = 'text-slate-600 dark:text-slate-300',
  badgeText,
  badgeType = 'neutral'
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'error':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'neutral':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
            {title}
          </p>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-2xl shrink-0 ${iconBgColor} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
        {subtitle && (
          <span className="text-slate-500 dark:text-slate-400 truncate font-medium">
            {subtitle}
          </span>
        )}
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] shrink-0 ml-auto ${getBadgeStyle()}`}>
            {badgeText}
          </span>
        )}
      </div>
    </motion.div>
  );
};
