import React, { useState, useEffect } from 'react';
import {
  ParkingSquare,
  ShieldCheck,
  Car,
  RefreshCw,
  AlertCircle,
  FileText,
  Clock,
  Zap,
  PhoneCall,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { parkingService } from '../../services/parkingService';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState } from '../../components/EmptyState';
import { ParkingSlot, SlotStatus } from '../../types';

export const MyParking: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile?.uid) return;
    const unsubscribe = parkingService.subscribeToSlots((allSlots) => {
      const mySlots = allSlots.filter((s) => s.assignedResident === userProfile.uid);
      setSlots(mySlots);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile?.uid]);

  const handleToggleStatus = async (slotId: string, currentStatus: SlotStatus) => {
    setUpdatingId(slotId);
    try {
      const newStatus: SlotStatus = currentStatus === 'Occupied' ? 'Available' : 'Occupied';
      await parkingService.updateSlotStatus(slotId, newStatus);
      showToast('success', 'Slot Status Updated', `Slot status updated to ${newStatus}.`);
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <ParkingSquare className="w-6 h-6 text-indigo-600" />
            <span>My Parking Slot</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime Firestore status, slot location, allocation details, and society parking guidelines.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
        </div>
      ) : slots.length === 0 ? (
        <EmptyState
          icon={ParkingSquare}
          title="No Assigned Parking Slot Found"
          description="Your profile currently has no assigned slot in Firestore. Please contact society security or property admin to assign your spot."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {slots.map((slot) => {
            const assignedDateFormatted = slot.createdAt
              ? new Date(slot.createdAt).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'N/A';

            return (
              <div
                key={slot.slotId}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {slot.type} Parking Slot
                    </span>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
                      Slot {slot.slotNumber}
                    </h2>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      slot.status === 'Occupied'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300'
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Building / Tower</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {slot.building}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Floor Level</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {slot.floor}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Slot Type</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {slot.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Assigned Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {assignedDateFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Realtime occupancy toggle:
                  </p>
                  <button
                    onClick={() => handleToggleStatus(slot.slotId, slot.status)}
                    disabled={updatingId === slot.slotId}
                    className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow transition-all ${
                      slot.status === 'Occupied'
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-rose-600 hover:bg-rose-500'
                    } disabled:opacity-50 shrink-0 cursor-pointer`}
                  >
                    {updatingId === slot.slotId ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Car className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {slot.status === 'Occupied' ? 'Mark Available' : 'Mark Occupied'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Society Parking Rules & Regulations Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          <span>Society Parking Rules & Regulations</span>
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Assigned Spot Policy</span>
            </div>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Residents must park strictly within their allocated slot limits. Parking in designated visitor or neighbor slots is strictly prohibited.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold">
              <Clock className="w-4 h-4" />
              <span>Visitor Pass Rule</span>
            </div>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Guest vehicles must obtain a digital gate pass prior to entry. Maximum visitor slot booking duration is 24 consecutive hours.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>Speed & Safety Limit</span>
            </div>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Maximum drive speed inside basement and podium ramps is 10 km/h. Reverse parking into bays is required for emergency safety.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>EV Charging Bays</span>
            </div>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              EV charging slots are reserved for active EV vehicle charging sessions only. Disconnect and move vehicle within 30 minutes after completion.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Towing & Fine Policy</span>
            </div>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Unauthorized parking or blocking driveways incurs an immediate ₹500 fine and wheel-clamping by security staff.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 font-bold">
              <PhoneCall className="w-4 h-4" />
              <span>Security Gate Contact</span>
            </div>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              For parking disputes or blocked bay assistance, contact the Main Security Desk directly at Intercom #100 or +91 98765 43210.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
