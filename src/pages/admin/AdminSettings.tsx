import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Building2,
  SquareParking,
  UserCheck,
  Bell,
  ShieldCheck,
  Palette,
  Building,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Clock,
  Shield,
  Layers
} from 'lucide-react';
import { FirebaseStatusBanner } from '../../components/FirebaseStatusBanner';
import { useToast } from '../../contexts/ToastContext';
import { settingsService, DEFAULT_SETTINGS } from '../../services/settingsService';
import { SystemSettings } from '../../types';

import { GeneralTab } from '../../components/settings/GeneralTab';
import { ParkingRulesTab } from '../../components/settings/ParkingRulesTab';
import { VisitorRulesTab } from '../../components/settings/VisitorRulesTab';
import { NotificationSettingsTab } from '../../components/settings/NotificationSettingsTab';
import { SecuritySettingsTab } from '../../components/settings/SecuritySettingsTab';
import { AppearanceTab } from '../../components/settings/AppearanceTab';
import { SocietyInfoTab } from '../../components/settings/SocietyInfoTab';

export type SettingsTabId =
  | 'general'
  | 'parking'
  | 'visitor'
  | 'notifications'
  | 'security'
  | 'appearance'
  | 'society';

interface TabItem {
  id: SettingsTabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  color: string;
}

const TABS: TabItem[] = [
  { id: 'general', label: 'General', icon: Building2, color: 'text-purple-500' },
  { id: 'parking', label: 'Parking Rules', icon: SquareParking, color: 'text-emerald-500' },
  { id: 'visitor', label: 'Visitor Rules', icon: UserCheck, color: 'text-indigo-500' },
  { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-blue-500' },
  { id: 'security', label: 'Security', icon: ShieldCheck, color: 'text-amber-500' },
  { id: 'appearance', label: 'Appearance', icon: Palette, color: 'text-pink-500' },
  { id: 'society', label: 'Society Info', icon: Building, color: 'text-cyan-500' }
];

export const AdminSettings: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Realtime Firestore Subscription with onSnapshot()
  useEffect(() => {
    setLoading(true);
    const unsubscribe = settingsService.subscribeToSettings((data) => {
      setSettings(data);
      if (data.updatedAt) {
        setLastSaved(data.updatedAt);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveSettings = async (updates: Partial<SystemSettings>) => {
    setSaving(true);
    // Optimistic state update
    const previousSettings = { ...settings };
    const updatedSettings = { ...settings, ...updates, updatedAt: new Date().toISOString() };
    setSettings(updatedSettings);

    try {
      await settingsService.updateSettings(updates);
      setLastSaved(new Date().toISOString());
      showToast('success', 'Settings Saved', 'System configuration updated successfully in Firestore.');
    } catch (err) {
      console.error('Failed to update settings:', err);
      // Revert optimistic state on error
      setSettings(previousSettings);
      showToast('error', 'Update Failed', 'Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>System & Society Settings</span>
                <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Realtime Firestore Sync
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage global society rules, parking slot allocations, gate security passes, and system theme preferences.
              </p>
            </div>
          </div>
        </div>

        {lastSaved && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl self-start md:self-auto border border-slate-200/60 dark:border-slate-700/60">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Last updated: {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      <FirebaseStatusBanner />

      {/* Quick Overview Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">Society</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{settings.societyName}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <SquareParking className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">Max Visitor Slots</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{settings.maxVisitorParkingSlots} Slots</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">Auto Approval</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {settings.visitorAutoApproval ? 'Enabled' : 'Manual Queue'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">Gate Entry Posts</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{settings.gateEntryPoints} Active Gates</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1.5 overflow-x-auto p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
                isActive
                  ? 'text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="settingsActiveTabIndicator"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? tab.color : 'text-slate-400'}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Card Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative min-h-[420px]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-xs font-medium">Syncing live settings from Firestore...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'general' && (
                <GeneralTab settings={settings} onSave={handleSaveSettings} saving={saving} />
              )}
              {activeTab === 'parking' && (
                <ParkingRulesTab settings={settings} onSave={handleSaveSettings} saving={saving} />
              )}
              {activeTab === 'visitor' && (
                <VisitorRulesTab settings={settings} onSave={handleSaveSettings} saving={saving} />
              )}
              {activeTab === 'notifications' && (
                <NotificationSettingsTab settings={settings} onSave={handleSaveSettings} saving={saving} />
              )}
              {activeTab === 'security' && (
                <SecuritySettingsTab settings={settings} onSave={handleSaveSettings} saving={saving} />
              )}
              {activeTab === 'appearance' && (
                <AppearanceTab settings={settings} onSave={handleSaveSettings} saving={saving} />
              )}
              {activeTab === 'society' && (
                <SocietyInfoTab settings={settings} onSave={handleSaveSettings} saving={saving} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
