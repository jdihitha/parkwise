import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  PieChart as PieIcon,
  TrendingUp,
  BarChart2,
  LineChart as LineIcon,
  Car,
  ShieldAlert,
  CalendarCheck
} from 'lucide-react';

export interface ChartDataSets {
  parkingOccupancy: Array<{ name: string; value: number; color: string }>;
  visitorTrend7Days: Array<{ day: string; count: number }>;
  weeklyComparison: Array<{ day: string; currentWeek: number; previousWeek: number }>;
  monthlyTrend12Months: Array<{ month: string; bookings: number; completed: number; cancelled: number }>;
  vehicleTypeStats: Array<{ name: string; value: number; color: string }>;
  violationsSeverity: Array<{ severity: string; count: number; color: string }>;
  bookingStatusDistribution: Array<{
    period: string;
    Pending: number;
    Approved: number;
    Rejected: number;
    'Checked In': number;
    'Checked Out': number;
    Cancelled: number;
  }>;
}

interface AnalyticsChartsGridProps {
  data: ChartDataSets;
}

const customTooltipStyle = {
  backgroundColor: '#0f172a',
  borderColor: '#334155',
  borderRadius: '1rem',
  color: '#f8fafc',
  fontSize: '12px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
};

export const AnalyticsChartsGrid: React.FC<AnalyticsChartsGridProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* 1. Parking Occupancy (Doughnut Chart) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <PieIcon className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              1. Parking Occupancy
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Live distribution of Occupied, Available, Reserved & Maintenance slots
          </p>

          <div className="h-60 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.parkingOccupancy}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.parkingOccupancy.map((entry, index) => (
                    <Cell key={`cell-occupancy-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Visitor Trend - Last 7 Days (Area Chart) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              2. Visitor Trend (Last 7 Days)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Daily visitor check-in volume over the past 7 days
          </p>

          <div className="h-60 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.visitorTrend7Days}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Visitors"
                  stroke="#0d9488"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Weekly Visitor Analytics (Bar Chart) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              3. Weekly Visitor Comparison
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Current Week vs. Previous Week daily entry comparison
          </p>

          <div className="h-60 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyComparison}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="currentWeek" name="Current Week" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="previousWeek" name="Previous Week" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Monthly Visitor Analytics - Last 12 Months (Line Chart) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between lg:col-span-2 xl:col-span-2">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <LineIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              4. Monthly Visitor & Booking Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            12-month timeline comparing Total Bookings, Completed Visits & Cancelled Passes
          </p>

          <div className="h-64 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrend12Months}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="completed" name="Completed Visits" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cancelled" name="Cancelled Visits" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Vehicle Statistics (Pie Chart) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Car className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              5. Vehicle Category Breakdown
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Registered vehicle distribution: Cars, Bikes, EV & Others
          </p>

          <div className="h-60 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.vehicleTypeStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.vehicleTypeStats.map((entry, index) => (
                    <Cell key={`cell-vehicle-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Violations Analytics (Bar Chart) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              6. Violations by Severity
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Incident severity breakdown (Low, Medium, High, Critical)
          </p>

          <div className="h-60 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.violationsSeverity}>
                <XAxis dataKey="severity" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="count" name="Violations" radius={[8, 8, 0, 0]}>
                  {data.violationsSeverity.map((entry, index) => (
                    <Cell key={`cell-violation-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7. Booking Status Distribution (Stacked Bar Chart) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between lg:col-span-2 xl:col-span-2">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <CalendarCheck className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              7. Booking Status Distribution
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Stacked breakdown of visitor booking lifecycle statuses (Pending, Approved, Rejected, Checked In, Checked Out, Cancelled)
          </p>

          <div className="h-64 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bookingStatusDistribution}>
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Approved" stackId="a" fill="#10b981" />
                <Bar dataKey="Checked In" stackId="a" fill="#06b6d4" />
                <Bar dataKey="Checked Out" stackId="a" fill="#6366f1" />
                <Bar dataKey="Rejected" stackId="a" fill="#ef4444" />
                <Bar dataKey="Cancelled" stackId="a" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
