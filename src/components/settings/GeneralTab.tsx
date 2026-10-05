import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Mail, Phone, MapPin, Globe, Image as ImageIcon, Save, CheckCircle2 } from 'lucide-react';
import { generalSettingsSchema, GeneralSettingsFormData } from '../../utils/settingsSchemas';
import { SystemSettings } from '../../types';

interface GeneralTabProps {
  settings: SystemSettings;
  onSave: (data: Partial<SystemSettings>) => Promise<void>;
  saving: boolean;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ settings, onSave, saving }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      societyName: settings.societyName || '',
      societyAddress: settings.societyAddress || '',
      contactPhone: settings.contactPhone || '',
      contactEmail: settings.contactEmail || '',
      timezone: settings.timezone || 'America/Los_Angeles (PST)',
      societyLogo: settings.societyLogo || ''
    }
  });

  useEffect(() => {
    reset({
      societyName: settings.societyName || '',
      societyAddress: settings.societyAddress || '',
      contactPhone: settings.contactPhone || '',
      contactEmail: settings.contactEmail || '',
      timezone: settings.timezone || 'America/Los_Angeles (PST)',
      societyLogo: settings.societyLogo || ''
    });
  }, [settings, reset]);

  const onSubmit = async (data: GeneralSettingsFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            <span>General Society Settings</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure primary branding, contact information, and operating timezone
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Society Name */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Society Name</span>
          </label>
          <input
            type="text"
            {...register('societyName')}
            placeholder="e.g. ParkWise Grand Residency"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors.societyName && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.societyName.message}</p>
          )}
        </div>

        {/* Society Address */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Society Address</span>
          </label>
          <textarea
            rows={2}
            {...register('societyAddress')}
            placeholder="Complete street address, block, city & zip code"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          {errors.societyAddress && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.societyAddress.message}</p>
          )}
        </div>

        {/* Contact Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>Contact Number</span>
          </label>
          <input
            type="text"
            {...register('contactPhone')}
            placeholder="+1 (555) 019-2831"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors.contactPhone && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.contactPhone.message}</p>
          )}
        </div>

        {/* Support Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Support Email</span>
          </label>
          <input
            type="email"
            {...register('contactEmail')}
            placeholder="support@parkwise.io"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors.contactEmail && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.contactEmail.message}</p>
          )}
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Operating Timezone</span>
          </label>
          <select
            {...register('timezone')}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="America/Los_Angeles (PST)">Pacific Time (PST/PDT)</option>
            <option value="America/Denver (MST)">Mountain Time (MST/MDT)</option>
            <option value="America/Chicago (CST)">Central Time (CST/CDT)</option>
            <option value="America/New_York (EST)">Eastern Time (EST/EDT)</option>
            <option value="Europe/London (GMT)">Greenwich Mean Time (GMT/BST)</option>
            <option value="Asia/Kolkata (IST)">India Standard Time (IST)</option>
            <option value="UTC">Coordinated Universal Time (UTC)</option>
          </select>
          {errors.timezone && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.timezone.message}</p>
          )}
        </div>

        {/* Society Logo URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Society Logo URL (Future Ready)</span>
          </label>
          <input
            type="text"
            {...register('societyLogo')}
            placeholder="https://example.com/logo.png"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save General Settings</span>
        </button>
      </div>
    </form>
  );
};
