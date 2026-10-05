import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  ShieldAlert,
  Calendar,
  Info,
  Car,
  ShieldCheck,
  Megaphone,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';

export const NotificationPopover: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userProfile?.uid) return;
    const unsubscribe = notificationService.subscribeToUserNotifications(
      userProfile.uid,
      (data) => setNotifications(data)
    );
    return () => unsubscribe();
  }, [userProfile?.uid]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const latestFive = notifications.slice(0, 5);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userProfile?.uid) {
      await notificationService.markAllAsRead(userProfile.uid);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      await notificationService.markAsRead(item.notificationId);
    }
    setIsOpen(false);
    navigate('/notifications');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteNotification(id);
  };

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'Violation':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'Booking':
        return <Calendar className="w-4 h-4 text-teal-500" />;
      case 'Parking':
        return <Car className="w-4 h-4 text-emerald-500" />;
      case 'Security':
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case 'Announcement':
        return <Megaphone className="w-4 h-4 text-indigo-500" />;
      case 'System':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {latestFive.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              latestFive.map((item) => (
                <div
                  key={item.notificationId}
                  onClick={() => handleNotificationClick(item)}
                  className={`group p-4 flex items-start space-x-3 cursor-pointer transition-colors ${
                    !item.read
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(item.notificationId, e)}
                    className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center space-x-1.5 w-full py-1"
            >
              <span>View All Notifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
