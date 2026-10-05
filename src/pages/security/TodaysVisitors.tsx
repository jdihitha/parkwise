import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Search, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { visitorLogService } from '../../services/visitorLogService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState } from '../../components/EmptyState';
import { VisitorBooking } from '../../types';

export const TodaysVisitors: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<VisitorBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = bookingService.subscribeToTodayBookings((data) => {
      setBookings(data);
    });
    return () => unsubscribe();
  }, []);

  const handleQuickCheckIn = async (booking: VisitorBooking) => {
    try {
      // 1. Record entry in visitorLogs
      await visitorLogService.recordEntry({
        bookingId: booking.bookingId,
        securityId: userProfile?.uid || 'security-gate-1',
        securityName: userProfile?.name || 'Gate Officer',
        entryTime: new Date().toISOString(),
        guestName: booking.guestName,
        vehicleNumber: booking.vehicleNumber,
        flatNumber: booking.flatNumber || 'N/A',
        slotNumber: booking.slotNumber || 'Visitor Bay'
      });

      // 2. Update booking status
      await bookingService.updateBookingStatus(booking.bookingId, 'Checked-In');

      showToast('success', 'Visitor Checked-In', `${booking.guestName} recorded as entered at gate.`);
    } catch (err: any) {
      showToast('error', 'Check-In Error', err.message);
    }
  };

  const filtered = bookings.filter(
    (b) =>
      b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.flatNumber && b.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-teal-500" />
            <span>Today's Expected Visitors</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Expected guest passes scheduled for entry today in Firestore.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search guest, flat, or plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Visitor Passes Found"
          description={
            searchQuery
              ? 'No passes match your search query.'
              : 'There are no guest passes booked for today.'
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((b) => (
            <div
              key={b.bookingId}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    Pass Code: #{b.bookingId.slice(-6).toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      b.status === 'Checked-In'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : b.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {b.guestName}
                </h3>

                <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Vehicle:</strong>{' '}
                    {b.vehicleNumber} ({b.vehicleType})
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Host Flat:</strong>{' '}
                    {b.residentName} ({b.flatNumber})
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Hours:</strong>{' '}
                    {b.startTime} - {b.endTime}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                {b.status === 'Approved' ? (
                  <button
                    onClick={() => handleQuickCheckIn(b)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Quick Check-In Entry</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    {b.status === 'Checked-In' ? 'Already Inside Premises' : 'Completed'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
