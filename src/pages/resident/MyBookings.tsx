import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookCheck,
  Calendar,
  Clock,
  Car,
  XCircle,
  QrCode,
  Search,
  Filter,
  Edit3,
  Eye,
  CheckCircle,
  XOctagon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  RefreshCw,
  ParkingSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/bookingService';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState } from '../../components/EmptyState';
import { VisitorBooking, BookingStatus } from '../../types';

export const MyBookings: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<VisitorBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Pass Modal
  const [selectedPass, setSelectedPass] = useState<VisitorBooking | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Realtime subscription based on user role
  useEffect(() => {
    if (!userProfile) return;

    let unsubscribe: () => void;

    if (userProfile.role === 'Admin' || userProfile.role === 'Security') {
      unsubscribe = bookingService.subscribeToAllBookings((data) => {
        setBookings(data);
        setLoading(false);
      });
    } else {
      unsubscribe = bookingService.subscribeToUserBookings(userProfile.uid, (data) => {
        setBookings(data);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userProfile]);

  // Handle cancel booking (Resident can cancel Pending or Approved)
  const handleCancelBooking = async (booking: VisitorBooking) => {
    if (!window.confirm(`Are you sure you want to cancel the visitor pass for ${booking.guestName}?`)) {
      return;
    }

    setActionLoadingId(booking.bookingId);
    try {
      await bookingService.updateBookingStatus(booking.bookingId, 'Cancelled', {
        residentId: booking.residentId,
        guestName: booking.guestName
      });
      showToast('info', 'Pass Cancelled', `Visitor pass for ${booking.guestName} marked as Cancelled.`);
    } catch (err: any) {
      showToast('error', 'Cancellation Failed', err?.message || 'Could not cancel booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered & searched bookings list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus =
        statusFilter === 'All' ||
        b.status === statusFilter ||
        (statusFilter === 'Checked In' && b.status === 'Checked-In') ||
        (statusFilter === 'Checked Out' && b.status === 'Completed');

      const matchesDate = !dateFilter || b.date === dateFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.guestName.toLowerCase().includes(q) ||
        b.vehicleNumber.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q) ||
        (b.slotNumber && b.slotNumber.toLowerCase().includes(q));

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [bookings, statusFilter, dateFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Helper badge color renderer
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'Checked In':
      case 'Checked-In':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 animate-pulse">
            <Car className="w-3 h-3" />
            Checked In
          </span>
        );
      case 'Checked Out':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <LogOut className="w-3 h-3" />
            Checked Out
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XOctagon className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BookCheck className="w-6 h-6 text-emerald-500" />
            <span>
              {userProfile?.role === 'Resident' ? 'My Visitor Bookings' : 'Visitor Booking Directory'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime Firestore tracking for visitor parking passes, gate check-ins, and slot allocations.
          </p>
        </div>

        {/* Action Button */}
        {userProfile?.role === 'Resident' && (
          <button
            onClick={() => navigate('/visitor-booking')}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 self-start lg:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ New Visitor Booking</span>
          </button>
        )}
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Guest, Plate, or Booking ID..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Checked In">Checked In</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
          />

          {(searchQuery || statusFilter !== 'All' || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setDateFilter('');
              }}
              className="px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Skeleton Loading */
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6 animate-pulse" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse flex items-center px-4 justify-between"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={BookCheck}
          title="No Visitor Bookings Found"
          description={
            searchQuery || statusFilter !== 'All' || dateFilter
              ? 'No visitor bookings matched your search terms or active filters.'
              : 'There are no visitor bookings recorded in Firestore.'
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Booking ID</th>
                    <th className="py-3.5 px-5">Guest Name</th>
                    <th className="py-3.5 px-5">Vehicle & Type</th>
                    <th className="py-3.5 px-5">Visit Date & Time</th>
                    <th className="py-3.5 px-5">Allocated Slot</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                  {paginatedBookings.map((b) => (
                    <tr
                      key={b.bookingId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Booking ID */}
                      <td className="py-4 px-5 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {b.bookingId.slice(-8).toUpperCase()}
                      </td>

                      {/* Guest Name & Phone */}
                      <td className="py-4 px-5 font-semibold text-slate-900 dark:text-slate-100">
                        <div>{b.guestName}</div>
                        {b.guestPhone && (
                          <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            {b.guestPhone}
                          </div>
                        )}
                      </td>

                      {/* Vehicle Number */}
                      <td className="py-4 px-5">
                        <div className="font-bold uppercase text-slate-800 dark:text-slate-200">
                          {b.vehicleNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {b.vehicleType}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-5">
                        <div className="font-semibold">{b.date}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {b.startTime} - {b.endTime}
                        </div>
                      </td>

                      {/* Parking Slot */}
                      <td className="py-4 px-5 font-semibold text-emerald-600 dark:text-emerald-400">
                        {b.slotNumber ? `Slot ${b.slotNumber}` : b.slotId ? `Slot ID: ${b.slotId}` : 'Unassigned'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">{getStatusBadge(b.status)}</td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedPass(b)}
                          title="View Digital Gate Pass"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                          <span>View</span>
                        </button>

                        {/* Resident edit (Pending only) */}
                        {userProfile?.role === 'Resident' && b.status === 'Pending' && (
                          <button
                            onClick={() => navigate('/visitor-booking', { state: { booking: b } })}
                            title="Edit Booking"
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        {/* Resident cancel (Pending or Approved) */}
                        {userProfile?.role === 'Resident' &&
                          (b.status === 'Pending' || b.status === 'Approved') && (
                            <button
                              disabled={actionLoadingId === b.bookingId}
                              onClick={() => handleCancelBooking(b)}
                              title="Cancel Booking"
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {actionLoadingId === b.bookingId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Cancel</span>
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="grid md:hidden gap-3">
            {paginatedBookings.map((b) => (
              <div
                key={b.bookingId}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {b.guestName}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      ID: {b.bookingId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  {getStatusBadge(b.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-bold">
                      Vehicle
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {b.vehicleNumber} ({b.vehicleType})
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-bold">
                      Slot
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {b.slotNumber ? `Slot ${b.slotNumber}` : 'Unassigned'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="block text-[10px] uppercase text-slate-400 font-bold">
                      Visit Time
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {b.date} ({b.startTime} - {b.endTime})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedPass(b)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                    <span>View Pass</span>
                  </button>

                  {userProfile?.role === 'Resident' && b.status === 'Pending' && (
                    <button
                      onClick={() => navigate('/visitor-booking', { state: { booking: b } })}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  {userProfile?.role === 'Resident' &&
                    (b.status === 'Pending' || b.status === 'Approved') && (
                      <button
                        disabled={actionLoadingId === b.bookingId}
                        onClick={() => handleCancelBooking(b)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1 disabled:opacity-50"
                      >
                        {actionLoadingId === b.bookingId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Cancel</span>
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-2 text-xs text-slate-500 font-medium">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of{' '}
                {filteredBookings.length} entries
              </div>

              <div className="flex items-center space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Digital Gate Pass Details Modal */}
      <AnimatePresence>
        {selectedPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <QrCode className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                  ParkWise Digital Gate Pass
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedPass.guestName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Present this gate code at society main entrance
                </p>
              </div>

              {/* QR / Barcode Card */}
              <div className="p-4 rounded-2xl bg-slate-950 text-white font-mono text-center space-y-1.5 my-2 border border-slate-800">
                <div className="text-3xl font-black tracking-widest text-emerald-400">
                  {selectedPass.bookingId.toUpperCase().slice(-8)}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Verified Firestore Booking ID
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">{getStatusBadge(selectedPass.status)}</div>

              {/* Full Details Breakdown */}
              <div className="text-xs text-slate-600 dark:text-slate-300 text-left space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-medium">Vehicle:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                    {selectedPass.vehicleNumber} ({selectedPass.vehicleType})
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-medium">Allocated Slot:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedPass.slotNumber ? `Slot ${selectedPass.slotNumber}` : 'Pending Allocation'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-medium">Visit Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPass.date}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-400 font-medium">Timing Window:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPass.startTime} - {selectedPass.endTime}
                  </span>
                </div>

                {selectedPass.flatNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Host Flat:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedPass.flatNumber} ({selectedPass.residentName || 'Resident'})
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedPass(null)}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Close Pass
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
