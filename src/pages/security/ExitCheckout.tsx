import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, UserCheck, Clock, Loader2, CheckCircle2, ParkingSquare, User, Car, Shield } from 'lucide-react';
import { visitorLogService } from '../../services/visitorLogService';
import { bookingService } from '../../services/bookingService';
import { parkingService } from '../../services/parkingService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState } from '../../components/EmptyState';
import { VisitorLog } from '../../types';

export const ExitCheckout: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeLogs, setActiveLogs] = useState<VisitorLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Realtime subscription for active logs
    const unsub = visitorLogService.subscribeToActiveLogs((data) => {
      setActiveLogs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCheckout = async (log: VisitorLog) => {
    setProcessingId(log.logId);
    try {
      const exitTime = new Date().toISOString();

      // 1. Update VisitorLog status & exitTime
      await visitorLogService.recordExit(log.logId, exitTime);

      // 2. Update VisitorBooking status if linked
      if (log.bookingId && log.bookingId !== 'walk-in') {
        await bookingService.updateBookingStatus(log.bookingId, 'Checked Out', {
          residentId: log.residentId,
          guestName: log.guestName
        });
      }

      // 3. Automatically free parking slot
      const slotIdentifier = log.slotNumber || log.slotId || '';
      if (slotIdentifier) {
        await parkingService.freeSlotByNumberOrId(slotIdentifier);
      }

      // 4. Create Notification document for Resident
      if (log.residentId) {
        await notificationService.createNotification({
          userId: log.residentId,
          title: 'Visitor Checked Out',
          message: `Your visitor ${log.guestName} (${log.vehicleNumber}) has checked out and exited society premises.`,
          type: 'Booking'
        });
      }

      showToast(
        'success',
        'Visitor Checked-Out',
        `${log.guestName} (${log.vehicleNumber}) recorded as exited. Slot ${slotIdentifier || ''} freed.`
      );
    } catch (err: any) {
      showToast('error', 'Check-Out Error', err.message || 'Failed to complete checkout.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredLogs = activeLogs.filter(
    (l) =>
      l.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.residentName && l.residentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.bookingId && l.bookingId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <LogOut className="w-6 h-6 text-rose-500" />
            <span>Gate Exit Check-Out</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime register of active visitors inside premises. Click Record Gate Exit to free slot and notify host.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, plate, flat, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-xs text-slate-400">Loading active checked-in visitors...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={LogOut}
          title="No Active Visitors Inside Premises"
          description={
            searchQuery
              ? 'No active checked-in visitors match your search string.'
              : 'There are currently no active checked-in visitors inside society premises.'
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredLogs.map((log) => {
            const entryDate = new Date(log.entryTime);
            const durationMins = Math.max(
              0,
              Math.floor((new Date().getTime() - entryDate.getTime()) / (1000 * 60))
            );
            const durationHrs = Math.floor(durationMins / 60);
            const remMins = durationMins % 60;
            const durationStr = durationHrs > 0 ? `${durationHrs}h ${remMins}m` : `${remMins}m`;

            return (
              <div
                key={log.logId}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                      <User className="w-4 h-4 text-amber-500" />
                      <span>{log.guestName}</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Plate: {log.vehicleNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Checked In
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-400">
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Visiting Flat:</strong>{' '}
                      {log.flatNumber}
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Host:</strong>{' '}
                      {log.residentName || 'Resident'}
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Parking Slot:</strong>{' '}
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {log.slotNumber || log.slotId || 'Visitor Bay'}
                      </span>
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Entry Time:</strong>{' '}
                      {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="col-span-2">
                      <strong className="text-slate-900 dark:text-slate-200">Stay Duration:</strong>{' '}
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {durationStr}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout(log)}
                  disabled={processingId === log.logId}
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 shrink-0 self-end sm:self-center"
                >
                  {processingId === log.logId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Freeing Slot & Updating...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>Record Gate Exit</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
