import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SquareParking, Car, Zap, Accessibility, Clock, DollarSign, Save } from 'lucide-react';
import { parkingRulesSchema, ParkingRulesFormData } from '../../utils/settingsSchemas';
import { SystemSettings } from '../../types';

interface ParkingRulesTabProps {
  settings: SystemSettings;
  onSave: (data: Partial<SystemSettings>) => Promise<void>;
  saving: boolean;
}

export const ParkingRulesTab: React.FC<ParkingRulesTabProps> = ({ settings, onSave, saving }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ParkingRulesFormData>({
    resolver: zodResolver(parkingRulesSchema),
    defaultValues: {
      maxVehiclesPerResident: settings.maxVehiclesPerResident || 2,
      maxVisitorParkingSlots: settings.maxVisitorParkingSlots || 25,
      reservedParkingPercentage: settings.reservedParkingPercentage || 15,
      enableEVParking: settings.enableEVParking ?? true,
      enableDisabledParking: settings.enableDisabledParking ?? true,
      parkingTimings: settings.parkingTimings || '24/7 (00:00 - 23:59)',
      totalSlots: settings.totalSlots || 120,
      finePerViolation: settings.finePerViolation || 50
    }
  });

  useEffect(() => {
    reset({
      maxVehiclesPerResident: settings.maxVehiclesPerResident || 2,
      maxVisitorParkingSlots: settings.maxVisitorParkingSlots || 25,
      reservedParkingPercentage: settings.reservedParkingPercentage || 15,
      enableEVParking: settings.enableEVParking ?? true,
      enableDisabledParking: settings.enableDisabledParking ?? true,
      parkingTimings: settings.parkingTimings || '24/7 (00:00 - 23:59)',
      totalSlots: settings.totalSlots || 120,
      finePerViolation: settings.finePerViolation || 50
    });
  }, [settings, reset]);

  const onSubmit = async (data: ParkingRulesFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <SquareParking className="w-5 h-5 text-emerald-500" />
            <span>Parking Space & Slot Allocation Rules</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure slot quotas, EV charging availability, accessible bays & fine structures
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Maximum Vehicles Per Resident */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span>Max Vehicles Allowed Per Resident</span>
          </label>
          <input
            type="number"
            {...register('maxVehiclesPerResident', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.maxVehiclesPerResident && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.maxVehiclesPerResident.message}</p>
          )}
        </div>

        {/* Maximum Visitor Slots */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <SquareParking className="w-3.5 h-3.5 text-slate-400" />
            <span>Max Visitor Parking Slots</span>
          </label>
          <input
            type="number"
            {...register('maxVisitorParkingSlots', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.maxVisitorParkingSlots && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.maxVisitorParkingSlots.message}</p>
          )}
        </div>

        {/* Reserved Parking Percentage */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <span>Reserved Parking Ratio (%)</span>
          </label>
          <input
            type="number"
            {...register('reservedParkingPercentage', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.reservedParkingPercentage && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.reservedParkingPercentage.message}</p>
          )}
        </div>

        {/* Total Slots Capacity */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <span>Total Parking Capacity (Slots)</span>
          </label>
          <input
            type="number"
            {...register('totalSlots', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.totalSlots && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.totalSlots.message}</p>
          )}
        </div>

        {/* Parking Timings */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Parking Operating Hours</span>
          </label>
          <input
            type="text"
            {...register('parkingTimings')}
            placeholder="e.g. 24/7 (00:00 - 23:59)"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.parkingTimings && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.parkingTimings.message}</p>
          )}
        </div>

        {/* Default Fine Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Standard Fine Per Violation ($)</span>
          </label>
          <input
            type="number"
            {...register('finePerViolation', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.finePerViolation && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.finePerViolation.message}</p>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Enable EV Charging Bays
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Reserve dedicated electric vehicle charging slots on ground levels
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('enableEVParking')}
            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Accessibility className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Enable Accessible / Disabled Parking Bays
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Designate priority handicap parking slots near elevators
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('enableDisabledParking')}
            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Parking Rules</span>
        </button>
      </div>
    </form>
  );
};
