import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  QrCode,
  Search,
  User,
  Car,
  Home,
  ParkingSquare,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { visitorLogService } from '../../services/visitorLogService';
import { bookingService } from '../../services/bookingService';
import { parkingService } from '../../services/parkingService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';
import { VisitorBooking, ParkingSlot, VehicleType } from '../../types';

const checkinSchema = z.object({
  guestName: z.string().min(2, 'Guest name is required'),
  vehicleNumber: z.string().min(3, 'Vehicle plate number is required'),
  vehicleType: z.enum(['Car', 'Bike', 'SUV', 'EV', 'Truck', 'Other']),
  flatNumber: z.string().min(1, 'Host flat number is required'),
  slotNumber: z.string().min(1, 'Assigned slot required'),
  notes: z.string().optional()
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export const EntryCheckin: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [matchingBookings, setMatchingBookings] = useState<VisitorBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<VisitorBooking | null>(null);
  const [availableVisitorSlots, setAvailableVisitorSlots] = useState<ParkingSlot[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Subscribe to visitor parking slots in Firestore
    const unsub = parkingService.subscribeToSlots((allSlots) => {
      const vSlots = allSlots.filter((s) => s.type === 'Visitor' && s.status === 'Available');
      setAvailableVisitorSlots(vSlots);
    });
    return () => unsub();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      guestName: '',
      vehicleNumber: '',
      vehicleType: 'Car',
      flatNumber: '',
      slotNumber: 'V-01',
      notes: ''
    }
  });

  const handleSearchPass = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const bookings = await bookingService.getTodayBookings();
      // Only check-in Approved bookings (or already verified passes)
      const matches = bookings.filter(
        (b) =>
          b.status === 'Approved' &&
          (b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.flatNumber && b.flatNumber.toLowerCase().includes(searchQuery.toLowerCase())))
      );

      setMatchingBookings(matches);
      if (matches.length > 0) {
        selectBookingPass(matches[0]);
        showToast('success', 'Approved Pass Verified', `Found pass for ${matches[0].guestName}`);
      } else {
        setSelectedBooking(null);
        showToast('info', 'No Approved Pass Found', 'No approved pass matches query. You may enter walk-in details below.');
      }
    } catch (err: any) {
      showToast('error', 'Search Failure', err.message || 'Failed to search booking passes.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectBookingPass = (b: VisitorBooking) => {
    setSelectedBooking(b);
    setValue('guestName', b.guestName);
    setValue('vehicleNumber', b.vehicleNumber);
    setValue('vehicleType', (b.vehicleType as VehicleType) || 'Car');
    setValue('flatNumber', b.flatNumber || '');
    if (b.slotNumber) {
      setValue('slotNumber', b.slotNumber);
    } else if (availableVisitorSlots.length > 0) {
      setValue('slotNumber', availableVisitorSlots[0].slotNumber);
    }
  };

  const onSubmit = async (data: CheckinFormData) => {
    setIsSubmitting(true);
    try {
      const entryTime = new Date().toISOString();
      const bookingId = selectedBooking ? selectedBooking.bookingId : 'walk-in';
      const residentId = selectedBooking?.residentId;
      const residentName = selectedBooking?.residentName;

      // 1. Create VisitorLog in visitorLogs collection
      await visitorLogService.recordEntry({
        bookingId,
        securityId: userProfile?.uid || 'security-1',
        securityName: userProfile?.name || 'Gate Officer',
        entryTime,
        guestName: data.guestName,
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        flatNumber: data.flatNumber,
        slotNumber: data.slotNumber,
        slotId: selectedBooking?.slotId,
        residentId,
        residentName,
        notes: data.notes || 'Verified at main gate post'
      });

      // 2. Update booking status in visitorBookings if pre-booked
      if (selectedBooking) {
        await bookingService.updateBookingStatus(selectedBooking.bookingId, 'Checked In', {
          residentId,
          guestName: data.guestName
        });
      }

      // 3. Occupy parking slot in parkingSlots collection
      await parkingService.occupySlotByNumberOrId(data.slotNumber);

      // 4. Create Notification document for Resident
      if (residentId) {
        await notificationService.createNotification({
          userId: residentId,
          title: 'Visitor Checked In',
          message: `Your visitor ${data.guestName} (${data.vehicleNumber.toUpperCase()}) has checked in at society gate. Assigned slot: ${data.slotNumber}`,
          type: 'Booking'
        });
      }

      showToast(
        'success',
        'Gate Check-In Complete',
        `${data.guestName} successfully entered and assigned slot ${data.slotNumber}`
      );
      navigate('/security/dashboard');
    } catch (err: any) {
      showToast('error', 'Check-In Error', err.message || 'Failed to complete check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <QrCode className="w-6 h-6 text-amber-500" />
          <span>Security Gate Visitor Entry</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify approved resident visitor pass or register walk-in guest at society gate.
        </p>
      </div>

      {/* Pre-Booking Search Section */}
      <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
        <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
          Search Approved Gate Pass Code or Vehicle Plate
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchPass())}
              placeholder="Enter Booking Code, Guest Name, or Vehicle Plate..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchPass}
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all disabled:opacity-50 flex items-center space-x-1.5"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            <span>Verify Pass</span>
          </button>
        </div>

        {matchingBookings.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1.5">
              Matching Approved Visitor Passes:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {matchingBookings.map((b) => (
                <div
                  key={b.bookingId}
                  onClick={() => selectBookingPass(b)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedBooking?.bookingId === b.bookingId
                      ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-100 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <span className="font-bold">{b.guestName}</span> ({b.vehicleNumber}) • Host:{' '}
                    {b.residentName} ({b.flatNumber})
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Pass Approved
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Check-In Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Visitor Entry Details Form</span>
          </h2>
          {selectedBooking ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Pass Verified: #{selectedBooking.bookingId.slice(-6).toUpperCase()}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-400">Walk-In / Direct Entry</span>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guest Name
              </label>
              <input
                type="text"
                {...register('guestName')}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
              />
              {errors.guestName && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.guestName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                {...register('vehicleNumber')}
                placeholder="e.g. KA-01-AB-1234"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase focus:border-amber-500 focus:outline-none"
              />
              {errors.vehicleNumber && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.vehicleNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Type
              </label>
              <select
                {...register('vehicleType')}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="SUV">SUV</option>
                <option value="EV">EV</option>
                <option value="Truck">Truck</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visiting Flat / Unit
              </label>
              <input
                type="text"
                {...register('flatNumber')}
                placeholder="e.g. Flat 302"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
              />
              {errors.flatNumber && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.flatNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Visitor Slot
              </label>
              {availableVisitorSlots.length > 0 ? (
                <select
                  {...register('slotNumber')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  {availableVisitorSlots.map((s) => (
                    <option key={s.slotId} value={s.slotNumber}>
                      {s.slotNumber} ({s.location || 'Visitor Bay'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  {...register('slotNumber')}
                  placeholder="e.g. V-01"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              )}
              {errors.slotNumber && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.slotNumber.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Security Inspection Notes
            </label>
            <input
              type="text"
              {...register('notes')}
              placeholder="e.g. Government ID verified, gate pass issued"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging Entry to Firestore...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Record Gate Entry & Notify Resident</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
