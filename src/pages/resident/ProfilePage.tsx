import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Home,
  Shield,
  Loader2,
  Save,
  Image,
  Calendar,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(5, 'Valid contact phone number is required'),
  flatNumber: z.string().min(1, 'Flat or unit number is required'),
  photoURL: z.string().url('Must be a valid URL').or(z.literal('')).optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile?.name || '',
      phone: userProfile?.phone || '',
      flatNumber: userProfile?.flatNumber || '',
      photoURL: userProfile?.profilePhoto || ''
    }
  });

  const watchPhotoURL = watch('photoURL');

  const onSubmit = async (data: ProfileFormData) => {
    if (!userProfile?.uid) return;
    setIsSaving(true);
    try {
      await userService.updateUserProfile(userProfile.uid, {
        name: data.name,
        phone: data.phone,
        flatNumber: data.flatNumber,
        profilePhoto: data.photoURL || ''
      });
      await refreshProfile();
      showToast('success', 'Profile Saved', 'Your user profile has been updated in Firestore.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Failed to update user profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedJoinedDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  const avatarDisplay = watchPhotoURL || userProfile?.profilePhoto;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <User className="w-6 h-6 text-indigo-600" />
          <span>My Profile & Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal contact details, flat number, and profile image stored in Firestore.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-8">
        {/* Profile Card Header Banner */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-indigo-950/20 border border-slate-200/80 dark:border-slate-700/60">
          <div className="relative">
            {avatarDisplay ? (
              <img
                src={avatarDisplay}
                alt={userProfile?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600 shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            {!avatarDisplay && (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-md">
                {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {userProfile?.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {userProfile?.email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Role: {userProfile?.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                <Home className="w-3 h-3 text-slate-400" />
                <span>Flat {userProfile?.flatNumber || 'N/A'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Read-Only Information Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Account Email</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {userProfile?.email}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">User ID (UID)</span>
            <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {userProfile?.uid}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Member Since</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {formattedJoinedDate}
            </span>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Edit Profile Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                {...register('name')}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Flat / Unit Number
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  {...register('flatNumber')}
                  placeholder="e.g. A-402"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              {errors.flatNumber && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.flatNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Profile Photo URL
            </label>
            <div className="relative">
              <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                {...register('photoURL')}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {errors.photoURL && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.photoURL.message}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              Enter a public image URL for your profile avatar.
            </p>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
