import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Car,
  Lock,
  Mail,
  User,
  Phone,
  Home,
  Shield,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserRole } from '../types';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Resident', 'Security', 'Admin']),
  flatNumber: z.string().min(1, 'Flat / Office number is required'),
  phone: z.string().min(5, 'Valid contact phone number is required')
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser, getDefaultRoute } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Resident',
      flatNumber: 'Tower A - 101',
      phone: '+1 (555) 012-3456'
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const profile = await registerUser(
        data.name,
        data.email,
        data.password,
        data.role as UserRole,
        data.flatNumber,
        data.phone
      );
      showToast('success', 'Account Created', `Welcome to ParkWise, ${profile?.name}!`);
      const targetRoute = getDefaultRoute(profile?.role);
      navigate(targetRoute);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
              <Car className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">ParkWise</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-100">Create a New Account</h2>
          <p className="text-xs text-slate-400 mt-0.5">Direct Firestore User Document Provisioning</p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-2xl backdrop-blur-xl">
          {errorMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  {...register('name')}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email & Role Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role Type
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    {...register('role')}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 text-xs text-white focus:outline-none transition-colors"
                  >
                    <option value="Resident">Resident</option>
                    <option value="Security">Security Guard</option>
                    <option value="Admin">Property Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Flat Number & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Flat / Unit Number
                </label>
                <div className="relative">
                  <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    {...register('flatNumber')}
                    placeholder="Tower A - 302"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                {errors.flatNumber && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.flatNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="+1 (555) 012-3456"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
