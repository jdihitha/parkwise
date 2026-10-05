import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  UserCheck,
  QrCode,
  LogOut,
  ParkingSquare,
  Clock,
  AlertTriangle,
  Search,
  CheckCircle2,
  ArrowUpRight,
  Loader2,
  User,
  Car,
  Home,
  ChevronRight,
  Filter,
  Eye,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { visitorLogService } from '../../services/visitorLogService';
import { bookingService } from '../../services/bookingService';
import { parkingService } from '../../services/parkingService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';
import { FirebaseStatusBanner } from '../../components/FirebaseStatusBanner';
import { VisitorLog, VisitorBooking, ParkingSlot } from '../../types';

export const SecurityDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();

  const [activeLogs, setActiveLogs] = useState<VisitorLog[]>([]);
  const [todayBookings, setTodayBookings] = useState<VisitorBooking[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [allLogs, setAllLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal details
  const [selectedBooking, setSelectedBooking] = useState<VisitorBooking | null>(null);

  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) setLoading(false);
    };

    // 1. Realtime active visitor logs
    const unsubActiveLogs = visitorLogService.subscribeToActiveLogs((data) => {
      setActiveLogs(data);
      checkLoaded();
    });

    // 2. Realtime all visitor logs for metrics
    const unsubAllLogs = visitorLogService.subscribeToAllLogs((data) => {
      setAllLogs(data);
    });

    // 3. Realtime today's bookings
    const unsubBookings = bookingService.subscribeToTodayBookings((data) => {
      setTodayBookings(data);
      checkLoaded();
    });

    // 4. Realtime parking slots
    const unsubSlots = parkingService.subscribeToSlots((data) => {
      setSlots(data);
      checkLoaded();
    });

    return () => {
      unsubActiveLogs();
      unsubAllLogs();
      unsubBookings();
      unsubSlots();
    };
  }, []);

  // Compute realtime metrics
  const todayDateStr = new Date().toISOString().split('T')[0];

  const totalTodayVisitors = todayBookings.length;

  const checkedInCount = activeLogs.length;

  const checkedOutCount = allLogs.filter((l) => {
    const isToday = l.entryTime && l.entryTime.startsWith(todayDateStr);
    return (l.status === 'Completed' || l.status === 'Checked Out' || l.exitTime) && isToday;
  }).length;

  const pendingCount = todayBookings.filter(
    (b) => b.status === 'Pending' || b.status === 'Approved'
  ).length;

  // Overstayed Visitors calculation (active visitors whose expected exit time has passed)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const overstayedCount = activeLogs.filter((log) => {
    // Find matching booking if available
    const matchingBooking = todayBookings.find((b) => b.bookingId === log.bookingId);
    if (matchingBooking && matchingBooking.endTime) {
      const [endH, endM] = matchingBooking.endTime.split(':').map(Number);
      if (!isNaN(endH) && !isNaN(endM)) {
        const bookingEndMinutes = endH * 60 + endM;
        return currentMinutes > bookingEndMinutes;
      }
    }
    // Default fallback: if checked in for > 6 hours
    const entryDate = new Date(log.entryTime);
    const diffHours = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
    return diffHours > 6;
  }).length;

  const availableSlotsCount = slots.filter((s) => s.status === 'Available').length;
  const occupiedSlotsCount = slots.filter((s) => s.status === 'Occupied').length;

  // Perform Check-In for an Approved Pass directly from table
  const handleCheckIn = async (booking: VisitorBooking) => {
    setActionLoadingId(booking.bookingId);
    try {
      const entryTime = new Date().toISOString();
      const slotNum = booking.slotNumber || 'V-01';

      // 1. Create VisitorLog
      await visitorLogService.recordEntry({
        bookingId: booking.bookingId,
        securityId: userProfile?.uid || 'security-1',
        securityName: userProfile?.name || 'Gate Officer',
        entryTime,
        guestName: booking.guestName,
        vehicleNumber: booking.vehicleNumber,
        flatNumber: booking.flatNumber || 'N/A',
        slotNumber: slotNum,
        slotId: booking.slotId,
        residentId: booking.residentId,
        residentName: booking.residentName,
        notes: `Entry checked in by ${userProfile?.name || 'Security'}`
      });

      // 2. Update VisitorBooking status
      await bookingService.updateBookingStatus(booking.bookingId, 'Checked In', {
        residentId: booking.residentId,
        guestName: booking.guestName
      });

      // 3. Occupy parking slot if assigned
      if (booking.slotId || booking.slotNumber) {
        await parkingService.occupySlotByNumberOrId(booking.slotId || booking.slotNumber || '');
      }

      // 4. Send Resident Notification
      if (booking.residentId) {
        await notificationService.createNotification({
          userId: booking.residentId,
          title: 'Visitor Checked In',
          message: `Your visitor ${booking.guestName} (${booking.vehicleNumber}) has entered the gate. Assigned Slot: ${slotNum}`,
          type: 'Booking'
        });
      }

      showToast('success', 'Visitor Checked-In', `${booking.guestName} is now checked in at gate.`);
    } catch (err: any) {
      showToast('error', 'Check-In Error', err.message || 'Failed to complete check-in.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Perform Check-Out directly from table
  const handleCheckOut = async (bookingOrLog: VisitorBooking | VisitorLog) => {
    const bookingId = 'bookingId' in bookingOrLog ? bookingOrLog.bookingId : '';
    const logId = 'logId' in bookingOrLog ? (bookingOrLog as VisitorLog).logId : '';
    const guestName = bookingOrLog.guestName;
    const vehicleNumber = bookingOrLog.vehicleNumber;

    // Find active log corresponding to this booking
    const activeLog = activeLogs.find((l) => l.bookingId === bookingId || l.logId === logId);
    const targetLogId = activeLog ? activeLog.logId : logId;

    setActionLoadingId(bookingId || targetLogId || 'checkout');
    try {
      const exitTime = new Date().toISOString();

      if (targetLogId) {
        await visitorLogService.recordExit(targetLogId, exitTime);
      }

      if (bookingId && bookingId !== 'walk-in') {
        await bookingService.updateBookingStatus(bookingId, 'Checked Out', {
          residentId: (bookingOrLog as any).residentId,
          guestName
        });
      }

      // Free parking slot
      const slotIdentifier = bookingOrLog.slotNumber || (bookingOrLog as any).slotId || '';
      if (slotIdentifier) {
        await parkingService.freeSlotByNumberOrId(slotIdentifier);
      }

      // Send Notification to Resident
      const resId = (bookingOrLog as any).residentId || (activeLog && activeLog.residentId);
      if (resId) {
        await notificationService.createNotification({
          userId: resId,
          title: 'Visitor Checked Out',
          message: `Your visitor ${guestName} (${vehicleNumber}) has checked out and exited premises.`,
          type: 'Booking'
        });
      }

      showToast('success', 'Visitor Checked-Out', `${guestName} (${vehicleNumber}) has exited society.`);
    } catch (err: any) {
      showToast('error', 'Check-Out Error', err.message || 'Failed to record exit.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter today's bookings for table
  const filteredBookings = todayBookings.filter((b) => {
    const matchesSearch =
      b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.flatNumber && b.flatNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'All') return true;
    if (statusFilter === 'Checked In') return b.status === 'Checked In' || b.status === 'Checked-In';
    if (statusFilter === 'Checked Out') return b.status === 'Checked Out' || b.status === 'Completed';
    if (statusFilter === 'Approved') return b.status === 'Approved';
    if (statusFilter === 'Pending') return b.status === 'Pending';
    return true;
  });

  return (
    <div className="space-y-6">
      <FirebaseStatusBanner />

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Gate Security Command Center</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Security Gate Console
          </h1>
          <p className="text-xs sm:text-sm opacity-90 mt-1 max-w-xl">
            Live entry/exit monitoring, digital visitor pass verification, and parking slot management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/security/entry"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white text-amber-800 font-bold text-xs shadow-md hover:bg-amber-50 transition-all"
          >
            <QrCode className="w-4 h-4 text-amber-600" />
            <span>New Gate Check-In</span>
          </Link>
          <Link
            to="/security/exit"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-950/40 text-white font-bold text-xs border border-white/20 hover:bg-amber-950/60 transition-all"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Check-Out Visitor</span>
          </Link>
        </div>
      </div>

      {/* 7 Realtime Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* 1. Today's Visitors */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Today's Visitors
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalTodayVisitors}
            </h3>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Total Passes</p>
          </div>
        </div>

        {/* 2. Checked In */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Checked In
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {checkedInCount}
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Inside Society</p>
          </div>
        </div>

        {/* 3. Checked Out */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Checked Out
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {checkedOutCount}
            </h3>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Exited Today</p>
          </div>
        </div>

        {/* 4. Pending Visitors */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Pending
            </span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {pendingCount}
            </h3>
            <p className="text-[10px] text-orange-600 font-semibold mt-0.5">Awaiting Gate</p>
          </div>
        </div>

        {/* 5. Overstayed Visitors */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Overstayed
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {overstayedCount}
            </h3>
            <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Time Expired</p>
          </div>
        </div>

        {/* 6. Available Parking Slots */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Free Slots
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
              <ParkingSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {availableSlotsCount}
            </h3>
            <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Available Now</p>
          </div>
        </div>

        {/* 7. Occupied Parking Slots */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Occupied
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {occupiedSlotsCount}
            </h3>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Slots Occupied</p>
          </div>
        </div>
      </div>

      {/* TODAY'S VISITORS MAIN TABLE SECTION */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <span>Today's Visitors Register</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live Firestore collection monitoring today's booked visitor passes and status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest, plate, flat..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter Pill */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved Pass</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs text-slate-400">Loading live visitor records from Firestore...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {searchQuery || statusFilter !== 'All'
              ? 'No visitors match your search or filter criteria.'
              : 'No visitor passes scheduled for today in Firestore.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Guest Name</th>
                  <th className="px-5 py-3.5">Resident</th>
                  <th className="px-5 py-3.5">Flat Number</th>
                  <th className="px-5 py-3.5">Vehicle Number</th>
                  <th className="px-5 py-3.5">Parking Slot</th>
                  <th className="px-5 py-3.5">Visit Time</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredBookings.map((b) => {
                  const isCheckedIn = b.status === 'Checked In' || b.status === 'Checked-In';
                  const isCheckedOut = b.status === 'Checked Out' || b.status === 'Completed';
                  const isApproved = b.status === 'Approved';

                  return (
                    <tr
                      key={b.bookingId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{b.guestName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{b.residentName}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">
                        {b.flatNumber || 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {b.vehicleNumber}
                      </td>
                      <td className="px-5 py-3.5 font-semibold">
                        {b.slotNumber || b.slotId || 'Visitor Slot'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                        {b.startTime} - {b.endTime}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCheckedIn
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : isCheckedOut
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Details Modal Trigger */}
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Pass Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Action Buttons */}
                          {isApproved && (
                            <button
                              onClick={() => handleCheckIn(b)}
                              disabled={actionLoadingId === b.bookingId}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                            >
                              {actionLoadingId === b.bookingId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <QrCode className="w-3.5 h-3.5" />
                              )}
                              <span>Gate Check-In</span>
                            </button>
                          )}

                          {isCheckedIn && (
                            <button
                              onClick={() => handleCheckOut(b)}
                              disabled={actionLoadingId === b.bookingId}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                            >
                              {actionLoadingId === b.bookingId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <LogOut className="w-3.5 h-3.5" />
                              )}
                              <span>Record Exit</span>
                            </button>
                          )}

                          {isCheckedOut && (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pass Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Visitor Pass Verification
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Close
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Code:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    #{selectedBooking.bookingId.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest Name:</span>
                  <span className="font-bold">{selectedBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest Phone:</span>
                  <span className="font-semibold">{selectedBooking.guestPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Number:</span>
                  <span className="font-mono font-bold text-amber-600">
                    {selectedBooking.vehicleNumber} ({selectedBooking.vehicleType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Host Resident:</span>
                  <span className="font-bold">{selectedBooking.residentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Flat / Unit:</span>
                  <span className="font-bold">{selectedBooking.flatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Slot:</span>
                  <span className="font-bold">{selectedBooking.slotNumber || 'Visitor Bay'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Visit:</span>
                  <span className="font-bold">
                    {selectedBooking.date} ({selectedBooking.startTime} - {selectedBooking.endTime})
                  </span>
                </div>
                {selectedBooking.notes && (
                  <div className="pt-2 border-t border-amber-200/40">
                    <span className="text-slate-500 block mb-0.5">Notes:</span>
                    <p className="italic text-slate-700 dark:text-slate-300">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
