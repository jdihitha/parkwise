import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Layers,
  Building,
  Car,
  ShieldAlert,
  Clock,
  PieChart,
  Lightbulb
} from 'lucide-react';

export interface QuickInsightsData {
  peakVisitorDay: string;
  mostUsedFloor: string;
  mostUsedBuilding: string;
  mostCommonVehicleType: string;
  mostFrequentViolation: string;
  avgVisitorDuration: string;
  avgParkingUtilization: string;
}

interface QuickInsightsGridProps {
  insights: QuickInsightsData;
}

export const QuickInsightsGrid: React.FC<QuickInsightsGridProps> = ({ insights }) => {
  const cards = [
    {
      title: 'Peak Visitor Day',
      value: insights.peakVisitorDay || 'N/A',
      desc: 'Highest entry volume day',
      icon: Calendar,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60'
    },
    {
      title: 'Most Used Floor',
      value: insights.mostUsedFloor || 'N/A',
      desc: 'Highest parking occupancy',
      icon: Layers,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60'
    },
    {
      title: 'Most Used Building',
      value: insights.mostUsedBuilding || 'N/A',
      desc: 'Tower / Block demand leader',
      icon: Building,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/60'
    },
    {
      title: 'Most Common Vehicle',
      value: insights.mostCommonVehicleType || 'N/A',
      desc: 'Primary registered category',
      icon: Car,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60'
    },
    {
      title: 'Top Violation Cause',
      value: insights.mostFrequentViolation || 'N/A',
      desc: 'Most logged security alert',
      icon: ShieldAlert,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60'
    },
    {
      title: 'Avg Visitor Duration',
      value: insights.avgVisitorDuration || 'N/A',
      desc: 'Mean stay time per visitor',
      icon: Clock,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
    },
    {
      title: 'Parking Utilization',
      value: insights.avgParkingUtilization || 'N/A',
      desc: 'Live occupancy percentage',
      icon: PieChart,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Quick Operational Insights
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated intelligence derived from realtime Firestore records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-xl ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {card.value}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
