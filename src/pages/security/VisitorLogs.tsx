import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  Search,
  Calendar,
  User,
  Car,
  Clock,
  Filter,
  ArrowUpDown,
  Download,
  Loader2,
  Shield,
  CheckCircle2,
  LogOut,
  ParkingSquare
} from 'lucide-react';
import { visitorLogService } from '../../services/visitorLogService';
import { EmptyState } from '../../components/EmptyState';
import { VisitorLog } from '../../types';

export const VisitorLogs: React.FC = () => {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'Today' | 'This Week' | 'All'>('Today');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Checked In' | 'Checked Out'>('All');
  const [sortOrder, setSortOrder] = useState<'Newest First' | 'Oldest First'>('Newest First');

  useEffect(() => {
    // Realtime subscription using onSnapshot()
    const unsub = visitorLogService.subscribeToLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const filtered = logs.filter((log) => {
    // Search query match
    const matchesSearch =
      log.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.residentName && log.residentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.bookingId && log.bookingId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.securityName && log.securityName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Time filter
    const entryDate = new Date(log.entryTime);
    if (timeFilter === 'Today') {
      const isToday = log.entryTime && log.entryTime.startsWith(todayStr);
      if (!isToday) return false;
    } else if (timeFilter === 'This Week') {
      if (entryDate < oneWeekAgo) return false;
    }

    // Status filter
    if (statusFilter === 'Checked In') {
      const isCheckedIn = !log.exitTime && log.status !== 'Completed' && log.status !== 'Checked Out';
      if (!isCheckedIn) return false;
    } else if (statusFilter === 'Checked Out') {
      const isCheckedOut = !!log.exitTime || log.status === 'Completed' || log.status === 'Checked Out';
      if (!isCheckedOut) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    const timeA = new Date(a.entryTime).getTime();
    const timeB = new Date(b.entryTime).getTime();
    return sortOrder === 'Newest First' ? timeB - timeA : timeA - timeB;
  });

  // Export CSV Helper
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Log ID',
      'Guest Name',
      'Vehicle Number',
      'Resident / Flat',
      'Parking Slot',
      'Entry Time',
      'Exit Time',
      'Duration',
      'Gate Officer',
      'Status'
    ];

    const rows = filtered.map((l) => {
      const entry = new Date(l.entryTime);
      const exit = l.exitTime ? new Date(l.exitTime) : null;
      let dur = 'Active';
      if (exit) {
        const mins = Math.floor((exit.getTime() - entry.getTime()) / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        dur = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }

      return [
        l.logId,
        `"${l.guestName}"`,
        `"${l.vehicleNumber}"`,
        `"${l.residentName || ''} (${l.flatNumber})"`,
        `"${l.slotNumber || l.slotId || 'Visitor Bay'}"`,
        `"${entry.toLocaleString()}"`,
        `"${exit ? exit.toLocaleString() : 'N/A'}"`,
        `"${dur}"`,
        `"${l.securityName || 'Security'}"`,
        `"${!l.exitTime ? 'Checked In' : 'Checked Out'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ParkWise_Visitor_Logs_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-500" />
            <span>Gate Visitor Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime audit log register of vehicle entries, stay durations, gate officers, and slot releases in Firestore.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Register</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Guest Name, Vehicle Plate, Resident, Booking ID..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter */}
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="All">All Time</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
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
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs text-slate-400">Loading realtime visitor logs from Firestore...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No Visitor Logs Found"
          description={
            searchQuery || timeFilter !== 'All' || statusFilter !== 'All'
              ? 'No visitor log records match your current filter and search settings.'
              : 'Visitor log register is currently empty in Firestore.'
          }
        />
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Guest Name</th>
                <th className="px-6 py-4">Resident & Flat</th>
                <th className="px-6 py-4">Vehicle Plate</th>
                <th className="px-6 py-4">Parking Slot</th>
                <th className="px-6 py-4">Entry Time</th>
                <th className="px-6 py-4">Exit Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Security Staff</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filtered.map((log) => {
                const entryDate = new Date(log.entryTime);
                const exitDate = log.exitTime ? new Date(log.exitTime) : null;

                let durationStr = 'Active / Inside';
                if (exitDate) {
                  const durationMins = Math.floor(
                    (exitDate.getTime() - entryDate.getTime()) / (1000 * 60)
                  );
                  const h = Math.floor(durationMins / 60);
                  const m = durationMins % 60;
                  durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                }

                const isCheckedIn = !log.exitTime && log.status !== 'Completed' && log.status !== 'Checked Out';

                return (
                  <tr
                    key={log.logId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      <div>{log.guestName}</div>
                      {log.bookingId && log.bookingId !== 'walk-in' && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{log.bookingId.slice(-6).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{log.residentName || 'Resident'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Flat: {log.flatNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {log.vehicleNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-teal-600 dark:text-teal-400">
                      {log.slotNumber || log.slotId || 'Visitor Bay'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {entryDate.toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {exitDate
                        ? exitDate.toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {durationStr}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {log.securityName || 'Gate Officer'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCheckedIn
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isCheckedIn ? 'Checked In' : 'Checked Out'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
