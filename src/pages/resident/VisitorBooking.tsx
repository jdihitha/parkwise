import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CalendarPlus,
  User,
  Phone,
  Car,
  Calendar,
  Clock,
  FileText,
  Loader2,
  ArrowRight,
  ParkingSquare,
  AlertCircle,
  CheckCircle2,
  Edit3,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/bookingService';
import { parkingService } from '../../services/parkingService';
import { useToast } from '../../contexts/ToastContext';
import { VehicleType, ParkingSlot, VisitorBooking as VisitorBookingType } from '../../types';

// Zod schema with strict validations
const bookingSchema = z
  .object({
    guestName: z
      .string()
      .min(2, 'Guest name must be at least 2 characters')
      .max(50, 'Guest name is too long'),
    guestPhone: z
      .string()
      .min(8, 'Phone number must be at least 8 digits')
      .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'),
    vehicleNumber: z
      .string()
      .min(3, 'Vehicle plate number is required')
      .max(20, 'Vehicle plate is too long'),
    vehicleType: z.enum(['Car', 'Bike', 'SUV', 'EV', 'Truck', 'Other']),
    date: z.string().min(1, 'Visit date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    slotId: z.string().min(1, 'Please select an available parking slot'),
    notes: z.string().optional()
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime']
  })
  .refine(
    (data) => {
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    {
      message: 'Visit date cannot be in the past',
      path: ['date']
    }
  );

type BookingFormData = z.infer<typeof bookingSchema>;

export const VisitorBooking: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if editing an existing booking passed via navigation state
  const editingBooking = location.state?.booking as VisitorBookingType | undefined;

  const [availableSlots, setAvailableSlots] = useState<ParkingSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestName: editingBooking?.guestName || '',
      guestPhone: editingBooking?.guestPhone || '',
      vehicleNumber: editingBooking?.vehicleNumber || '',
      vehicleType: (editingBooking?.vehicleType || 'Car') as VehicleType,
      date: editingBooking?.date || todayStr,
      startTime: editingBooking?.startTime || '10:00',
      endTime: editingBooking?.endTime || '18:00',
      slotId: editingBooking?.slotId || '',
      notes: editingBooking?.notes || ''
    }
  });

  const selectedSlotId = watch('slotId');
  const watchDate = watch('date');
  const watchStartTime = watch('startTime');
  const watchEndTime = watch('endTime');

  // Fetch available slots in realtime
  useEffect(() => {
    const unsubscribe = parkingService.subscribeToSlots((slots) => {
      // Filter available slots or include the currently booked slot if editing
      const filtered = slots.filter(
        (s) => s.status === 'Available' || (editingBooking && s.slotId === editingBooking.slotId)
      );
      setAvailableSlots(filtered);
      setLoadingSlots(false);

      // Auto select first slot if creating new and none selected
      if (!editingBooking && filtered.length > 0 && !selectedSlotId) {
        setValue('slotId', filtered[0].slotId);
      }
    });
    return () => unsubscribe();
  }, [editingBooking, setValue, selectedSlotId]);

  // Clear conflict warning when key fields change
  useEffect(() => {
    if (conflictError) {
      setConflictError(null);
    }
  }, [selectedSlotId, watchDate, watchStartTime, watchEndTime]);

  const onSubmit = async (data: BookingFormData) => {
    if (!userProfile?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to create a booking.');
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);

    try {
      const selectedSlot = availableSlots.find((s) => s.slotId === data.slotId);

      // Check slot time conflict in Firestore
      const hasConflict = await bookingService.checkSlotConflict(
        data.slotId,
        data.date,
        data.startTime,
        data.endTime,
        editingBooking?.bookingId
      );

      if (hasConflict) {
        const errorMsg = `Slot ${
          selectedSlot?.slotNumber || 'selected'
        } is already booked for the overlapping time (${data.startTime} - ${data.endTime}) on ${data.date}. Please choose another slot or time.`;
        setConflictError(errorMsg);
        showToast('error', 'Time Conflict Detected', errorMsg);
        setIsSubmitting(false);
        return;
      }

      if (editingBooking) {
        // Update existing booking (only if pending)
        await bookingService.updateBooking(editingBooking.bookingId, {
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          vehicleNumber: data.vehicleNumber.toUpperCase().trim(),
          vehicleType: data.vehicleType as VehicleType,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          slotId: data.slotId,
          slotNumber: selectedSlot?.slotNumber || editingBooking.slotNumber || '',
          notes: data.notes || ''
        });

        showToast('success', 'Booking Updated', `Pass for ${data.guestName} updated successfully!`);
      } else {
        // Create new visitor booking
        await bookingService.createBooking({
          residentId: userProfile.uid,
          residentName: userProfile.name,
          flatNumber: userProfile.flatNumber,
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          vehicleNumber: data.vehicleNumber.toUpperCase().trim(),
          vehicleType: data.vehicleType as VehicleType,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          slotId: data.slotId,
          slotNumber: selectedSlot?.slotNumber || '',
          status: 'Pending',
          notes: data.notes || ''
        });

        showToast(
          'success',
          'Visitor Pass Requested',
          `Gate pass request submitted for ${data.guestName}.`
        );
      }

      navigate('/my-bookings');
    } catch (error: any) {
      showToast(
        'error',
        'Submission Error',
        error?.message || 'Failed to process visitor booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            {editingBooking ? (
              <Edit3 className="w-6 h-6 text-amber-500" />
            ) : (
              <CalendarPlus className="w-6 h-6 text-emerald-500" />
            )}
            <span>{editingBooking ? 'Edit Visitor Pass Request' : 'Book Visitor Parking Pass'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {editingBooking
              ? 'Update details for your pending visitor booking pass.'
              : 'Reserve an available visitor parking slot for your guest vehicle in Firestore.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/my-bookings')}
          className="self-start sm:self-center px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
        >
          View My Bookings
        </button>
      </div>

      {/* Main Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden"
      >
        {/* Decorative Top Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Time conflict warning notice */}
        {conflictError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Slot Booking Conflict</p>
              <p className="mt-0.5">{conflictError}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Guest Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>1. Guest Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Guest Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Guest Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    {...register('guestName')}
                    placeholder="e.g. Alexander Vance"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                {errors.guestName && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.guestName.message}
                  </p>
                )}
              </div>

              {/* Guest Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Guest Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    {...register('guestPhone')}
                    placeholder="+1 (555) 019-2831"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                {errors.guestPhone && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.guestPhone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle Information */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Car className="w-4 h-4" />
              <span>2. Vehicle Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vehicle Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vehicle License Plate <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    {...register('vehicleNumber')}
                    placeholder="e.g. KA-01-AB-1234"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase tracking-wider focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                {errors.vehicleNumber && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.vehicleNumber.message}
                  </p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vehicle Type <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('vehicleType')}
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                >
                  <option value="Car">Sedan / Hatchback (Car)</option>
                  <option value="SUV">SUV / Crossover</option>
                  <option value="Bike">Motorcycle / Two-Wheeler</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                </select>
                {errors.vehicleType && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.vehicleType.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Date, Time & Parking Slot */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>3. Visit Timing & Slot Allocation</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Visit Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Visit Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    min={todayStr}
                    {...register('date')}
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                {errors.date && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    {...register('startTime')}
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                {errors.startTime && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Expected Exit Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    {...register('endTime')}
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                {errors.endTime && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Parking Slot Selection */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Available Parking Slot <span className="text-rose-500">*</span>
              </label>

              {loadingSlots ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Loading available slots from Firestore...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    No parking slots with status "Available" found in Firestore right now. Please contact security or admin.
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <ParkingSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <select
                    {...register('slotId')}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all font-medium"
                  >
                    <option value="">-- Choose an Available Slot --</option>
                    {availableSlots.map((slot) => (
                      <option key={slot.slotId} value={slot.slotId}>
                        Slot {slot.slotNumber} ({slot.type} • {slot.building || 'Main Building'}{' '}
                        {slot.floor ? `- Floor ${slot.floor}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {errors.slotId && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">
                  {errors.slotId.message}
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Gate Instructions / Remarks (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                {...register('notes')}
                placeholder="e.g. Guest delivering luggage, overnight stay requested"
                className="w-full pl-10 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || loadingSlots}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Booking to Firestore...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{editingBooking ? 'Save Booking Changes' : 'Submit Visitor Booking Request'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {editingBooking && (
              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                className="px-5 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
