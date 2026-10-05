import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import {
  ParkingSquare,
  Plus,
  Edit2,
  Trash2,
  Search,
  UserCheck,
  Loader2,
  X,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Building2,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { parkingService } from '../../services/parkingService';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState } from '../../components/EmptyState';
import { FirebaseStatusBanner } from '../../components/FirebaseStatusBanner';
import { ParkingSlot, SlotType, SlotStatus, UserProfile } from '../../types';

// Zod Validation Schema for Slot Creation / Editing
const slotSchema = z.object({
  slotNumber: z.string().min(1, 'Slot number is required (e.g., A-101)'),
  building: z.string().min(1, 'Building / Tower is required'),
  floor: z.string().min(1, 'Floor level is required'),
  type: z.enum(['Resident', 'Visitor', 'EV Charging', 'Accessible', 'EV', 'Handicapped']),
  status: z.enum(['Available', 'Occupied', 'Reserved', 'Maintenance']),
  assignedResident: z.string().optional()
});

type SlotFormData = z.infer<typeof slotSchema>;

type SortField = 'slotNumber' | 'building' | 'floor' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const SlotManagement: React.FC = () => {
  const { showToast } = useToast();

  // Realtime Firestore state
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [residents, setResidents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('slotNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals state
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);

  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assigningSlot, setAssigningSlot] = useState<ParkingSlot | null>(null);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletingSlot, setDeletingSlot] = useState<ParkingSlot | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Realtime Subscriptions
  useEffect(() => {
    setLoading(true);
    let loadedSlots = false;
    let loadedUsers = false;

    const checkComplete = () => {
      if (loadedSlots && loadedUsers) {
        setLoading(false);
      }
    };

    // 1. Subscribe to parkingSlots collection
    const unsubSlots = parkingService.subscribeToSlots((data) => {
      setSlots(data);
      loadedSlots = true;
      checkComplete();
    });

    // 2. Subscribe to users collection (filter Resident role)
    const unsubUsers = userService.subscribeToUsers((allUsers) => {
      const residentUsers = allUsers.filter((u) => u.role === 'Resident');
      setResidents(residentUsers);
      loadedUsers = true;
      checkComplete();
    });

    return () => {
      unsubSlots();
      unsubUsers();
    };
  }, []);

  // Map Resident UID to Profile helper
  const residentMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    residents.forEach((r) => map.set(r.uid, r));
    return map;
  }, [residents]);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      slotNumber: '',
      building: 'Tower A',
      floor: 'Ground Floor',
      type: 'Resident',
      status: 'Available',
      assignedResident: ''
    }
  });

  // Modal Triggers
  const openCreateModal = () => {
    setEditingSlot(null);
    reset({
      slotNumber: '',
      building: 'Tower A',
      floor: 'Ground Floor',
      type: 'Resident',
      status: 'Available',
      assignedResident: ''
    });
    setShowFormModal(true);
  };

  const openEditModal = (slot: ParkingSlot) => {
    setEditingSlot(slot);
    setValue('slotNumber', slot.slotNumber);
    setValue('building', slot.building);
    setValue('floor', slot.floor);
    setValue('type', (slot.type as any) || 'Resident');
    setValue('status', slot.status);
    setValue('assignedResident', slot.assignedResident || '');
    setShowFormModal(true);
  };

  const openAssignModal = (slot: ParkingSlot) => {
    setAssigningSlot(slot);
    setSelectedResidentId(slot.assignedResident || '');
    setShowAssignModal(true);
  };

  const openDeleteModal = (slot: ParkingSlot) => {
    setDeletingSlot(slot);
    setShowDeleteModal(true);
  };

  // Submit Handler: Add / Edit
  const onSubmitForm = async (data: SlotFormData) => {
    setIsSubmitting(true);
    try {
      const residentProfile = data.assignedResident
        ? residentMap.get(data.assignedResident)
        : null;

      if (editingSlot) {
        await parkingService.updateSlot(editingSlot.slotId, {
          slotNumber: data.slotNumber,
          building: data.building,
          floor: data.floor,
          type: data.type as SlotType,
          status: data.status as SlotStatus,
          assignedResident: data.assignedResident || null,
          assignedResidentName: residentProfile ? residentProfile.name : null
        });
        showToast('success', 'Slot Updated', `Parking slot ${data.slotNumber} updated successfully.`);
      } else {
        await parkingService.createSlot({
          slotNumber: data.slotNumber,
          building: data.building,
          floor: data.floor,
          type: data.type as SlotType,
          status: data.status as SlotStatus,
          assignedResident: data.assignedResident || null,
          assignedResidentName: residentProfile ? residentProfile.name : null
        });
        showToast('success', 'Slot Created', `New parking slot ${data.slotNumber} saved to Firestore.`);
      }
      setShowFormModal(false);
    } catch (err: any) {
      showToast('error', 'Operation Failed', err?.message || 'Unable to save parking slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign Resident Handler
  const handleAssignResident = async () => {
    if (!assigningSlot) return;
    setIsSubmitting(true);
    try {
      const resProfile = selectedResidentId ? residentMap.get(selectedResidentId) : null;
      await parkingService.assignSlotToResident(
        assigningSlot.slotId,
        selectedResidentId || null,
        resProfile ? `${resProfile.name} (${resProfile.flatNumber})` : null
      );

      // If assigning a resident to an available slot, mark status as Reserved or Occupied automatically
      if (selectedResidentId && assigningSlot.status === 'Available') {
        await parkingService.updateSlotStatus(assigningSlot.slotId, 'Reserved');
      } else if (!selectedResidentId && assigningSlot.status === 'Reserved') {
        await parkingService.updateSlotStatus(assigningSlot.slotId, 'Available');
      }

      showToast(
        'success',
        'Resident Assignment Updated',
        resProfile
          ? `Assigned ${assigningSlot.slotNumber} to ${resProfile.name}`
          : `Unassigned resident from slot ${assigningSlot.slotNumber}`
      );
      setShowAssignModal(false);
    } catch (err: any) {
      showToast('error', 'Assignment Failed', err?.message || 'Failed to update assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteSlot = async () => {
    if (!deletingSlot) return;
    setIsSubmitting(true);
    try {
      await parkingService.deleteSlot(deletingSlot.slotId);
      showToast('info', 'Slot Deleted', `Slot ${deletingSlot.slotNumber} removed from Firestore.`);
      setShowDeleteModal(false);
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Failed to delete parking slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering & Search
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Status filter
      if (statusFilter !== 'All' && slot.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'All' && slot.type !== typeFilter) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const numMatch = slot.slotNumber.toLowerCase().includes(q);
        const bldgMatch = slot.building.toLowerCase().includes(q);
        const floorMatch = slot.floor.toLowerCase().includes(q);

        const assignedUser = slot.assignedResident ? residentMap.get(slot.assignedResident) : null;
        const residentNameMatch = assignedUser ? assignedUser.name.toLowerCase().includes(q) : false;
        const residentFlatMatch = assignedUser ? assignedUser.flatNumber.toLowerCase().includes(q) : false;
        const storedNameMatch = slot.assignedResidentName ? slot.assignedResidentName.toLowerCase().includes(q) : false;

        return numMatch || bldgMatch || floorMatch || residentNameMatch || residentFlatMatch || storedNameMatch;
      }

      return true;
    });
  }, [slots, statusFilter, typeFilter, searchQuery, residentMap]);

  // Sorting
  const sortedSlots = useMemo(() => {
    return [...filteredSlots].sort((a, b) => {
      let aVal: string = '';
      let bVal: string = '';

      if (sortField === 'slotNumber') {
        aVal = a.slotNumber;
        bVal = b.slotNumber;
      } else if (sortField === 'building') {
        aVal = a.building;
        bVal = b.building;
      } else if (sortField === 'floor') {
        aVal = a.floor;
        bVal = b.floor;
      } else if (sortField === 'status') {
        aVal = a.status;
        bVal = b.status;
      } else if (sortField === 'createdAt') {
        aVal = a.createdAt || '';
        bVal = b.createdAt || '';
      }

      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredSlots, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedSlots.length / pageSize) || 1;
  const paginatedSlots = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSlots.slice(start, start + pageSize);
  }, [sortedSlots, currentPage, pageSize]);

  // Handle Sort Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, pageSize]);

  // Badge Color Mapper
  const getStatusBadge = (status: SlotStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Occupied':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Reserved':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Maintenance':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <FirebaseStatusBanner />

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <ParkingSquare className="w-3.5 h-3.5" />
                <span>Admin Parking Logistics</span>
              </span>
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin-slow" />
                <span>Firestore Sync</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Parking Slots Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Create and manage society parking slots, assign designated spots to verified residents, and track realtime occupancy.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Parking Slot</span>
          </button>
        </div>
      </motion.div>

      {/* Controls & Search Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by slot, building, floor, or resident name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center space-x-1">
                <Filter className="w-3 h-3 text-purple-400" />
                <span>Status:</span>
              </span>
              {['All', 'Available', 'Occupied', 'Reserved', 'Maintenance'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Type Filter Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Resident">Resident</option>
              <option value="Visitor">Visitor</option>
              <option value="EV Charging">EV Charging</option>
              <option value="Accessible">Accessible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      {loading ? (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sortedSlots.length === 0 ? (
        <EmptyState
          icon={ParkingSquare}
          title="No Parking Slots Found"
          description={
            searchQuery || statusFilter !== 'All' || typeFilter !== 'All'
              ? 'No parking slots match your selected filters. Try broadening your search query.'
              : 'There are no parking slots created in the society database yet.'
          }
          actionLabel="Add Parking Slot"
          onAction={openCreateModal}
        />
      ) : (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
            <table className="w-full text-left border-collapse">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('slotNumber')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Slot Number</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('building')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Building / Tower</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('floor')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Floor</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th className="py-3.5 px-4">Slot Type</th>

                  <th className="py-3.5 px-4">Assigned Resident</th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Created Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {paginatedSlots.map((slot) => {
                  const assignedUser = slot.assignedResident
                    ? residentMap.get(slot.assignedResident)
                    : null;

                  return (
                    <tr
                      key={slot.slotId}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Slot Number */}
                      <td className="py-3.5 px-4 font-black text-white">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                            <ParkingSquare className="w-4 h-4" />
                          </div>
                          <span>{slot.slotNumber}</span>
                        </div>
                      </td>

                      {/* Building */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{slot.building}</span>
                        </div>
                      </td>

                      {/* Floor */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          <span>{slot.floor}</span>
                        </div>
                      </td>

                      {/* Slot Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {slot.type}
                        </span>
                      </td>

                      {/* Assigned Resident */}
                      <td className="py-3.5 px-4">
                        {assignedUser ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-emerald-500/30">
                              {assignedUser.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-200 truncate">{assignedUser.name}</p>
                              <p className="text-[10px] text-slate-400">Flat {assignedUser.flatNumber}</p>
                            </div>
                          </div>
                        ) : slot.assignedResidentName ? (
                          <div className="flex items-center space-x-1.5 text-slate-300">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-semibold">{slot.assignedResidentName}</span>
                          </div>
                        ) : (
                          <span className="inline-block text-[10px] text-slate-500 font-semibold italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            slot.status
                          )}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{slot.status}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {slot.createdAt
                          ? new Date(slot.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Assign Resident */}
                          <button
                            type="button"
                            onClick={() => openAssignModal(slot)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Assign / Unassign Resident"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Slot */}
                          <button
                            type="button"
                            onClick={() => openEditModal(slot)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
                            title="Edit Slot Specifications"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Slot */}
                          <button
                            type="button"
                            onClick={() => openDeleteModal(slot)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedSlots.length)} of {sortedSlots.length}{' '}
                slots
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SLOT MODAL */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-800 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2.5 mb-2">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ParkingSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {editingSlot ? 'Edit Parking Slot' : 'Create Parking Slot'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingSlot
                      ? `Update specifications for ${editingSlot.slotNumber}`
                      : 'Configure new society parking allocation'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Slot Number / Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('slotNumber')}
                    placeholder="e.g. A-101, EV-02"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {errors.slotNumber && (
                    <p className="text-[11px] text-rose-400 mt-1">{errors.slotNumber.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Building / Tower <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('building')}
                      placeholder="e.g. Tower A"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    {errors.building && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.building.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Floor Level <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('floor')}
                      placeholder="e.g. Basement 1, Ground"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    {errors.floor && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.floor.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Slot Type</label>
                    <select
                      {...register('type')}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="Resident">Resident</option>
                      <option value="Visitor">Visitor</option>
                      <option value="EV Charging">EV Charging</option>
                      <option value="Accessible">Accessible</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
                    <select
                      {...register('status')}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Assigned Resident (Optional)
                  </label>
                  <select
                    {...register('assignedResident')}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {residents.map((r) => (
                      <option key={r.uid} value={r.uid}>
                        {r.name} ({r.flatNumber || 'No Flat'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Only verified resident profiles are shown here.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingSlot ? 'Save Changes' : 'Create Slot'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK ASSIGN RESIDENT MODAL */}
      <AnimatePresence>
        {showAssignModal && assigningSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-800 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2.5 mb-4">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Assign Resident</h3>
                  <p className="text-xs text-slate-400">
                    Slot {assigningSlot.slotNumber} • {assigningSlot.building}
                  </p>
                </div>
              </div>

              <div className="space-y-4 my-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Select Resident Profile
                  </label>
                  <select
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Unassigned (Clear Resident)</option>
                    {residents.map((res) => (
                      <option key={res.uid} value={res.uid}>
                        {res.name} — Flat {res.flatNumber} ({res.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignResident}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Assignment</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && deletingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-500/30 shadow-2xl relative"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Delete Parking Slot</h3>
                  <p className="text-xs text-rose-400 font-semibold">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Are you sure you want to delete parking slot{' '}
                <strong className="text-white font-bold">{deletingSlot.slotNumber}</strong> (
                {deletingSlot.building}, {deletingSlot.floor}) from Firestore?
              </p>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSlot}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
