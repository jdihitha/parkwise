import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car,
  Bike,
  Zap,
  Truck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Loader2,
  Building,
  User,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Tag,
  Calendar,
  Sparkles,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleService } from '../../services/vehicleService';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState } from '../../components/EmptyState';
import { FirebaseStatusBanner } from '../../components/FirebaseStatusBanner';
import { Vehicle, VehicleType, UserProfile } from '../../types';

// Zod Validation Schema
const vehicleSchema = z.object({
  ownerId: z.string().min(1, 'Owner selection is required'),
  vehicleNumber: z.string().min(2, 'Vehicle number is required (e.g. MH-12-AB-1234)').transform(val => val.trim().toUpperCase()),
  vehicleType: z.enum(['Car', 'Bike', 'EV', 'Truck', 'Other', 'SUV']),
  make: z.string().min(1, 'Make / Brand is required (e.g., Toyota, Honda)'),
  model: z.string().min(1, 'Model is required (e.g., Civic, Model 3)'),
  color: z.string().min(1, 'Color is required')
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

type SortField = 'vehicleNumber' | 'ownerName' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const VehiclesPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { showToast } = useToast();

  const role = userProfile?.role || 'Resident';
  const isAdmin = role === 'Admin';
  const isSecurity = role === 'Security';
  const isResident = role === 'Resident';

  // Realtime Data States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Subscriptions setup
  useEffect(() => {
    setLoading(true);
    let unsubVehicles: () => void = () => {};

    // Subscribe to vehicles list based on role
    if (isAdmin || isSecurity) {
      unsubVehicles = vehicleService.subscribeToAllVehicles((data) => {
        setVehicles(data);
        setLoading(false);
      });
    } else if (userProfile?.uid) {
      unsubVehicles = vehicleService.subscribeToUserVehicles(userProfile.uid, (data) => {
        setVehicles(data);
        setLoading(false);
      });
    }

    // Always subscribe to users list to map owner names & flats
    const unsubUsers = userService.subscribeToAllUsers((usersData) => {
      setAllUsers(usersData);
    });

    return () => {
      unsubVehicles();
      unsubUsers();
    };
  }, [isAdmin, isSecurity, userProfile?.uid]);

  // Quick lookup map for Users by UID
  const userMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    allUsers.forEach((u) => map.set(u.uid, u));
    return map;
  }, [allUsers]);

  // List of resident profiles for Admin dropdown
  const residentOptions = useMemo(() => {
    return allUsers.filter((u) => u.role === 'Resident' || u.role === 'Admin');
  }, [allUsers]);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      ownerId: userProfile?.uid || '',
      vehicleNumber: '',
      vehicleType: 'Car',
      make: '',
      model: '',
      color: ''
    }
  });

  // Modal Triggers
  const openAddModal = () => {
    setEditingVehicle(null);
    reset({
      ownerId: userProfile?.uid || '',
      vehicleNumber: '',
      vehicleType: 'Car',
      make: '',
      model: '',
      color: ''
    });
    setShowAddEditModal(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setValue('ownerId', vehicle.ownerId);
    setValue('vehicleNumber', vehicle.vehicleNumber);
    setValue('vehicleType', vehicle.vehicleType as any);
    setValue('make', vehicle.make);
    setValue('model', vehicle.model);
    setValue('color', vehicle.color);
    setShowAddEditModal(true);
  };

  const openDeleteModal = (vehicle: Vehicle) => {
    setDeletingVehicle(vehicle);
    setShowDeleteModal(true);
  };

  // Submit Handler
  const onSubmitForm = async (data: VehicleFormData) => {
    setIsSubmitting(true);
    try {
      const formattedPlate = data.vehicleNumber.replaceAll(/\s+/g, '').toUpperCase();

      // Duplicate Check across vehicles collection
      const isDuplicate = vehicles.some((v) => {
        const existingPlate = v.vehicleNumber.replaceAll(/\s+/g, '').toUpperCase();
        if (editingVehicle && v.vehicleId === editingVehicle.vehicleId) return false;
        return existingPlate === formattedPlate;
      });

      if (isDuplicate) {
        showToast('error', 'Duplicate License Plate', `Vehicle plate '${data.vehicleNumber}' is already registered in the system.`);
        setIsSubmitting(false);
        return;
      }

      if (editingVehicle) {
        await vehicleService.updateVehicle(editingVehicle.vehicleId, {
          ownerId: isAdmin ? data.ownerId : (userProfile?.uid || data.ownerId),
          vehicleNumber: formattedPlate,
          vehicleType: data.vehicleType as VehicleType,
          make: data.make.trim(),
          model: data.model.trim(),
          color: data.color.trim()
        });
        showToast('success', 'Vehicle Updated', `Vehicle ${formattedPlate} updated successfully.`);
      } else {
        await vehicleService.addVehicle({
          ownerId: isAdmin ? data.ownerId : (userProfile?.uid || ''),
          vehicleNumber: formattedPlate,
          vehicleType: data.vehicleType as VehicleType,
          make: data.make.trim(),
          model: data.model.trim(),
          color: data.color.trim()
        });
        showToast('success', 'Vehicle Registered', `New vehicle ${formattedPlate} saved to Firestore.`);
      }

      setShowAddEditModal(false);
    } catch (err: any) {
      showToast('error', 'Operation Failed', err?.message || 'Unable to save vehicle details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteVehicle = async () => {
    if (!deletingVehicle) return;
    setIsSubmitting(true);
    try {
      await vehicleService.deleteVehicle(deletingVehicle.vehicleId);
      showToast('info', 'Vehicle Removed', `Vehicle ${deletingVehicle.vehicleNumber} removed from Firestore.`);
      setShowDeleteModal(false);
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Failed to remove vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search Logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Type Filter
      if (typeFilter !== 'All' && v.vehicleType !== typeFilter) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const plateMatch = v.vehicleNumber.toLowerCase().includes(q);
        const makeMatch = v.make.toLowerCase().includes(q);
        const modelMatch = v.model.toLowerCase().includes(q);

        const owner = userMap.get(v.ownerId);
        const ownerNameMatch = owner ? owner.name.toLowerCase().includes(q) : false;
        const flatMatch = owner ? owner.flatNumber?.toLowerCase().includes(q) : false;

        return plateMatch || makeMatch || modelMatch || ownerNameMatch || flatMatch;
      }

      return true;
    });
  }, [vehicles, typeFilter, searchQuery, userMap]);

  // Sorting Logic
  const sortedVehicles = useMemo(() => {
    return [...filteredVehicles].sort((a, b) => {
      let aVal: string = '';
      let bVal: string = '';

      if (sortField === 'vehicleNumber') {
        aVal = a.vehicleNumber;
        bVal = b.vehicleNumber;
      } else if (sortField === 'ownerName') {
        const ownerA = userMap.get(a.ownerId)?.name || '';
        const ownerB = userMap.get(b.ownerId)?.name || '';
        aVal = ownerA;
        bVal = ownerB;
      } else if (sortField === 'createdAt') {
        aVal = a.createdAt || '';
        bVal = b.createdAt || '';
      }

      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredVehicles, sortField, sortOrder, userMap]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedVehicles.length / pageSize) || 1;
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedVehicles.slice(start, start + pageSize);
  }, [sortedVehicles, currentPage, pageSize]);

  // Handle Sort Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, pageSize]);

  // Icon Helper for Vehicle Type
  const getVehicleTypeIcon = (type: VehicleType) => {
    switch (type) {
      case 'Bike':
        return <Bike className="w-4 h-4 text-sky-400" />;
      case 'EV':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'Truck':
        return <Truck className="w-4 h-4 text-amber-400" />;
      case 'Car':
      case 'SUV':
      default:
        return <Car className="w-4 h-4 text-purple-400" />;
    }
  };

  // Type Badge Styling
  const getTypeBadgeStyle = (type: VehicleType) => {
    switch (type) {
      case 'EV':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Bike':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Truck':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Car':
      case 'SUV':
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <FirebaseStatusBanner />

      {/* Hero Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Car className="w-3.5 h-3.5" />
                <span>
                  {isAdmin ? 'Admin Vehicle Directory' : isSecurity ? 'Security Vehicle Registry' : 'My Registered Vehicles'}
                </span>
              </span>
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin-slow" />
                <span>Firestore Realtime Sync</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vehicles Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              {isAdmin
                ? 'Manage all society resident vehicles, register new license plates, and ensure gate authorization security.'
                : isSecurity
                ? 'Read-only directory of verified society vehicles for gate check-in and security verification.'
                : 'Keep your personal cars, bikes, and EVs updated for automated gate pass recognition and parking access.'}
            </p>
          </div>

          {!isSecurity && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by license plate, owner name, flat number, make, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
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

          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 px-1 flex items-center space-x-1">
              <Filter className="w-3 h-3 text-indigo-400" />
              <span>Type:</span>
            </span>
            {['All', 'Car', 'Bike', 'EV', 'Truck', 'Other'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sortedVehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No Vehicles Found"
          description={
            searchQuery || typeFilter !== 'All'
              ? 'No vehicles matched your search query or selected filters.'
              : isResident
              ? 'You have not registered any vehicles yet. Add your car, bike, or EV to enable gate access.'
              : 'No vehicles are registered in the society database yet.'
          }
          actionLabel={!isSecurity ? 'Register Vehicle' : undefined}
          onAction={!isSecurity ? openAddModal : undefined}
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
                    onClick={() => handleSort('vehicleNumber')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Vehicle Number</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('ownerName')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Owner Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th className="py-3.5 px-4">Flat Number</th>

                  <th className="py-3.5 px-4">Vehicle Type</th>

                  <th className="py-3.5 px-4">Make</th>

                  <th className="py-3.5 px-4">Model</th>

                  <th className="py-3.5 px-4">Color</th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Created Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {!isSecurity && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {paginatedVehicles.map((v) => {
                  const owner = userMap.get(v.ownerId);
                  const isOwnerSelf = v.ownerId === userProfile?.uid;

                  return (
                    <tr
                      key={v.vehicleId}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Vehicle Number (License Plate style) */}
                      <td className="py-3.5 px-4 font-black text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            {getVehicleTypeIcon(v.vehicleType)}
                          </div>
                          <span className="tracking-wider font-mono text-sm px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-300">
                            {v.vehicleNumber}
                          </span>
                        </div>
                      </td>

                      {/* Owner Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-500/30">
                            {owner ? owner.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">
                              {owner ? owner.name : 'Unknown Resident'}
                              {isOwnerSelf && (
                                <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500">{owner?.email || ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Flat Number */}
                      <td className="py-3.5 px-4 text-slate-300 font-semibold">
                        <div className="flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>{owner?.flatNumber || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Vehicle Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadgeStyle(
                            v.vehicleType
                          )}`}
                        >
                          {getVehicleTypeIcon(v.vehicleType)}
                          <span>{v.vehicleType}</span>
                        </span>
                      </td>

                      {/* Make */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{v.make}</td>

                      {/* Model */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{v.model}</td>

                      {/* Color */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-600 shadow-sm" />
                          <span>{v.color}</span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {v.createdAt
                          ? new Date(v.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </td>

                      {/* Actions (Hidden for Security) */}
                      {!isSecurity && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Edit Vehicle */}
                            <button
                              type="button"
                              onClick={() => openEditModal(v)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                              title="Edit Vehicle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Vehicle */}
                            <button
                              type="button"
                              onClick={() => openDeleteModal(v)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Vehicle"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
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
                {Math.min(currentPage * pageSize, sortedVehicles.length)} of {sortedVehicles.length}{' '}
                vehicles
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

      {/* ADD / EDIT VEHICLE MODAL */}
      <AnimatePresence>
        {showAddEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-800 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2.5 mb-2">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingVehicle
                      ? `Update specifications for ${editingVehicle.vehicleNumber}`
                      : 'Add a new vehicle to the society Firestore database'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 mt-6">
                {/* Owner Field (Selectable for Admin, Fixed for Resident) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Vehicle Owner <span className="text-rose-400">*</span>
                  </label>
                  {isAdmin ? (
                    <select
                      {...register('ownerId')}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Select Resident Owner...</option>
                      {residentOptions.map((res) => (
                        <option key={res.uid} value={res.uid}>
                          {res.name} — Flat {res.flatNumber || 'N/A'} ({res.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 flex items-center justify-between">
                      <span className="font-bold text-white">{userProfile?.name} (Flat {userProfile?.flatNumber})</span>
                      <span className="text-[10px] text-indigo-400 font-semibold">Self</span>
                    </div>
                  )}
                  {errors.ownerId && (
                    <p className="text-[11px] text-rose-400 mt-1">{errors.ownerId.message}</p>
                  )}
                </div>

                {/* License Plate Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Vehicle Number / License Plate <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('vehicleNumber')}
                    placeholder="e.g. MH-12-AB-1234 or KA-01-MJ-9999"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
                  />
                  {errors.vehicleNumber && (
                    <p className="text-[11px] text-rose-400 mt-1">{errors.vehicleNumber.message}</p>
                  )}
                </div>

                {/* Vehicle Type & Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Vehicle Type <span className="text-rose-400">*</span>
                    </label>
                    <select
                      {...register('vehicleType')}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                      <option value="EV">EV</option>
                      <option value="Truck">Truck</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Color <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('color')}
                      placeholder="e.g. Silver, Black"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {errors.color && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.color.message}</p>
                    )}
                  </div>
                </div>

                {/* Make & Model */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Make / Brand <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('make')}
                      placeholder="e.g. Toyota, Honda"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {errors.make && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.make.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Model <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('model')}
                      placeholder="e.g. Civic, Model 3"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {errors.model && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.model.message}</p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddEditModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingVehicle ? 'Save Changes' : 'Register Vehicle'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && deletingVehicle && (
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
                  <h3 className="text-lg font-black text-white">Delete Vehicle</h3>
                  <p className="text-xs text-rose-400 font-semibold">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Are you sure you want to delete vehicle{' '}
                <strong className="text-white font-bold font-mono px-1 py-0.5 rounded bg-slate-950 border border-slate-800">
                  {deletingVehicle.vehicleNumber}
                </strong>{' '}
                ({deletingVehicle.make} {deletingVehicle.model}) from Firestore?
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
                  onClick={handleDeleteVehicle}
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
