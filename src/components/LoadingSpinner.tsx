import React from 'react';
import { motion } from 'motion/react';
import { Car } from 'lucide-react';

export const LoadingSpinner: React.FC<{ fullScreen?: boolean; label?: string }> = ({
  fullScreen = true,
  label = 'Loading ParkWise...'
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 border-r-teal-500"
        />
        <Car className="w-8 h-8 text-emerald-500 animate-pulse" />
      </div>
      {label && (
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{content}</div>;
};
