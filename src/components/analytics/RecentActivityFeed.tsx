import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  LogIn,
  LogOut,
  ShieldAlert,
  Car,
  Bell,
  Search,
  Filter
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'Booking' | 'Entry' | 'Exit' | 'Violation' | 'Vehicle' | 'Notification';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  actorName?: string;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = activities.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.actorName && act.actorName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'ALL' || act.type === filterType;
    return matchesSearch && matchesType;
  });

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'Booking':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'Entry':
        return <LogIn className="w-4 h-4 text-emerald-500" />;
      case 'Exit':
        return <LogOut className="w-4 h-4 text-amber-500" />;
      case 'Violation':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'Vehicle':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'Notification':
        return <Bell className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const s = status.toLowerCase();
    let style = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    if (s.includes('approved') || s.includes('resolved') || s.includes('checked in')) {
      style = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
    } else if (s.includes('pending') || s.includes('review')) {
      style = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
    } else if (s.includes('rejected') || s.includes('critical') || s.includes('high')) {
      style = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
    } else if (s.includes('checked out') || s.includes('completed')) {
      style = 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300';
    }

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${style}`}>
        {status}
      </span>
    );
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Realtime Activity Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest society updates across bookings, gate traffic, violations & alerts
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 w-36 sm:w-48"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Types</option>
              <option value="Booking">Bookings</option>
              <option value="Entry">Entries</option>
              <option value="Exit">Exits</option>
              <option value="Violation">Violations</option>
              <option value="Vehicle">Vehicles</option>
              <option value="Notification">Notifications</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
          <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-xs font-medium">No activity records found matching your filters.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-96 overflow-y-auto pr-1 space-y-1">
          {filtered.map((act) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-2xl transition-colors"
            >
              <div className="flex items-start space-x-3 min-w-0">
                <div className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getActivityIcon(act.type)}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                      {act.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                    {act.description}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatTime(act.timestamp)}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-2">
                {getStatusBadge(act.status)}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
