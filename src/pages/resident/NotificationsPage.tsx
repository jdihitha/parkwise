import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Search,
  Filter,
  ArrowUpDown,
  Check,
  Loader2,
  XCircle,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState } from '../../components/EmptyState';
import { NotificationItem, NotificationType } from '../../types';

export const NotificationsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState<'All' | 'Unread' | 'Read'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');

  // Actions loading states
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [deletingAllRead, setDeletingAllRead] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = notificationService.subscribeToUserNotifications(
      userProfile.uid,
      (data) => {
        setNotifications(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const handleMarkRead = async (id: string) => {
    setActionId(id);
    try {
      await notificationService.markAsRead(id);
    } catch (err: any) {
      showToast('error', 'Error', 'Failed to mark notification as read.');
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userProfile?.uid) return;
    setMarkingAllRead(true);
    try {
      await notificationService.markAllAsRead(userProfile.uid);
      showToast('success', 'Marked All Read', 'All notifications have been marked as read.');
    } catch (err: any) {
      showToast('error', 'Error', 'Failed to mark all as read.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionId(id);
    try {
      await notificationService.deleteNotification(id);
      showToast('info', 'Deleted', 'Notification removed.');
    } catch (err: any) {
      showToast('error', 'Error', 'Failed to delete notification.');
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!userProfile?.uid) return;
    setDeletingAllRead(true);
    try {
      await notificationService.deleteAllReadNotifications(userProfile.uid);
      showToast('success', 'Cleared Read Items', 'All read notifications deleted.');
    } catch (err: any) {
      showToast('error', 'Error', 'Failed to delete read notifications.');
    } finally {
      setDeletingAllRead(false);
    }
  };

  // Filter & Search Logic
  const filtered = notifications.filter((item) => {
    // Search Title or Message
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Read/Unread Filter
    if (readFilter === 'Unread' && item.read) return false;
    if (readFilter === 'Read' && !item.read) return false;

    // Type Filter
    if (typeFilter !== 'All' && item.type !== typeFilter) return false;

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'Newest' ? timeB - timeA : timeA - timeB;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'Violation':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'Booking':
        return <Calendar className="w-5 h-5 text-teal-500" />;
      case 'Parking':
        return <Car className="w-5 h-5 text-emerald-500" />;
      case 'Security':
        return <ShieldCheck className="w-5 h-5 text-amber-500" />;
      case 'Announcement':
        return <Megaphone className="w-5 h-5 text-indigo-500" />;
      case 'System':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeBadgeColor = (type: NotificationType) => {
    switch (type) {
      case 'Violation':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Booking':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'Parking':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Security':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Announcement':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'System':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
            <div className="relative">
              <Bell className="w-7 h-7 text-emerald-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <span>Notifications Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime activity feed, visitor gate pass updates, parking assignments, and society notices.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {markingAllRead ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}

          {readCount > 0 && (
            <button
              onClick={handleDeleteAllRead}
              disabled={deletingAllRead}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-all disabled:opacity-50 border border-slate-200 dark:border-slate-700"
            >
              {deletingAllRead ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Clear Read ({readCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title or keyword..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Read / Unread Status Filter */}
            <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
              {(['All', 'Unread', 'Read'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setReadFilter(status)}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    readFilter === status
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Booking">Booking</option>
                <option value="Parking">Parking</option>
                <option value="Violation">Violation</option>
                <option value="Security">Security</option>
                <option value="Announcement">Announcement</option>
                <option value="System">System</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Newest">Newest First</option>
                <option value="Oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Skeleton Loading State */
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse flex items-start justify-between gap-4"
            >
              <div className="flex items-start space-x-4 w-full">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4" />
                  <div className="h-2 bg-slate-100 dark:bg-slate-800/40 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Notifications Found"
          description={
            searchQuery || readFilter !== 'All' || typeFilter !== 'All'
              ? 'No notifications match your current search and filter settings.'
              : 'Your notification center is completely empty.'
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((item) => {
              const isProcessing = actionId === item.notificationId;

              return (
                <motion.div
                  key={item.notificationId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, margin: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => !item.read && handleMarkRead(item.notificationId)}
                  className={`group relative p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer ${
                    !item.read
                      ? 'bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-500/40 shadow-sm hover:border-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Type Icon */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shadow-xs shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>

                        {/* Unread Badge */}
                        {!item.read ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>Unread</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <Check className="w-3 h-3 text-slate-400" />
                            <span>Read</span>
                          </span>
                        )}

                        {/* Type Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getTypeBadgeColor(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Timestamp */}
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 pt-1">
                        {new Date(item.createdAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                    {!item.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(item.notificationId);
                        }}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 text-xs font-bold transition-all"
                        title="Mark as Read"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Mark Read</span>
                        )}
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDelete(item.notificationId, e)}
                      disabled={isProcessing}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all"
                      title="Delete Notification"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
