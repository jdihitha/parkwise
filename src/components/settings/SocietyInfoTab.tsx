import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building, Home, Users, DoorOpen, PhoneCall, Save } from 'lucide-react';
import { societyInfoSchema, SocietyInfoFormData } from '../../utils/settingsSchemas';
import { SystemSettings } from '../../types';

interface SocietyInfoTabProps {
  settings: SystemSettings;
  onSave: (data: Partial<SystemSettings>) => Promise<void>;
  saving: boolean;
}

export const SocietyInfoTab: React.FC<SocietyInfoTabProps> = ({ settings, onSave, saving }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SocietyInfoFormData>({
    resolver: zodResolver(societyInfoSchema),
    defaultValues: {
      totalTowers: settings.totalTowers || 6,
      totalFlats: settings.totalFlats || 180,
      maintenanceStaffCount: settings.maintenanceStaffCount || 12,
      gateEntryPoints: settings.gateEntryPoints || 3,
      emergencyContact: settings.emergencyContact || '+1 (555) 911-0000'
    }
  });

  useEffect(() => {
    reset({
      totalTowers: settings.totalTowers || 6,
      totalFlats: settings.totalFlats || 180,
      maintenanceStaffCount: settings.maintenanceStaffCount || 12,
      gateEntryPoints: settings.gateEntryPoints || 3,
      emergencyContact: settings.emergencyContact || '+1 (555) 911-0000'
    });
  }, [settings, reset]);

  const onSubmit = async (data: SocietyInfoFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Building className="w-5 h-5 text-cyan-500" />
            <span>Society Infrastructure & Housing Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record tower count, housing unit numbers, security gates & emergency phone helplines
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Total Towers / Wings */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Wings / Towers</span>
          </label>
          <input
            type="number"
            {...register('totalTowers', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {errors.totalTowers && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.totalTowers.message}</p>
          )}
        </div>

        {/* Total Flats */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Residential Flats / Units</span>
          </label>
          <input
            type="number"
            {...register('totalFlats', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {errors.totalFlats && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.totalFlats.message}</p>
          )}
        </div>

        {/* Maintenance Staff Count */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Security & Maintenance Staff Count</span>
          </label>
          <input
            type="number"
            {...register('maintenanceStaffCount', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {errors.maintenanceStaffCount && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.maintenanceStaffCount.message}</p>
          )}
        </div>

        {/* Gate Entry Points */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Active Gate Entry Terminals</span>
          </label>
          <input
            type="number"
            {...register('gateEntryPoints', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {errors.gateEntryPoints && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.gateEntryPoints.message}</p>
          )}
        </div>

        {/* Emergency Helpline */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
            <span>24/7 Gate & Emergency Helpline Number</span>
          </label>
          <input
            type="text"
            {...register('emergencyContact')}
            placeholder="+1 (555) 911-0000"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {errors.emergencyContact && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.emergencyContact.message}</p>
          )}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Society Information</span>
        </button>
      </div>
    </form>
  );
};
