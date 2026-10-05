import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Palette, Sun, Moon, Laptop, Maximize2, Minimize2, Check, Save } from 'lucide-react';
import { appearanceSettingsSchema, AppearanceSettingsFormData } from '../../utils/settingsSchemas';
import { SystemSettings } from '../../types';

interface AppearanceTabProps {
  settings: SystemSettings;
  onSave: (data: Partial<SystemSettings>) => Promise<void>;
  saving: boolean;
}

const ACCENT_COLORS = [
  { name: 'Purple', hex: '#a855f7', bgClass: 'bg-purple-500' },
  { name: 'Indigo', hex: '#6366f1', bgClass: 'bg-indigo-500' },
  { name: 'Blue', hex: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Emerald', hex: '#10b981', bgClass: 'bg-emerald-500' },
  { name: 'Rose', hex: '#f43f5e', bgClass: 'bg-rose-500' },
  { name: 'Amber', hex: '#f59e0b', bgClass: 'bg-amber-500' }
];

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ settings, onSave, saving }) => {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AppearanceSettingsFormData>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      theme: settings.theme || 'System',
      primaryAccentColor: settings.primaryAccentColor || '#a855f7',
      compactMode: settings.compactMode ?? false
    }
  });

  const selectedTheme = watch('theme');
  const selectedColor = watch('primaryAccentColor');

  useEffect(() => {
    reset({
      theme: settings.theme || 'System',
      primaryAccentColor: settings.primaryAccentColor || '#a855f7',
      compactMode: settings.compactMode ?? false
    });
  }, [settings, reset]);

  const onSubmit = async (data: AppearanceSettingsFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Palette className="w-5 h-5 text-pink-500" />
            <span>Theme & Visual Personalization</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select system appearance theme mode, primary highlight color & density preferences
          </p>
        </div>
      </div>

      {/* Theme Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Color Theme Mode
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'Light', label: 'Light Mode', icon: Sun },
            { id: 'Dark', label: 'Dark Mode', icon: Moon },
            { id: 'System', label: 'System Default', icon: Laptop }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedTheme === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setValue('theme', item.id as 'Light' | 'Dark' | 'System')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                  isSelected
                    ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold shadow-sm ring-2 ring-pink-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color Palette */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Primary Accent Color
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {ACCENT_COLORS.map((c) => {
            const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                type="button"
                key={c.hex}
                onClick={() => setValue('primaryAccentColor', c.hex)}
                className={`p-3 rounded-2xl border flex items-center space-x-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-pink-500 bg-pink-500/10 text-slate-900 dark:text-slate-100 font-bold ring-2 ring-pink-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${c.bgClass} flex items-center justify-center shrink-0`}>
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className="text-xs truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Density Mode Toggle */}
      <div className="pt-2">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400">
              {watch('compactMode') ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Compact Data Layout Mode
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Reduce table padding and row heights to display maximum records per view
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('compactMode')}
            className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Appearance Settings</span>
        </button>
      </div>
    </form>
  );
};
