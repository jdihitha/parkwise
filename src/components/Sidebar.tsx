import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Car,
  LayoutDashboard,
  CalendarPlus,
  BookCheck,
  Shield,
  ShieldAlert,
  Users,
  Settings,
  BarChart3,
  UserCheck,
  LogOut,
  X,
  Bell,
  ParkingSquare,
  FileSpreadsheet,
  QrCode,
  Sliders,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { userProfile, logout } = useAuth();
  const role: UserRole = userProfile?.role || 'Resident';

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'Security':
        return [
          { label: 'Security Overview', path: '/security/dashboard', icon: LayoutDashboard },
          { label: "Today's Visitors", path: '/security/today', icon: UserCheck },
          { label: 'Entry Check-In', path: '/security/entry', icon: QrCode },
          { label: 'Exit Check-Out', path: '/security/exit', icon: LogOut },
          { label: 'Visitor Logs', path: '/security/visitor-logs', icon: FileSpreadsheet },
          { label: 'Violations', path: '/security/violations', icon: ShieldAlert }
        ];
      case 'Admin':
        return [
          { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Parking Slots', path: '/admin/slots', icon: ParkingSquare },
          { label: 'User Directory', path: '/admin/users', icon: Users },
          { label: 'Visitor Rules', path: '/admin/rules', icon: Sliders },
          { label: 'Violations', path: '/admin/violations', icon: ShieldAlert },
          { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
          { label: 'Settings', path: '/admin/settings', icon: Settings }
        ];
      case 'Resident':
      default:
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'My Parking', path: '/my-parking', icon: ParkingSquare },
          { label: 'Book Visitor Slot', path: '/visitor-booking', icon: CalendarPlus },
          { label: 'My Bookings', path: '/my-bookings', icon: BookCheck },
          { label: 'My Vehicles', path: '/my-vehicles', icon: Car },
          { label: 'Notifications', path: '/notifications', icon: Bell },
          { label: 'Profile Settings', path: '/profile', icon: User }
        ];
    }
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64">
      {/* Brand Logo & Close Button */}
      <div>
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 bg-clip-text text-transparent">
                ParkWise
              </span>
              <span className="block text-[10px] font-semibold tracking-wider uppercase text-slate-400 -mt-1">
                Smart Parking
              </span>
            </div>
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Portal Label */}
        <div className="px-6 py-3">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {role} Portal
          </span>
        </div>

        {/* Navigation links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Profile Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {userProfile?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {userProfile?.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative z-10 w-64 max-w-xs flex-1">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
