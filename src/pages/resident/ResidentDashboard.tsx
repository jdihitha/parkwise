import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  ParkingSquare,
  CalendarPlus,
  BookCheck,
  Bell,
  Clock,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  User,
  Activity,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  ArrowUpRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { parkingService } from '../../services/parkingService';
import { bookingService } from '../../services/bookingService';
import { vehicleService } from '../../services/vehicleService';
import { notificationService } from '../../services/notificationService';
import { violationService } from '../../services/violationService';
import { visitorLogService } from '../../services/visitorLogService';
import { FirebaseStatusBanner } from '../../components/FirebaseStatusBanner';
import { EmptyState } from '../../components/EmptyState';
import {
  ParkingSlot,
  VisitorBooking,
  Vehicle,
  NotificationItem,
  Violation,
  VisitorLog
} from '../../types';

export const ResidentDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Realtime Data States
  const [assignedSlots, setAssignedSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<VisitorBooking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [todayVisitors, setTodayVisitors] = useState<VisitorLog[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Tab for Recent Activity feed
  const [activityTab, setActivityTab] = useState<'All' | 'Bookings' | 'Checkins' | 'Notifications' | 'Violations'>('All');

  useEffect(() => {
    if (!userProfile?.uid) return;

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 4) setLoading(false);
    };

    // 1. Subscribe to Allocated Parking Slots
    const unsubSlots = parkingService.subscribeToSlots((allSlots) => {
      const mySlots = allSlots.filter((s) => s.assignedResident === userProfile.uid);
      setAssignedSlots(mySlots);
      checkLoaded();
    });

    // 2. Subscribe to Resident Visitor Bookings
    const unsubBookings = bookingService.subscribeToUserBookings(userProfile.uid, (data) => {
      setBookings(data);
      checkLoaded();
    });

    // 3. Subscribe to Resident Registered Vehicles
    const unsubVehicles = vehicleService.subscribeToUserVehicles(userProfile.uid, (data) => {
      setVehicles(data);
      checkLoaded();
    });

    // 4. Subscribe to Resident Notifications
    const unsubNotifs = notificationService.subscribeToUserNotifications(userProfile.uid, (data) => {
      setNotifications(data);
      checkLoaded();
    });

    // 5. Subscribe to Resident Violations
    const unsubViolations = violationService.subscribeToUserViolations(userProfile.uid, (data) => {
      setViolations(data);
    });

    // 6. Subscribe to Today's Visitors Check-in Logs for Flat
    const unsubLogs = visitorLogService.subscribeToResidentLogs(
      userProfile.uid,
      userProfile.flatNumber || '',
      (data) => {
        setTodayVisitors(data);
      }
    );

    return () => {
      unsubSlots();
      unsubBookings();
      unsubVehicles();
      unsubNotifs();
      unsubViolations();
      unsubLogs();
    };
  }, [userProfile?.uid, userProfile?.flatNumber]);

  // Derived Statistics
  const activeBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'Approved' || b.status === 'Checked-In' || b.status === 'Pending');
  }, [bookings]);

  const upcomingPasses = useMemo(() => {
    return bookings.filter((b) => b.status === 'Approved' || b.status === 'Pending');
  }, [bookings]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const activeViolations = useMemo(() => {
    return violations.filter((v) => v.status === 'Pending' || v.status === 'In Review' || v.status === 'Open' || v.status === 'Fined');
  }, [violations]);

  // Unified Recent Activity Stream
  const activityFeed = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'Booking' | 'Checkin' | 'Notification' | 'Violation';
      title: string;
      subtitle: string;
      timestamp: string;
      statusBadge?: string;
      raw: any;
    }> = [];

    // Add Bookings
    bookings.forEach((b) => {
      list.push({
        id: `b-${b.bookingId}`,
        type: 'Booking',
        title: `Visitor Pass: ${b.guestName}`,
        subtitle: `Vehicle ${b.vehicleNumber} • Date: ${b.date} (${b.startTime})`,
        timestamp: b.createdAt || new Date().toISOString(),
        statusBadge: b.status,
        raw: b
      });
    });

    // Add Visitor Check-ins
    todayVisitors.forEach((v) => {
      list.push({
        id: `vlog-${v.logId}`,
        type: 'Checkin',
        title: `Visitor Check-In: ${v.guestName}`,
        subtitle: `Gate check-in at flat ${v.flatNumber} • Vehicle ${v.vehicleNumber}`,
        timestamp: v.entryTime,
        statusBadge: v.status,
        raw: v
      });
    });

    // Add Notifications
    notifications.forEach((n) => {
      list.push({
        id: `notif-${n.notificationId}`,
        type: 'Notification',
        title: n.title,
        subtitle: n.message,
        timestamp: n.createdAt,
        statusBadge: n.read ? 'Read' : 'Unread',
        raw: n
      });
    });

    // Add Violations
    violations.forEach((viol) => {
      list.push({
        id: `viol-${viol.violationId}`,
        type: 'Violation',
        title: `Violation Alert: ${viol.vehicleNumber}`,
        subtitle: viol.description || 'Parking policy violation',
        timestamp: viol.createdAt,
        statusBadge: viol.status,
        raw: viol
      });
    });

    // Sort by timestamp desc
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [bookings, todayVisitors, notifications, violations]);

  const filteredActivity = useMemo(() => {
    if (activityTab === 'All') return activityFeed;
    if (activityTab === 'Bookings') return activityFeed.filter((a) => a.type === 'Booking');
    if (activityTab === 'Checkins') return activityFeed.filter((a) => a.type === 'Checkin');
    if (activityTab === 'Notifications') return activityFeed.filter((a) => a.type === 'Notification');
    if (activityTab === 'Violations') return activityFeed.filter((a) => a.type === 'Violation');
    return activityFeed;
  }, [activityFeed, activityTab]);

  return (
    <div className="space-y-6 pb-12">
      <FirebaseStatusBanner />

      {/* Hero Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Resident Portal • Flat {userProfile?.flatNumber || 'N/A'}</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-200 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-indigo-300 animate-ping" />
                <span>Firestore Realtime Sync</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {userProfile?.name || 'Resident'}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl leading-relaxed">
              Track allocated parking, manage registered vehicles, request guest gate passes, and monitor security alerts in real time.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => navigate('/visitor-booking')}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-indigo-600" />
              <span>Book Visitor Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate('/visitor-booking')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center text-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <span>Book Visitor Pass</span>
          </button>

          <button
            onClick={() => navigate('/my-parking')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center text-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <ParkingSquare className="w-4 h-4" />
            </div>
            <span>View My Parking</span>
          </button>

          <button
            onClick={() => navigate('/my-vehicles')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center text-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <Car className="w-4 h-4" />
            </div>
            <span>Manage Vehicles</span>
          </button>

          <button
            onClick={() => navigate('/my-bookings')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center text-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <BookCheck className="w-4 h-4" />
            </div>
            <span>My Bookings</span>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center text-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition-all group relative cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
            </div>
            <span>Notifications</span>
            {unreadNotifications.length > 0 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center text-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition-all group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <User className="w-4 h-4" />
            </div>
            <span>Profile Settings</span>
          </button>
        </div>
      </div>

      {/* REALTIME STATS CARDS GRID (7 Key Metrics Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned Parking Slot */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Assigned Parking Slot</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {assignedSlots.length > 0 ? assignedSlots.map((s) => s.slotNumber).join(', ') : 'None'}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              {assignedSlots.length > 0 ? `${assignedSlots[0].building} • Floor ${assignedSlots[0].floor}` : 'Contact Property Admin'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ParkingSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Registered Vehicles */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Registered Vehicles</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {vehicles.length}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
              {vehicles.length > 0 ? `${vehicles[0].vehicleNumber} (${vehicles[0].vehicleType})` : 'No Vehicles Added'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Upcoming Visitor Bookings */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Upcoming Visitor Passes</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {upcomingPasses.length}
            </h3>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold mt-1">
              Approved or Pending Pass
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
            <BookCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Today's Visitors */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Today's Visitors Check-In</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {todayVisitors.length}
            </h3>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold mt-1">
              Gate Entries Logged Today
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 5: Unread Notifications */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Unread Notifications</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {unreadNotifications.length}
            </h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
              {unreadNotifications.length > 0 ? 'Requires your attention' : 'All clear'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 relative">
            <Bell className="w-6 h-6" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </div>
        </div>

        {/* Card 6: Active Violations */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Active Violations</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {activeViolations.length}
            </h3>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
              {activeViolations.length > 0 ? 'Unresolved Parking Alert' : 'Clean Compliance'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Card 7: Quick Statistics */}
        <div className="sm:col-span-2 lg:col-span-2 p-5 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-sm flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
              Quick Statistics
            </span>
            <div className="flex items-center space-x-6 mt-2">
              <div>
                <span className="text-xl font-black text-white block">{bookings.length}</span>
                <span className="text-[10px] text-slate-400">Total Guest Passes</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <span className="text-xl font-black text-white block">{assignedSlots.length}</span>
                <span className="text-[10px] text-slate-400">Allocated Slots</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <span className="text-xl font-black text-emerald-400 block">{todayVisitors.length}</span>
                <span className="text-[10px] text-slate-400">Today's Guests</span>
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN MAIN CONTENT */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Assigned Slot & Active Visitor Passes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Parking Slot Details */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <ParkingSquare className="w-5 h-5 text-emerald-500" />
                <span>My Allocated Parking Slot</span>
              </h3>
              <Link
                to="/my-parking"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {assignedSlots.length === 0 ? (
              <EmptyState
                icon={ParkingSquare}
                title="No Parking Slot Allocated Yet"
                description="Society administration has not assigned a designated parking slot to your flat profile yet. Contact property management."
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {assignedSlots.map((slot) => (
                  <div
                    key={slot.slotId}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                        {slot.slotNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          slot.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <p>
                        <strong className="text-slate-800 dark:text-slate-200">Building / Tower:</strong> {slot.building}
                      </p>
                      <p>
                        <strong className="text-slate-800 dark:text-slate-200">Floor Level:</strong> {slot.floor}
                      </p>
                      <p>
                        <strong className="text-slate-800 dark:text-slate-200">Slot Type:</strong> {slot.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Visitors Realtime Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-cyan-500" />
                <span>Today's Visitors Check-In Logs</span>
              </h3>
              <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2.5 py-1 rounded-full">
                Realtime Gate Feed
              </span>
            </div>

            {todayVisitors.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No Gate Entries Logged Today"
                description="No visitor check-ins have been recorded at the gate for your flat today."
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {todayVisitors.slice(0, 5).map((v) => (
                  <div key={v.logId} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {v.guestName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>Vehicle: {v.vehicleNumber}</span>
                        <span>•</span>
                        <span>Flat: {v.flatNumber}</span>
                        <span>•</span>
                        <span>Entry: {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        v.status === 'Checked In' || v.status === 'Active'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Violations & Unified Recent Activity */}
        <div className="space-y-6">
          {/* Active Violations Alerts Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>My Active Violations</span>
              </h3>
            </div>

            {activeViolations.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Clean Compliance Record
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  No active parking violations reported for your vehicles.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeViolations.map((viol) => (
                  <div
                    key={viol.violationId}
                    className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300">
                      <span>Vehicle: {viol.vehicleNumber}</span>
                      <span className="px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-[10px]">
                        {viol.status}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-snug">
                      {viol.description}
                    </p>
                    {viol.fineAmount && (
                      <p className="text-rose-600 dark:text-rose-400 font-extrabold text-[11px]">
                        Fine Imposed: ₹{viol.fineAmount}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unified Recent Activity Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                <span>Recent Activity</span>
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold overflow-x-auto">
              {(['All', 'Bookings', 'Checkins', 'Notifications', 'Violations'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivityTab(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activityTab === tab
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Stream List */}
            {filteredActivity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No Activity Logged"
                description="Activity logs will populate as actions occur in real time."
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
                {filteredActivity.slice(0, 8).map((act) => (
                  <div key={act.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                        {act.title}
                      </span>
                      {act.statusBadge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {act.statusBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {act.subtitle}
                    </p>
                    <span className="text-[9px] text-slate-400 block pt-0.5">
                      {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
