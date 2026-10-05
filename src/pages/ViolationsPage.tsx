import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Car,
  User,
  ParkingSquare,
  AlertTriangle,
  Loader2,
  X,
  Eye,
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { violationService } from '../services/violationService';
import { userService } from '../services/userService';
import { parkingService } from '../services/parkingService';
import { EmptyState } from '../components/EmptyState';
import {
  Violation,
  ViolationSeverity,
  ViolationStatus,
  UserProfile,
  ParkingSlot
} from '../types';

const violationFormSchema = z.object({
  residentId: z.string().optional(),
  slotNumber: z.string().min(1, 'Parking slot / location is required'),
  vehicleNumber: z.string().min(3, 'Vehicle number plate is required'),
  description: z.string().min(5, 'Detailed violation description is required'),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  fineAmount: z.number().min(0).optional()
});

type ViolationFormData = z.infer<typeof violationFormSchema>;

export const ViolationsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const role = userProfile?.role || 'Resident';

  const [violations, setViolations] = useState<Violation[]>([]);
  const [residents, setResidents] = useState<UserProfile[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'This Week'>('All');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  // Selected violation detail modal
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  useEffect(() => {
    let unsubViolations: () => void;

    if (role === 'Resident' && userProfile?.uid) {
      // Resident views only own violations
      unsubViolations = violationService.subscribeToUserViolations(
        userProfile.uid,
        (data) => {
          setViolations(data);
          setLoading(false);
        }
      );
    } else {
      // Admin / Security views all violations
      unsubViolations = violationService.subscribeToAllViolations((data) => {
        setViolations(data);
        setLoading(false);
      });
    }

    // Load residents list for form
    const unsubUsers = userService.subscribeToAllUsers((users) => {
      setResidents(users.filter((u) => u.role === 'Resident'));
    });

    // Load parking slots list for form
    const unsubSlots = parkingService.subscribeToSlots((slots) => {
      setParkingSlots(slots);
    });

    return () => {
      if (unsubViolations) unsubViolations();
      if (unsubUsers) unsubUsers();
      if (unsubSlots) unsubSlots();
    };
  }, [role, userProfile?.uid]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ViolationFormData>({
    resolver: zodResolver(violationFormSchema),
    defaultValues: {
      residentId: '',
      slotNumber: '',
      vehicleNumber: '',
      description: '',
      severity: 'Medium',
      fineAmount: 25
    }
  });

  const onSubmitReport = async (data: ViolationFormData) => {
    setIsSubmitting(true);
    try {
      const selectedResident = residents.find((r) => r.uid === data.residentId);

      await violationService.reportViolation({
        residentId: data.residentId || undefined,
        residentName: selectedResident ? selectedResident.name : undefined,
        slotNumber: data.slotNumber,
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        description: data.description,
        severity: data.severity as ViolationSeverity,
        status: 'Pending',
        reportedBy: userProfile?.name || 'Gate Security',
        reportedByName: userProfile?.name || 'Gate Security',
        fineAmount: data.fineAmount ? Number(data.fineAmount) : 0
      });

      showToast(
        'success',
        'Violation Reported',
        `Violation logged for vehicle ${data.vehicleNumber.toUpperCase()} and resident notified.`
      );
      reset();
      setShowAddModal(false);
    } catch (err: any) {
      showToast('error', 'Report Error', err.message || 'Failed to report violation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (violation: Violation) => {
    setActionProcessingId(violation.violationId);
    try {
      await violationService.resolveViolation(
        violation.violationId,
        violation.residentId,
        violation.vehicleNumber
      );
      showToast('success', 'Violation Resolved', `Violation for ${violation.vehicleNumber} marked as resolved.`);
      if (selectedViolation?.violationId === violation.violationId) {
        setSelectedViolation(null);
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to resolve violation.');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleReject = async (violation: Violation) => {
    setActionProcessingId(violation.violationId);
    try {
      await violationService.rejectViolation(
        violation.violationId,
        violation.residentId,
        violation.vehicleNumber
      );
      showToast('info', 'Violation Rejected', `Violation for ${violation.vehicleNumber} dismissed.`);
      if (selectedViolation?.violationId === violation.violationId) {
        setSelectedViolation(null);
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to reject violation.');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleInReview = async (violation: Violation) => {
    setActionProcessingId(violation.violationId);
    try {
      await violationService.updateViolationStatus(
        violation.violationId,
        'In Review',
        { residentId: violation.residentId, vehicleNumber: violation.vehicleNumber }
      );
      showToast('info', 'Status Updated', `Violation status set to In Review.`);
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to update status.');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this violation record?')) return;
    setActionProcessingId(id);
    try {
      await violationService.deleteViolation(id);
      showToast('info', 'Deleted', 'Violation record permanently deleted.');
      if (selectedViolation?.violationId === id) {
        setSelectedViolation(null);
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to delete record.');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Filter logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const filteredViolations = violations.filter((v) => {
    // Search match
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      v.vehicleNumber.toLowerCase().includes(query) ||
      (v.residentName && v.residentName.toLowerCase().includes(query)) ||
      (v.slotNumber && v.slotNumber.toLowerCase().includes(query)) ||
      v.description.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Severity Filter
    if (severityFilter !== 'All' && v.severity !== severityFilter) return false;

    // Status Filter
    if (statusFilter !== 'All') {
      const s = v.status;
      if (statusFilter === 'Pending' && s !== 'Pending' && s !== 'Open') return false;
      if (statusFilter === 'In Review' && s !== 'In Review' && s !== 'Under Review') return false;
      if (statusFilter === 'Resolved' && s !== 'Resolved') return false;
      if (statusFilter === 'Rejected' && s !== 'Rejected') return false;
    }

    // Date Filter
    if (dateFilter === 'Today') {
      if (!v.createdAt.startsWith(todayStr)) return false;
    } else if (dateFilter === 'This Week') {
      if (new Date(v.createdAt) < oneWeekAgo) return false;
    }

    return true;
  });

  // Severity Badge Colors
  const getSeverityBadge = (severity: ViolationSeverity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Low':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    }
  };

  // Status Badge Colors
  const getStatusBadge = (status: ViolationStatus) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'In Review':
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Rejected':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'Pending':
      case 'Open':
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            <span>Violations Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime parking violation reporting, severity audit, fine notices, and status tracking in Firestore.
          </p>
        </div>

        {/* Report Violation Button (Security & Admin) */}
        {(role === 'Admin' || role === 'Security') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Report Violation</span>
          </button>
        )}
      </div>

      {/* Toolbar: Search and Filters */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Vehicle Plate, Resident Name, Slot Number..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Filters dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Severity Filter */}
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Review">In Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / Display */}
      {loading ? (
        /* Skeleton loading */
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            ))}
          </div>
        </div>
      ) : filteredViolations.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Violations Found"
          description={
            searchQuery || severityFilter !== 'All' || statusFilter !== 'All'
              ? 'No violation records match your search query and filters.'
              : 'There are currently no recorded parking violations in the system.'
          }
        />
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Vehicle Number</th>
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Parking Slot</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Reported By</th>
                  <th className="px-6 py-4">Reported Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredViolations.map((v) => {
                  const isProcessing = actionProcessingId === v.violationId;

                  return (
                    <tr
                      key={v.violationId}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Vehicle Number */}
                      <td className="px-6 py-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                        <div className="flex items-center space-x-1.5">
                          <Car className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{v.vehicleNumber}</span>
                        </div>
                      </td>

                      {/* Resident */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {v.residentName || 'N/A / External'}
                        </div>
                      </td>

                      {/* Parking Slot */}
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                        {v.slotNumber || v.slotId || 'General Area'}
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                        {v.description}
                      </td>

                      {/* Severity */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getSeverityBadge(
                            v.severity
                          )}`}
                        >
                          {v.severity}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            v.status
                          )}`}
                        >
                          {v.status}
                        </span>
                      </td>

                      {/* Reported By */}
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {v.reportedByName || v.reportedBy || 'Security Staff'}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(v.createdAt).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View details button */}
                          <button
                            onClick={() => setSelectedViolation(v)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Action buttons for Admin / Security */}
                          {(role === 'Admin' || role === 'Security') && (
                            <>
                              {v.status !== 'Resolved' && (
                                <button
                                  onClick={() => handleResolve(v)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 font-bold text-[11px] transition-all disabled:opacity-50"
                                  title="Mark Resolved"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span className="hidden sm:inline">Resolve</span>
                                </button>
                              )}

                              {role === 'Admin' && v.status !== 'Rejected' && (
                                <button
                                  onClick={() => handleReject(v)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:text-slate-300 dark:hover:text-rose-400 font-bold text-[11px] transition-all disabled:opacity-50"
                                  title="Reject Violation"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Reject</span>
                                </button>
                              )}

                              {role === 'Admin' && (
                                <button
                                  onClick={() => handleDelete(v.violationId)}
                                  disabled={isProcessing}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Violation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Report Parking Incident
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Log violation record into Firestore and issue immediate notification.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmitReport)} className="space-y-4">
              {/* Resident Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resident (Host / Vehicle Owner)
                </label>
                <select
                  {...register('residentId')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- External / Unknown Resident --</option>
                  {residents.map((r) => (
                    <option key={r.uid} value={r.uid}>
                      {r.name} ({r.flatNumber ? `Flat ${r.flatNumber}` : r.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Number & Parking Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Number Plate *
                  </label>
                  <input
                    type="text"
                    {...register('vehicleNumber')}
                    placeholder="e.g. KA-01-AB-1234"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:border-rose-500"
                  />
                  {errors.vehicleNumber && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.vehicleNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parking Slot / Location *
                  </label>
                  <input
                    type="text"
                    {...register('slotNumber')}
                    placeholder="e.g. A-102 or Visitor Ramp"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                  {errors.slotNumber && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.slotNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Severity & Fine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Severity Level *
                  </label>
                  <select
                    {...register('severity')}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Low">Low (Minor Warning)</option>
                    <option value="Medium">Medium (Standard Violation)</option>
                    <option value="High">High (Blocking Driveway)</option>
                    <option value="Critical">Critical (Safety Hazard / Tow)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fine Amount ($)
                  </label>
                  <input
                    type="number"
                    {...register('fineAmount', { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Violation Description *
                </label>
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="Provide specific incident detail (e.g., parked in reserved resident slot without pass)..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
                {errors.description && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving & Notifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>Log Violation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Selected Violation Detail Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => setSelectedViolation(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Violation Record Details
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  #{selectedViolation.violationId}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Vehicle Plate:</span>
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                  {selectedViolation.vehicleNumber}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Resident / Owner:</span>
                <span className="font-semibold">{selectedViolation.residentName || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Parking Slot:</span>
                <span className="font-semibold">{selectedViolation.slotNumber || 'General Area'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Severity:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${getSeverityBadge(
                    selectedViolation.severity
                  )}`}
                >
                  {selectedViolation.severity}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${getStatusBadge(
                    selectedViolation.status
                  )}`}
                >
                  {selectedViolation.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Reported By:</span>
                <span className="font-medium">{selectedViolation.reportedByName || selectedViolation.reportedBy || 'Security'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Reported Date:</span>
                <span className="font-medium">
                  {new Date(selectedViolation.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="pt-2">
                <span className="block text-slate-500 mb-1 font-semibold">Incident Description:</span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedViolation.description}
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
              {role !== 'Resident' && selectedViolation.status !== 'Resolved' && (
                <button
                  onClick={() => handleResolve(selectedViolation)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                >
                  Mark Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedViolation(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
