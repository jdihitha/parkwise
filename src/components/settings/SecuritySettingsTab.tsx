import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Lock, KeyRound, UserCheck, ShieldAlert, Save } from 'lucide-react';
import { securitySettingsSchema, SecuritySettingsFormData } from '../../utils/settingsSchemas';
import { SystemSettings } from '../../types';

interface SecuritySettingsTabProps {
  settings: SystemSettings;
  onSave: (data: Partial<SystemSettings>) => Promise<void>;
  saving: boolean;
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ settings, onSave, saving }) => {
  const { register, handleSubmit, reset } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      requireEntryVerification: settings.requireEntryVerification ?? true,
      requireExitVerification: settings.requireExitVerification ?? true,
      allowManualEntry: settings.allowManualEntry ?? true,
      allowManualExit: settings.allowManualExit ?? true,
      enableOtpVerification: settings.enableOtpVerification ?? false,
      securityGatePassRequired: settings.securityGatePassRequired ?? true
    }
  });

  useEffect(() => {
    reset({
      requireEntryVerification: settings.requireEntryVerification ?? true,
      requireExitVerification: settings.requireExitVerification ?? true,
      allowManualEntry: settings.allowManualEntry ?? true,
      allowManualExit: settings.allowManualExit ?? true,
      enableOtpVerification: settings.enableOtpVerification ?? false,
      securityGatePassRequired: settings.securityGatePassRequired ?? true
    });
  }, [settings, reset]);

  const onSubmit = async (data: SecuritySettingsFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Gate Control & Security Protocols</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure entry/exit checkpoint strictness, manual security guard overrides & OTP verification
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Mandate Gate Pass */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Mandatory Digital Gate Pass Requirement
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Require pre-registered digital pass for all guest vehicles attempting entry
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('securityGatePassRequired')}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* Require Entry Verification */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Security Guard Entry Checkpoint Scan
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Enforce active verification by security guard before marking vehicle entry in logs
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('requireEntryVerification')}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* Require Exit Verification */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Security Guard Exit Checkpoint Clearance
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Require security guard confirmation when visitor vehicles exit society premises
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('requireExitVerification')}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* Allow Manual Entry */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Allow Emergency Manual Entry Log
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Permit security staff to log unannounced guest entry manually during system downtime
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('allowManualEntry')}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* Allow Manual Exit */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Allow Manual Exit Overrides
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Allow security guards to force check-out vehicles if resident booking was removed
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('allowManualExit')}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* OTP Verification Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Future OTP Gate Pass Verification (Upcoming Feature)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Require 6-digit SMS OTP verification for visitor entry validation at gate terminal
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('enableOtpVerification')}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Security Settings</span>
        </button>
      </div>
    </form>
  );
};
