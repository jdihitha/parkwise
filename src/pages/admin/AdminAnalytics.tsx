import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Shield,
  UserCheck,
  SquareParking,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  Car,
  LogIn,
  LogOut,
  CalendarCheck,
  ShieldAlert,
  Bell,
  Download,
  Printer,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw
} from 'lucide-react';

import { userService } from '../../services/userService';
import { parkingService } from '../../services/parkingService';
import { vehicleService } from '../../services/vehicleService';
import { bookingService } from '../../services/bookingService';
import { visitorLogService } from '../../services/visitorLogService';
import { violationService } from '../../services/violationService';
import { notificationService } from '../../services/notificationService';

import {
  UserProfile,
  ParkingSlot,
  Vehicle,
  VisitorBooking,
  VisitorLog,
  Violation,
  NotificationItem
} from '../../types';

import { StatCard } from '../../components/analytics/StatCard';
import { QuickInsightsGrid, QuickInsightsData } from '../../components/analytics/QuickInsightsGrid';
import { AnalyticsChartsGrid, ChartDataSets } from '../../components/analytics/AnalyticsChartsGrid';
import { RecentActivityFeed, ActivityItem } from '../../components/analytics/RecentActivityFeed';
import { exportAnalyticsToCSV, printAnalyticsReport } from '../../utils/analyticsExport';

type TimeRangeFilter =
  | 'Today'
  | 'This Week'
  | 'This Month'
  | 'Last 3 Months'
  | 'Last 6 Months'
  | 'Last Year'
  | 'Custom';

export const AdminAnalytics: React.FC = () => {
  // Realtime Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [visitorBookings, setVisitorBookings] = useState<VisitorBooking[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter States
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('This Month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Setup Realtime Listeners with onSnapshot
  useEffect(() => {
    let unsubs: Array<() => void> = [];
    setLoading(true);

    try {
      const u1 = userService.subscribeToAllUsers((data) => setUsers(data));
      const u2 = parkingService.subscribeToSlots((data) => setParkingSlots(data));
      const u3 = vehicleService.subscribeToAllVehicles((data) => setVehicles(data));
      const u4 = bookingService.subscribeToAllBookings((data) => setVisitorBookings(data));
      const u5 = visitorLogService.subscribeToAllLogs((data) => setVisitorLogs(data));
      const u6 = violationService.subscribeToAllViolations((data) => setViolations(data));
      const u7 = notificationService.subscribeToAllNotifications((data) => setNotifications(data));

      unsubs = [u1, u2, u3, u4, u5, u6, u7];
      setLoading(false);
    } catch (err) {
      console.error('Error attaching realtime analytics listeners:', err);
      setErrorMsg('Failed to establish realtime connection with Firestore.');
      setLoading(false);
    }

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, []);

  // Filter Helper Function
  const dateFilterRange = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date(2100, 0, 1);

    if (timeRange === 'Today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (timeRange === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
    } else if (timeRange === 'This Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    } else if (timeRange === 'Last 3 Months') {
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      end = new Date();
    } else if (timeRange === 'Last 6 Months') {
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      end = new Date();
    } else if (timeRange === 'Last Year') {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date();
    } else if (timeRange === 'Custom' && customStartDate && customEndDate) {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [timeRange, customStartDate, customEndDate]);

  const isWithinRange = (dateString?: string) => {
    if (!dateString) return false;
    try {
      const d = new Date(dateString);
      return d >= dateFilterRange.start && d <= dateFilterRange.end;
    } catch {
      return false;
    }
  };

  // Filtered Data Sets
  const filteredBookings = useMemo(
    () => visitorBookings.filter((b) => isWithinRange(b.createdAt || b.date)),
    [visitorBookings, dateFilterRange]
  );

  const filteredLogs = useMemo(
    () => visitorLogs.filter((l) => isWithinRange(l.entryTime)),
    [visitorLogs, dateFilterRange]
  );

  const filteredViolations = useMemo(
    () => violations.filter((v) => isWithinRange(v.createdAt)),
    [violations, dateFilterRange]
  );

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 17 Overview Statistics
  const overviewStats = useMemo(() => {
    const residents = users.filter((u) => u.role === 'Resident').length;
    const security = users.filter((u) => u.role === 'Security').length;
    const admins = users.filter((u) => u.role === 'Admin').length;

    const totalSlots = parkingSlots.length;
    const occupiedSlots = parkingSlots.filter((s) => s.status === 'Occupied').length;
    const availableSlots = parkingSlots.filter((s) => s.status === 'Available').length;
    const reservedSlots = parkingSlots.filter((s) => s.status === 'Reserved').length;
    const maintenanceSlots = parkingSlots.filter(
      (s) => s.status === 'Maintenance' || (s.status as string) === 'Under Maintenance'
    ).length;

    const totalVehicles = vehicles.length;

    // Today metrics
    const todayVisitors = visitorLogs.filter(
      (l) => l.entryTime && l.entryTime.startsWith(todayStr)
    ).length;
    const todayCheckIns = visitorLogs.filter(
      (l) => l.entryTime && l.entryTime.startsWith(todayStr)
    ).length;
    const todayCheckOuts = visitorLogs.filter(
      (l) => l.exitTime && l.exitTime.startsWith(todayStr)
    ).length;

    // Bookings metrics
    const pendingBookings = visitorBookings.filter((b) => b.status === 'Pending').length;
    const activeBookings = visitorBookings.filter(
      (b) =>
        b.status === 'Approved' ||
        b.status === 'Checked In' ||
        (b.status as string) === 'Checked-In'
    ).length;

    // Violations metrics
    const resolvedViolations = violations.filter((v) => v.status === 'Resolved').length;
    const pendingViolations = violations.filter(
      (v) =>
        v.status === 'Pending' ||
        v.status === 'Open' ||
        v.status === 'In Review' ||
        (v.status as string) === 'Under Review'
    ).length;

    // Notifications metrics
    const unreadNotifications = notifications.filter((n) => !n.read).length;

    return {
      residents,
      security,
      admins,
      totalSlots,
      occupiedSlots,
      availableSlots,
      reservedSlots,
      maintenanceSlots,
      totalVehicles,
      todayVisitors,
      todayCheckIns,
      todayCheckOuts,
      pendingBookings,
      activeBookings,
      resolvedViolations,
      pendingViolations,
      unreadNotifications
    };
  }, [users, parkingSlots, vehicles, visitorBookings, visitorLogs, violations, notifications, todayStr]);

  // Quick Operational Insights Calculation
  const quickInsights: QuickInsightsData = useMemo(() => {
    // 1. Peak Visitor Day
    const dayCounts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    };
    visitorLogs.forEach((l) => {
      if (l.entryTime) {
        const d = new Date(l.entryTime);
        if (!isNaN(d.getTime())) {
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
      }
    });
    let maxDay = 'N/A';
    let maxDayVal = -1;
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxDayVal && count > 0) {
        maxDayVal = count;
        maxDay = `${day} (${count})`;
      }
    });

    // 2. Most Used Parking Floor
    const floorCounts: Record<string, number> = {};
    parkingSlots.forEach((s) => {
      if (s.floor && s.status === 'Occupied') {
        floorCounts[s.floor] = (floorCounts[s.floor] || 0) + 1;
      }
    });
    let topFloor = 'N/A';
    let topFloorCount = -1;
    Object.entries(floorCounts).forEach(([fl, c]) => {
      if (c > topFloorCount) {
        topFloorCount = c;
        topFloor = `Floor ${fl}`;
      }
    });

    // 3. Most Used Parking Building
    const bldgCounts: Record<string, number> = {};
    parkingSlots.forEach((s) => {
      if (s.building && s.status === 'Occupied') {
        bldgCounts[s.building] = (bldgCounts[s.building] || 0) + 1;
      }
    });
    let topBldg = 'N/A';
    let topBldgCount = -1;
    Object.entries(bldgCounts).forEach(([b, c]) => {
      if (c > topBldgCount) {
        topBldgCount = c;
        topBldg = b;
      }
    });

    // 4. Most Common Vehicle Type
    const vehTypeCounts: Record<string, number> = {};
    vehicles.forEach((v) => {
      if (v.vehicleType) {
        vehTypeCounts[v.vehicleType] = (vehTypeCounts[v.vehicleType] || 0) + 1;
      }
    });
    let topVeh = 'N/A';
    let topVehCount = -1;
    Object.entries(vehTypeCounts).forEach(([vt, c]) => {
      if (c > topVehCount) {
        topVehCount = c;
        topVeh = `${vt} (${c})`;
      }
    });

    // 5. Most Frequent Violation
    const violTypeCounts: Record<string, number> = {};
    violations.forEach((v) => {
      const typeKey = v.violationType || v.description || 'General Violation';
      violTypeCounts[typeKey] = (violTypeCounts[typeKey] || 0) + 1;
    });
    let topViol = 'N/A';
    let topViolCount = -1;
    Object.entries(violTypeCounts).forEach(([vt, c]) => {
      if (c > topViolCount) {
        topViolCount = c;
        topViol = vt.length > 20 ? `${vt.substring(0, 18)}...` : vt;
      }
    });

    // 6. Average Visitor Duration
    let totalMinutes = 0;
    let durationCount = 0;
    visitorLogs.forEach((l) => {
      if (l.entryTime && l.exitTime) {
        const start = new Date(l.entryTime).getTime();
        const end = new Date(l.exitTime).getTime();
        if (end > start) {
          totalMinutes += (end - start) / (1000 * 60);
          durationCount++;
        }
      }
    });
    let avgVisitorDuration = 'N/A';
    if (durationCount > 0) {
      const avgMins = Math.round(totalMinutes / durationCount);
      const hours = Math.floor(avgMins / 60);
      const mins = avgMins % 60;
      avgVisitorDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
    }

    // 7. Average Parking Utilization
    let avgParkingUtilization = '0%';
    if (parkingSlots.length > 0) {
      const occupied = parkingSlots.filter((s) => s.status === 'Occupied').length;
      const rate = Math.round((occupied / parkingSlots.length) * 100);
      avgParkingUtilization = `${rate}%`;
    }

    return {
      peakVisitorDay: maxDay,
      mostUsedFloor: topFloor,
      mostUsedBuilding: topBldg,
      mostCommonVehicleType: topVeh,
      mostFrequentViolation: topViol,
      avgVisitorDuration,
      avgParkingUtilization
    };
  }, [visitorLogs, parkingSlots, vehicles, violations]);

  // Chart Data Sets Calculation
  const chartDataSets: ChartDataSets = useMemo(() => {
    // 1. Parking Occupancy
    const parkingOccupancy = [
      { name: 'Occupied', value: overviewStats.occupiedSlots, color: '#10b981' },
      { name: 'Available', value: overviewStats.availableSlots, color: '#06b6d4' },
      { name: 'Reserved', value: overviewStats.reservedSlots, color: '#6366f1' },
      { name: 'Maintenance', value: overviewStats.maintenanceSlots, color: '#f59e0b' }
    ];

    // 2. Visitor Trend (Last 7 Days)
    const daysArr: string[] = [];
    const trendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      daysArr.push(dateKey);
      trendMap[dateKey] = 0;
    }
    visitorLogs.forEach((l) => {
      if (l.entryTime) {
        const key = l.entryTime.split('T')[0];
        if (trendMap[key] !== undefined) {
          trendMap[key]++;
        }
      }
    });
    const visitorTrend7Days = daysArr.map((key) => {
      const d = new Date(key);
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { day: dayLabel, count: trendMap[key] || 0 };
    });

    // 3. Weekly Visitor Comparison (Mon-Sun comparison of current vs previous week)
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentWeekCounts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const prevWeekCounts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    const now = new Date();
    const currDay = now.getDay();
    const currentMon = new Date(now);
    currentMon.setDate(now.getDate() - (currDay === 0 ? 6 : currDay - 1));
    currentMon.setHours(0, 0, 0, 0);

    const prevMon = new Date(currentMon);
    prevMon.setDate(currentMon.getDate() - 7);

    visitorLogs.forEach((l) => {
      if (l.entryTime) {
        const d = new Date(l.entryTime);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (d >= currentMon && d <= now) {
          if (currentWeekCounts[dayName] !== undefined) currentWeekCounts[dayName]++;
        } else if (d >= prevMon && d < currentMon) {
          if (prevWeekCounts[dayName] !== undefined) prevWeekCounts[dayName]++;
        }
      }
    });

    const weeklyComparison = daysOfWeek.map((day) => ({
      day,
      currentWeek: currentWeekCounts[day] || 0,
      previousWeek: prevWeekCounts[day] || 0
    }));

    // 4. Monthly Visitor Analytics (Last 12 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { bookings: number; completed: number; cancelled: number }> = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      monthlyMap[mKey] = { bookings: 0, completed: 0, cancelled: 0 };
    }

    visitorBookings.forEach((b) => {
      if (b.createdAt) {
        const d = new Date(b.createdAt);
        if (!isNaN(d.getTime())) {
          const mKey = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
          if (monthlyMap[mKey]) {
            monthlyMap[mKey].bookings++;
            if (b.status === 'Checked Out' || (b.status as string) === 'Completed') {
              monthlyMap[mKey].completed++;
            } else if (b.status === 'Cancelled' || b.status === 'Rejected') {
              monthlyMap[mKey].cancelled++;
            }
          }
        }
      }
    });

    const monthlyTrend12Months = Object.keys(monthlyMap).map((month) => ({
      month,
      bookings: monthlyMap[month].bookings,
      completed: monthlyMap[month].completed,
      cancelled: monthlyMap[month].cancelled
    }));

    // 5. Vehicle Type Statistics
    const vCounts: Record<string, number> = { Cars: 0, Bikes: 0, EV: 0, Other: 0 };
    vehicles.forEach((v) => {
      const t = (v.vehicleType || '').toLowerCase();
      if (t.includes('car') || t.includes('suv')) vCounts.Cars++;
      else if (t.includes('bike') || t.includes('scooter')) vCounts.Bikes++;
      else if (t.includes('ev') || t.includes('electric')) vCounts.EV++;
      else vCounts.Other++;
    });

    const vehicleTypeStats = [
      { name: 'Cars', value: vCounts.Cars, color: '#3b82f6' },
      { name: 'Bikes', value: vCounts.Bikes, color: '#10b981' },
      { name: 'EV', value: vCounts.EV, color: '#8b5cf6' },
      { name: 'Other', value: vCounts.Other, color: '#f59e0b' }
    ];

    // 6. Violations Analytics (Severity)
    const sevCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    violations.forEach((v) => {
      if (v.severity && sevCounts[v.severity] !== undefined) {
        sevCounts[v.severity]++;
      } else {
        sevCounts.Medium++;
      }
    });

    const violationsSeverity = [
      { severity: 'Low', count: sevCounts.Low, color: '#10b981' },
      { severity: 'Medium', count: sevCounts.Medium, color: '#f59e0b' },
      { severity: 'High', count: sevCounts.High, color: '#f97316' },
      { severity: 'Critical', count: sevCounts.Critical, color: '#ef4444' }
    ];

    // 7. Booking Status Distribution
    const statusMap: Record<
      string,
      {
        Pending: number;
        Approved: number;
        Rejected: number;
        'Checked In': number;
        'Checked Out': number;
        Cancelled: number;
      }
    > = {
      'This Period': { Pending: 0, Approved: 0, Rejected: 0, 'Checked In': 0, 'Checked Out': 0, Cancelled: 0 },
      'All Time': { Pending: 0, Approved: 0, Rejected: 0, 'Checked In': 0, 'Checked Out': 0, Cancelled: 0 }
    };

    visitorBookings.forEach((b) => {
      const s = b.status || 'Pending';
      const isFiltered = isWithinRange(b.createdAt || b.date);

      const targetKey =
        s === 'Checked-In'
          ? 'Checked In'
          : s === 'Completed'
          ? 'Checked Out'
          : (s as keyof (typeof statusMap)['All Time']);

      if (targetKey in statusMap['All Time']) {
        statusMap['All Time'][targetKey]++;
        if (isFiltered) {
          statusMap['This Period'][targetKey]++;
        }
      }
    });

    const bookingStatusDistribution = [
      { period: 'Selected Filter', ...statusMap['This Period'] },
      { period: 'All Time Records', ...statusMap['All Time'] }
    ];

    return {
      parkingOccupancy,
      visitorTrend7Days,
      weeklyComparison,
      monthlyTrend12Months,
      vehicleTypeStats,
      violationsSeverity,
      bookingStatusDistribution
    };
  }, [
    overviewStats,
    visitorLogs,
    visitorBookings,
    vehicles,
    violations,
    isWithinRange
  ]);

  // Realtime Activity Feed Stream (Combined)
  const activityStream: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];

    // Bookings
    visitorBookings.forEach((b) => {
      list.push({
        id: `act-book-${b.bookingId}`,
        type: 'Booking',
        title: `Visitor Pass: ${b.guestName}`,
        description: `Pass for ${b.guestName} (${b.vehicleNumber}) on ${b.date}`,
        timestamp: b.createdAt || new Date().toISOString(),
        status: b.status,
        actorName: b.residentName
      });
    });

    // Visitor Logs (Entries & Exits)
    visitorLogs.forEach((l) => {
      list.push({
        id: `act-log-entry-${l.logId}`,
        type: 'Entry',
        title: `Gate Check-in: ${l.guestName}`,
        description: `Entered in plate ${l.vehicleNumber} for Flat ${l.flatNumber}`,
        timestamp: l.entryTime,
        status: l.status,
        actorName: l.securityName
      });

      if (l.exitTime) {
        list.push({
          id: `act-log-exit-${l.logId}`,
          type: 'Exit',
          title: `Gate Check-out: ${l.guestName}`,
          description: `Exited society gate in vehicle ${l.vehicleNumber}`,
          timestamp: l.exitTime,
          status: 'Checked Out',
          actorName: l.securityName
        });
      }
    });

    // Violations
    violations.forEach((v) => {
      list.push({
        id: `act-viol-${v.violationId}`,
        type: 'Violation',
        title: `Security Notice: ${v.vehicleNumber}`,
        description: v.description || 'Parking policy violation recorded',
        timestamp: v.createdAt || new Date().toISOString(),
        status: v.status
      });
    });

    // Vehicles
    vehicles.forEach((veh) => {
      if (veh.createdAt) {
        list.push({
          id: `act-veh-${veh.vehicleId}`,
          type: 'Vehicle',
          title: `Vehicle Registered: ${veh.vehicleNumber}`,
          description: `${veh.make} ${veh.model} (${veh.vehicleType}) registered`,
          timestamp: veh.createdAt,
          status: 'Registered'
        });
      }
    });

    // Notifications
    notifications.forEach((notif) => {
      list.push({
        id: `act-notif-${notif.notificationId}`,
        type: 'Notification',
        title: notif.title,
        description: notif.message,
        timestamp: notif.createdAt,
        status: notif.read ? 'Read' : 'Unread'
      });
    });

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list.slice(0, 30);
  }, [visitorBookings, visitorLogs, violations, vehicles, notifications]);

  // Export handlers
  const handleExportCSV = () => {
    try {
      const exportStats = {
        'Total Residents': overviewStats.residents,
        'Total Security Staff': overviewStats.security,
        'Total Admins': overviewStats.admins,
        'Total Parking Slots': overviewStats.totalSlots,
        'Occupied Slots': overviewStats.occupiedSlots,
        'Available Slots': overviewStats.availableSlots,
        'Reserved Slots': overviewStats.reservedSlots,
        'Maintenance Slots': overviewStats.maintenanceSlots,
        'Registered Vehicles': overviewStats.totalVehicles,
        "Today's Visitors": overviewStats.todayVisitors,
        "Today's Check-ins": overviewStats.todayCheckIns,
        "Today's Check-outs": overviewStats.todayCheckOuts,
        'Pending Bookings': overviewStats.pendingBookings,
        'Active Bookings': overviewStats.activeBookings,
        'Resolved Violations': overviewStats.resolvedViolations,
        'Pending Violations': overviewStats.pendingViolations,
        'Unread Notifications': overviewStats.unreadNotifications
      };

      exportAnalyticsToCSV(
        {
          stats: exportStats,
          parkingSlots,
          vehicles,
          visitorBookings,
          visitorLogs,
          violations,
          users,
          notifications
        },
        timeRange
      );
      showToast('Analytics CSV report downloaded successfully.');
    } catch (err) {
      console.error('CSV Export Error:', err);
      showToast('Failed to export CSV report.');
    }
  };

  const handlePrintPDF = () => {
    printAnalyticsReport();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Banner */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-xs font-bold flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center space-x-3 tracking-tight">
            <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span>Executive Analytics Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime Firestore telemetry for society parking occupancy, gate flow, vehicles & security.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <CalendarIcon className="w-4 h-4 text-slate-400 ml-2" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeFilter)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="Last Year">Last Year</option>
              <option value="Custom">Custom Date Range</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Export PDF / Print */}
          <button
            onClick={handlePrintPDF}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers if selected */}
      {timeRange === 'Custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 flex flex-wrap items-center gap-4 text-xs"
        >
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Start Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">End Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </motion.div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-2 py-1 rounded-lg bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton States */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: 17 OVERVIEW STATISTICS CARDS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Live Overview Statistics
              </h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Realtime Firestore Synced</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {/* Users */}
              <StatCard
                title="Total Residents"
                value={overviewStats.residents}
                subtitle="Verified Flat Owners"
                icon={Users}
                iconBgColor="bg-blue-50 dark:bg-blue-950/80"
                iconColor="text-blue-600 dark:text-blue-400"
                badgeText="Active"
                badgeType="info"
              />
              <StatCard
                title="Security Staff"
                value={overviewStats.security}
                subtitle="Gate Enforcement"
                icon={Shield}
                iconBgColor="bg-purple-50 dark:bg-purple-950/80"
                iconColor="text-purple-600 dark:text-purple-400"
                badgeText="Staff"
                badgeType="neutral"
              />
              <StatCard
                title="Total Admins"
                value={overviewStats.admins}
                subtitle="System Managers"
                icon={UserCheck}
                iconBgColor="bg-indigo-50 dark:bg-indigo-950/80"
                iconColor="text-indigo-600 dark:text-indigo-400"
                badgeText="Admin"
                badgeType="neutral"
              />

              {/* Parking Slots */}
              <StatCard
                title="Total Slots"
                value={overviewStats.totalSlots}
                subtitle="All Society Slots"
                icon={SquareParking}
                iconBgColor="bg-slate-100 dark:bg-slate-800"
                iconColor="text-slate-700 dark:text-slate-300"
              />
              <StatCard
                title="Occupied Slots"
                value={overviewStats.occupiedSlots}
                subtitle="Parked Vehicles"
                icon={CheckCircle2}
                iconBgColor="bg-emerald-50 dark:bg-emerald-950/80"
                iconColor="text-emerald-600 dark:text-emerald-400"
                badgeText="Occupied"
                badgeType="success"
              />
              <StatCard
                title="Available Slots"
                value={overviewStats.availableSlots}
                subtitle="Ready for Parking"
                icon={SquareParking}
                iconBgColor="bg-teal-50 dark:bg-teal-950/80"
                iconColor="text-teal-600 dark:text-teal-400"
                badgeText="Free"
                badgeType="info"
              />
              <StatCard
                title="Reserved Slots"
                value={overviewStats.reservedSlots}
                subtitle="Assigned/VIP"
                icon={Clock}
                iconBgColor="bg-indigo-50 dark:bg-indigo-950/80"
                iconColor="text-indigo-600 dark:text-indigo-400"
                badgeText="Reserved"
                badgeType="neutral"
              />
              <StatCard
                title="Maintenance Slots"
                value={overviewStats.maintenanceSlots}
                subtitle="Under Repair"
                icon={Wrench}
                iconBgColor="bg-amber-50 dark:bg-amber-950/80"
                iconColor="text-amber-600 dark:text-amber-400"
                badgeText="Blocked"
                badgeType="warning"
              />

              {/* Vehicles */}
              <StatCard
                title="Registered Vehicles"
                value={overviewStats.totalVehicles}
                subtitle="Cars & Bikes"
                icon={Car}
                iconBgColor="bg-blue-50 dark:bg-blue-950/80"
                iconColor="text-blue-600 dark:text-blue-400"
              />

              {/* Gate Operations */}
              <StatCard
                title="Today's Visitors"
                value={overviewStats.todayVisitors}
                subtitle="Total Gate Passes"
                icon={LogIn}
                iconBgColor="bg-teal-50 dark:bg-teal-950/80"
                iconColor="text-teal-600 dark:text-teal-400"
                badgeText="Today"
                badgeType="info"
              />
              <StatCard
                title="Today's Check-ins"
                value={overviewStats.todayCheckIns}
                subtitle="Logged Entries"
                icon={LogIn}
                iconBgColor="bg-emerald-50 dark:bg-emerald-950/80"
                iconColor="text-emerald-600 dark:text-emerald-400"
                badgeText="In Gate"
                badgeType="success"
              />
              <StatCard
                title="Today's Check-outs"
                value={overviewStats.todayCheckOuts}
                subtitle="Logged Exits"
                icon={LogOut}
                iconBgColor="bg-amber-50 dark:bg-amber-950/80"
                iconColor="text-amber-600 dark:text-amber-400"
                badgeText="Exited"
                badgeType="warning"
              />

              {/* Bookings */}
              <StatCard
                title="Pending Bookings"
                value={overviewStats.pendingBookings}
                subtitle="Awaiting Action"
                icon={CalendarCheck}
                iconBgColor="bg-amber-50 dark:bg-amber-950/80"
                iconColor="text-amber-600 dark:text-amber-400"
                badgeText="Pending"
                badgeType="warning"
              />
              <StatCard
                title="Active Bookings"
                value={overviewStats.activeBookings}
                subtitle="Approved/Checked-in"
                icon={CalendarCheck}
                iconBgColor="bg-emerald-50 dark:bg-emerald-950/80"
                iconColor="text-emerald-600 dark:text-emerald-400"
                badgeText="Active"
                badgeType="success"
              />

              {/* Violations */}
              <StatCard
                title="Resolved Violations"
                value={overviewStats.resolvedViolations}
                subtitle="Settled Fines"
                icon={ShieldAlert}
                iconBgColor="bg-emerald-50 dark:bg-emerald-950/80"
                iconColor="text-emerald-600 dark:text-emerald-400"
                badgeText="Resolved"
                badgeType="success"
              />
              <StatCard
                title="Pending Violations"
                value={overviewStats.pendingViolations}
                subtitle="Unsettled/Open"
                icon={ShieldAlert}
                iconBgColor="bg-rose-50 dark:bg-rose-950/80"
                iconColor="text-rose-600 dark:text-rose-400"
                badgeText="Action Needed"
                badgeType="error"
              />

              {/* Notifications */}
              <StatCard
                title="Unread Alerts"
                value={overviewStats.unreadNotifications}
                subtitle="System Broadcasts"
                icon={Bell}
                iconBgColor="bg-purple-50 dark:bg-purple-950/80"
                iconColor="text-purple-600 dark:text-purple-400"
                badgeText="Unread"
                badgeType="info"
              />
            </div>
          </div>

          {/* SECTION 2: QUICK OPERATIONAL INSIGHTS */}
          <QuickInsightsGrid insights={quickInsights} />

          {/* SECTION 3: ANALYTICS CHARTS GRID */}
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Interactive Analytics Charts
            </h2>
            <AnalyticsChartsGrid data={chartDataSets} />
          </div>

          {/* SECTION 4: REALTIME RECENT ACTIVITY STREAM */}
          <RecentActivityFeed activities={activityStream} />
        </>
      )}
    </div>
  );
};
export default AdminAnalytics;
