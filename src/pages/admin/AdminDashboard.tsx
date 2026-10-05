import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Users,
  ShieldCheck,
  ParkingSquare,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Bell,
  AlertTriangle,
  Plus,
  UserCheck,
  ShieldAlert,
  Sliders,
  Car,
  ArrowRight,
  TrendingUp,
  Inbox,
  Check,
  ChevronRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { parkingService } from '../../services/parkingService';
import { userService } from '../../services/userService';
import { bookingService } from '../../services/bookingService';
import { violationService } from '../../services/violationService';
import { notificationService } from '../../services/notificationService';
import { vehicleService } from '../../services/vehicleService';
import { FirebaseStatusBanner } from '../../components/FirebaseStatusBanner';
import {
  ParkingSlot,
  UserProfile,
  VisitorBooking,
  Violation,
  NotificationItem,
  Vehicle
} from '../../types';

interface CombinedActivity {
  id: string;
  type: 'booking' | 'vehicle' | 'violation' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // State for realtime Firestore collections
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<VisitorBooking[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Loading tracking
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        setLoading(false);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    };

    // 1. Realtime Parking Slots Listener
    const unsubSlots = parkingService.subscribeToSlots((data) => {
      setSlots(data);
      checkLoaded();
    });

    // 2. Realtime Users Listener
    const unsubUsers = userService.subscribeToAllUsers((data) => {
      setUsers(data);
      checkLoaded();
    });

    // 3. Realtime Visitor Bookings Listener
    const unsubBookings = bookingService.subscribeToAllBookings((data) => {
      setBookings(data);
      checkLoaded();
    });

    // 4. Realtime Violations Listener
    const unsubViolations = violationService.subscribeToAllViolations((data) => {
      setViolations(data);
    });

    // 5. Realtime Notifications Listener
    const unsubNotifications = notificationService.subscribeToAllNotifications((data) => {
      setNotifications(data);
    });

    // 6. Realtime Vehicles Listener
    const unsubVehicles = vehicleService.subscribeToAllVehicles((data) => {
      setVehicles(data);
    });

    return () => {
      unsubSlots();
      unsubUsers();
      unsubBookings();
      unsubViolations();
      unsubNotifications();
      unsubVehicles();
    };
  }, []);

  // Compute Realtime Key Statistics
  const totalResidents = useMemo(
    () => users.filter((u) => u.role === 'Resident').length,
    [users]
  );
  const totalSecurity = useMemo(
    () => users.filter((u) => u.role === 'Security').length,
    [users]
  );
  const totalSlotsCount = slots.length;
  const occupiedSlotsCount = useMemo(
    () => slots.filter((s) => s.status === 'Occupied').length,
    [slots]
  );
  const availableSlotsCount = useMemo(
    () => slots.filter((s) => s.status === 'Available').length,
    [slots]
  );
  const activeBookingsCount = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === 'Approved' || b.status === 'Checked-In' || b.status === 'Pending'
      ).length,
    [bookings]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisitorEntriesCount = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.date === todayStr ||
          (b.createdAt && b.createdAt.startsWith(todayStr))
      ).length,
    [bookings, todayStr]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const pendingViolationsCount = useMemo(
    () =>
      violations.filter(
        (v) => v.status === 'Open' || v.status === 'Under Review'
      ).length,
    [violations]
  );

  // Compute Chart Data 1: Parking Occupancy (Occupied vs Available vs Reserved vs Maintenance)
  const parkingOccupancyChartData = useMemo(() => {
    const occupied = slots.filter((s) => s.status === 'Occupied').length;
    const available = slots.filter((s) => s.status === 'Available').length;
    const reserved = slots.filter((s) => s.status === 'Reserved').length;
    const maintenance = slots.filter((s) => s.status === 'Maintenance').length;

    return [
      { name: 'Occupied', value: occupied, color: '#10B981' },
      { name: 'Available', value: available, color: '#3B82F6' },
      { name: 'Reserved', value: reserved, color: '#F59E0B' },
      { name: 'Maintenance', value: maintenance, color: '#EF4444' }
    ].filter((item) => slots.length === 0 || item.value > 0 || totalSlotsCount > 0);
  }, [slots, totalSlotsCount]);

  // Compute Chart Data 2: Visitor Trend (Last 7 Days)
  const visitorTrendChartData = useMemo(() => {
    const days: { [key: string]: { day: string; dateStr: string; Bookings: number } } = {};
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      days[dateStr] = { day: dayLabel, dateStr, Bookings: 0 };
    }

    bookings.forEach((b) => {
      const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
      if (days[bDate]) {
        days[bDate].Bookings += 1;
      }
    });

    return Object.values(days);
  }, [bookings]);

  // Compute Chart Data 3: Violations by Severity
  const violationsBySeverityChartData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    violations.forEach((v) => {
      if (v.severity && counts[v.severity] !== undefined) {
        counts[v.severity] += 1;
      }
    });

    return [
      { severity: 'Low', count: counts.Low, fill: '#34D399' },
      { severity: 'Medium', count: counts.Medium, fill: '#FBBF24' },
      { severity: 'High', count: counts.High, fill: '#F87171' },
      { severity: 'Critical', count: counts.Critical, fill: '#DC2626' }
    ];
  }, [violations]);

  // Combine Realtime Recent Activity Feed (Newest first)
  const recentActivities = useMemo(() => {
    const list: CombinedActivity[] = [];

    bookings.slice(0, 10).forEach((b) => {
      list.push({
        id: `book-${b.bookingId}`,
        type: 'booking',
        title: `Visitor Booking: ${b.guestName}`,
        description: `Vehicle: ${b.vehicleNumber} (${b.vehicleType}) • Flat ${b.flatNumber || 'N/A'}`,
        timestamp: b.createdAt,
        status: b.status,
        icon: CalendarDays,
        color: 'text-teal-400 bg-teal-500/10'
      });
    });

    vehicles.slice(0, 10).forEach((v) => {
      list.push({
        id: `veh-${v.vehicleId}`,
        type: 'vehicle',
        title: `New Vehicle Registered: ${v.vehicleNumber}`,
        description: `${v.color} ${v.make} ${v.model} (${v.vehicleType})`,
        timestamp: v.createdAt || new Date().toISOString(),
        icon: Car,
        color: 'text-blue-400 bg-blue-500/10'
      });
    });

    violations.slice(0, 10).forEach((v) => {
      list.push({
        id: `viol-${v.violationId}`,
        type: 'violation',
        title: `Violation Flagged: ${v.vehicleNumber}`,
        description: `${v.description || 'Parking rule breach'} (${v.severity} Severity)`,
        timestamp: v.createdAt,
        status: v.status,
        icon: ShieldAlert,
        color: 'text-rose-400 bg-rose-500/10'
      });
    });

    notifications.slice(0, 10).forEach((n) => {
      list.push({
        id: `notif-${n.notificationId}`,
        type: 'notification',
        title: n.title,
        description: n.message,
        timestamp: n.createdAt,
        icon: Bell,
        color: 'text-purple-400 bg-purple-500/10'
      });
    });

    list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return list.slice(0, 8);
  }, [bookings, vehicles, violations, notifications]);

  // Handler to mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  };

  return (
    <div className="space-y-6 pb-12">
      <FirebaseStatusBanner />

      {/* Admin Command Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin Command Hub</span>
              </span>
              {lastRefreshed && (
                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin-slow" />
                  <span>Realtime Live</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Society Operations & Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Realtime monitoring of society slots, resident directories, visitor pass activity, and enforcement logs directly synced with Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/admin/slots"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Parking Slot</span>
            </Link>
            <Link
              to="/admin/users"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Users Directory</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid (9 Realtime Metrics) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse h-28 flex flex-col justify-between"
            >
              <div className="h-3 w-28 bg-slate-800 rounded" />
              <div className="h-7 w-16 bg-slate-800 rounded mt-2" />
              <div className="h-2.5 w-36 bg-slate-800/80 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"
        >
          {/* 1. Total Residents */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Residents</p>
              <h3 className="text-2xl font-black text-white mt-1.5">{totalResidents}</h3>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">
                Verified Resident Profiles
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* 2. Total Security Staff */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Security Staff</p>
              <h3 className="text-2xl font-black text-white mt-1.5">{totalSecurity}</h3>
              <p className="text-[11px] text-teal-400 font-medium mt-1">
                Gate Security Officers
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* 3. Total Parking Slots */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Parking Slots</p>
              <h3 className="text-2xl font-black text-white mt-1.5">{totalSlotsCount}</h3>
              <p className="text-[11px] text-purple-400 font-medium mt-1">
                Allocated across all blocks
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ParkingSquare className="w-5 h-5" />
            </div>
          </div>

          {/* 4. Occupied Slots */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Occupied Slots</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1.5">
                {occupiedSlotsCount}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {totalSlotsCount > 0
                  ? `${Math.round((occupiedSlotsCount / totalSlotsCount) * 100)}% occupancy rate`
                  : '0% occupancy'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* 5. Available Slots */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Available Slots</p>
              <h3 className="text-2xl font-black text-blue-400 mt-1.5">
                {availableSlotsCount}
              </h3>
              <p className="text-[11px] text-blue-300 font-medium mt-1">
                Ready for assignment
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ParkingSquare className="w-5 h-5" />
            </div>
          </div>

          {/* 6. Active Visitor Bookings */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Active Visitor Bookings</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1.5">
                {activeBookingsCount}
              </h3>
              <p className="text-[11px] text-amber-300 font-medium mt-1">
                Pending or active passes
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          {/* 7. Today's Visitor Entries */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Today's Visitor Entries</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-1.5">
                {todayVisitorEntriesCount}
              </h3>
              <p className="text-[11px] text-cyan-300 font-medium mt-1">
                Scheduled / Logged today
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* 8. Unread Notifications */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Unread Notifications</p>
              <h3 className="text-2xl font-black text-purple-400 mt-1.5">
                {unreadNotificationsCount}
              </h3>
              <p className="text-[11px] text-purple-300 font-medium mt-1">
                System alerts requiring review
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 relative">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              )}
            </div>
          </div>

          {/* 9. Pending Violations */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Pending Violations</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1.5">
                {pendingViolationsCount}
              </h3>
              <p className="text-[11px] text-rose-300 font-medium mt-1">
                Open enforcement tickets
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Admin Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/admin/slots"
            className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-400 transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Add Parking Slot</span>
          </Link>

          <Link
            to="/admin/users"
            className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-teal-950/30 border border-slate-800 hover:border-teal-500/40 text-slate-200 hover:text-teal-400 transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Manage Users</span>
          </Link>

          <Link
            to="/security/violations"
            className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/40 text-slate-200 hover:text-rose-400 transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">View Violations</span>
          </Link>

          <Link
            to="/admin/settings"
            className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-amber-400 transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Visitor Rules</span>
          </Link>

          <Link
            to="/notifications"
            className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-purple-400 transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Notifications</span>
          </Link>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart 1: Parking Occupancy (Donut Distribution) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                <span>Parking Occupancy</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">
                {totalSlotsCount} Total
              </span>
            </div>
            <p className="text-xs text-slate-400">Occupied vs Available Slots</p>

            {totalSlotsCount === 0 ? (
              <div className="h-56 my-4 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl text-center p-4">
                <Inbox className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No parking slots configured yet.</p>
                <Link
                  to="/admin/slots"
                  className="mt-2 text-xs font-bold text-emerald-400 hover:underline"
                >
                  Create Parking Slots
                </Link>
              </div>
            ) : (
              <div className="h-56 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={parkingOccupancyChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {parkingOccupancyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderColor: '#1e293b',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-slate-800">
            {parkingOccupancyChartData.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center space-x-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </span>
                <span className="font-bold text-white">{p.value} slots</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Visitor Trend (Last 7 Days Bar Chart) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>Visitor Booking Trends (Last 7 Days)</span>
              </h3>
              <Link
                to="/admin/analytics"
                className="text-xs font-semibold text-purple-400 hover:underline"
              >
                Detailed Analytics →
              </Link>
            </div>
            <p className="text-xs text-slate-400">Daily count of visitor pass requests</p>

            {bookings.length === 0 ? (
              <div className="h-60 my-4 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl text-center p-4">
                <CalendarDays className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No visitor passes generated yet.</p>
              </div>
            ) : (
              <div className="h-60 my-2 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitorTrendChartData}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderColor: '#1e293b',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="Bookings" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart 3 & Violations by Severity */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Enforcement Violations by Severity</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Realtime violation severity breakdown</p>
          </div>
          <Link
            to="/security/violations"
            className="text-xs font-semibold text-rose-400 hover:underline"
          >
            Manage Violations →
          </Link>
        </div>

        {violations.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-medium">No rule violations reported!</p>
            <p className="text-[11px] text-slate-500 mt-1">
              All resident and visitor vehicles are currently compliant.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {violationsBySeverityChartData.map((item) => (
              <div
                key={item.severity}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">
                    {item.severity}
                  </span>
                  <span className="text-xl font-black text-white mt-1 block">
                    {item.count}
                  </span>
                </div>
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Grid: Recent Activity Feed & Realtime Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Realtime Activity Feed */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Realtime Activity Stream</span>
              </h3>
              <span className="text-[11px] text-slate-400">Live Updates</span>
            </div>

            {recentActivities.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center my-4">
                <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No activity logged yet in Firestore.</p>
              </div>
            ) : (
              <div className="space-y-3 my-2">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-3"
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${act.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{act.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {act.description}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {act.status && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {act.status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Realtime Notifications Panel */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">System Notifications</h3>
              </div>
              {unreadNotificationsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {unreadNotificationsCount} Unread
                </span>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center my-4">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No system notifications present.</p>
              </div>
            ) : (
              <div className="space-y-3 my-2">
                {notifications.slice(0, 6).map((notif) => (
                  <div
                    key={notif.notificationId}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 ${
                      notif.read
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                        : 'bg-purple-950/20 border-purple-500/30'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{notif.title}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif.notificationId)}
                        className="p-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-center">
            <Link
              to="/notifications"
              className="text-xs font-bold text-purple-400 hover:underline inline-flex items-center space-x-1"
            >
              <span>View All System Notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
