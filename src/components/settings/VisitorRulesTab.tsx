import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck, Clock, Calendar, CheckCircle2, ShieldCheck, Save } from 'lucide-react';
import { visitorRulesSchema, VisitorRulesFormData } from '../../utils/settingsSchemas';
import { SystemSettings } from '../../types';

interface VisitorRulesTabProps {
  settings: SystemSettings;
  onSave: (data: Partial<SystemSettings>) => Promise<void>;
  saving: boolean;
}

export const VisitorRulesTab: React.FC<VisitorRulesTabProps> = ({ settings, onSave, saving }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<VisitorRulesFormData>({
    resolver: zodResolver(visitorRulesSchema),
    defaultValues: {
      visitorStartTime: settings.visitorStartTime || '06:00',
      visitorEndTime: settings.visitorEndTime || '23:00',
      maxBookingHours: settings.maxBookingHours || 12,
      advanceBookingLimitDays: settings.advanceBookingLimitDays || 7,
      allowWeekendVisitors: settings.allowWeekendVisitors ?? true,
      autoExpireBooking: settings.autoExpireBooking ?? true,
      visitorAutoApproval: settings.visitorAutoApproval ?? true
    }
  });

  useEffect(() => {
    reset({
      visitorStartTime: settings.visitorStartTime || '06:00',
      visitorEndTime: settings.visitorEndTime || '23:00',
      maxBookingHours: settings.maxBookingHours || 12,
      advanceBookingLimitDays: settings.advanceBookingLimitDays || 7,
      allowWeekendVisitors: settings.allowWeekendVisitors ?? true,
      autoExpireBooking: settings.autoExpireBooking ?? true,
      visitorAutoApproval: settings.visitorAutoApproval ?? true
    });
  }, [settings, reset]);

  const onSubmit = async (data: VisitorRulesFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-indigo-500" />
            <span>Visitor Management & Gate Pass Policies</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define operating hours for guest entry, pass duration caps, advance booking windows & auto-approvals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Visitor Start Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Visitor Entry Start Time</span>
          </label>
          <input
            type="time"
            {...register('visitorStartTime')}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.visitorStartTime && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.visitorStartTime.message}</p>
          )}
        </div>

        {/* Visitor End Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Visitor Entry End Time</span>
          </label>
          <input
            type="time"
            {...register('visitorEndTime')}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.visitorEndTime && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.visitorEndTime.message}</p>
          )}
        </div>

        {/* Maximum Booking Duration */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Maximum Booking Duration (Hours)</span>
          </label>
          <input
            type="number"
            {...register('maxBookingHours', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.maxBookingHours && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.maxBookingHours.message}</p>
          )}
        </div>

        {/* Advance Booking Limit */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Advance Booking Window (Days)</span>
          </label>
          <input
            type="number"
            {...register('advanceBookingLimitDays', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.advanceBookingLimitDays && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.advanceBookingLimitDays.message}</p>
          )}
        </div>
      </div>

      {/* Policy Switches */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Auto-Approve Resident Guest Passes
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically approve visitor bookings made by verified residents
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('visitorAutoApproval')}
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Allow Weekend Visitors
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Permit guest pass creations for Saturday & Sunday dates
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('allowWeekendVisitors')}
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Auto Expire Unused Guest Bookings
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically invalidate guest passes if visitor does not check in before end time
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('autoExpireBooking')}
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Visitor Rules</span>
        </button>
      </div>
    </form>
  );
};
