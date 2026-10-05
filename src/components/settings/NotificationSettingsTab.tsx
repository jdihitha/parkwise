import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Calendar, LogIn, ShieldAlert, SquareParking, Megaphone, Mail, Save } from 'lucide-react';
import { notificationSettingsSchema, NotificationSettingsFormData } from '../../utils/settingsSchemas';
import { SystemSettings } from '../../types';

interface NotificationSettingsTabProps {
  settings: SystemSettings;
  onSave: (data: Partial<SystemSettings>) => Promise<void>;
  saving: boolean;
}

export const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({ settings, onSave, saving }) => {
  const { register, handleSubmit, reset } = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      notifyBookings: settings.notifyBookings ?? true,
      notifyVisitors: settings.notifyVisitors ?? true,
      notifyViolations: settings.notifyViolations ?? true,
      notifyParkingAlerts: settings.notifyParkingAlerts ?? true,
      notifyAnnouncements: settings.notifyAnnouncements ?? true,
      notifyEmail: settings.notifyEmail ?? false
    }
  });

  useEffect(() => {
    reset({
      notifyBookings: settings.notifyBookings ?? true,
      notifyVisitors: settings.notifyVisitors ?? true,
      notifyViolations: settings.notifyViolations ?? true,
      notifyParkingAlerts: settings.notifyParkingAlerts ?? true,
      notifyAnnouncements: settings.notifyAnnouncements ?? true,
      notifyEmail: settings.notifyEmail ?? false
    });
  }, [settings, reset]);

  const onSubmit = async (data: NotificationSettingsFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span>Automated Notification & Alert Preferences</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system broadcasts, gate alert triggers, email digests & push event channels
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Booking Notifications */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Visitor Booking Alerts
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Notify residents when guest bookings are created, approved, or rejected
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('notifyBookings')}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* Visitor Entry/Exit Notifications */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Gate Entry & Exit Alerts
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Send realtime notifications when visitors check in or check out at society security gate
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('notifyVisitors')}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* Violation Notifications */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Security & Parking Violation Notices
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Instantly notify vehicle owners when fine penalties or illegal parking logs are issued
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('notifyViolations')}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* Parking Space Alerts */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <SquareParking className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Slot Occupancy & Capacity Alerts
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Alert security staff when visitor parking capacity reaches 90%+ capacity
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('notifyParkingAlerts')}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* System Announcements */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Society Broadcast Announcements
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Deliver general society maintenance and emergency announcements to resident dashboards
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('notifyAnnouncements')}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Email Digest & Copy Dispatch
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Forward high-priority security notifications to user registered email addresses
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('notifyEmail')}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Notification Preferences</span>
        </button>
      </div>
    </form>
  );
};
