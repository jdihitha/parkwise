import React, { useState } from 'react';
import { Menu, Sun, Moon, Search, LogOut, User, Shield, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationPopover } from './NotificationPopover';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Security':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Resident':
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left section: Mobile menu button & Search */}
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search slots, vehicles, bookings..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all focus:outline-none"
            />
          </div>
        </div>

        {/* Right section: Theme, Notifications, User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-600" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>

          {/* Notifications */}
          <NotificationPopover />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                  {userProfile?.name || 'User'}
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${getRoleBadge(userProfile?.role)}`}>
                    {userProfile?.role || 'Resident'}
                  </span>
                  {userProfile?.flatNumber && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({userProfile.flatNumber})
                    </span>
                  )}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {userProfile?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {userProfile?.email}
                  </p>
                </div>

                <div className="py-1">
                  <a
                    href="#/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-4 h-4 text-emerald-500" />
                    <span>My Profile</span>
                  </a>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
