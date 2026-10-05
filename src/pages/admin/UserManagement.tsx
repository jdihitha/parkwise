import React, { useState, useEffect } from 'react';
import { Users, Search, Edit, Shield, Home, Phone, Mail, Loader2, Plus } from 'lucide-react';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState } from '../../components/EmptyState';
import { UserProfile, UserRole } from '../../types';

export const UserManagement: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('Resident');
  const [newFlat, setNewFlat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = userService.subscribeToUsers((data) => setUsers(data));
    return () => unsub();
  }, []);

  const openEdit = (user: UserProfile) => {
    setEditingUser(user);
    setNewRole(user.role);
    setNewFlat(user.flatNumber || '');
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await userService.updateUserRole(editingUser.uid, newRole);
      await userService.updateUserProfile(editingUser.uid, { flatNumber: newFlat });
      showToast('success', 'User Profile Updated', `Updated role and details for ${editingUser.name}`);
      setEditingUser(null);
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.flatNumber && u.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-500" />
            <span>Society Users Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage user accounts, update role permissions, and view resident flat mappings in Firestore.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, or flat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Users Found"
          description="No user profiles match your search criteria."
        />
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">User Name & Email</th>
                <th className="px-6 py-3.5">Flat / Unit</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold">{u.flatNumber || 'N/A'}</td>
                  <td className="px-6 py-4">{u.phone || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        u.role === 'Admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : u.role === 'Security'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                      title="Edit User Role"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Edit User Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Editing permissions for {editingUser.name} ({editingUser.email})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Resident">Resident</option>
                  <option value="Security">Security Guard</option>
                  <option value="Admin">Property Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Flat / Unit Number
                </label>
                <input
                  type="text"
                  value={newFlat}
                  onChange={(e) => setNewFlat(e.target.value)}
                  placeholder="e.g. Tower B - 402"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all flex items-center space-x-1"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
