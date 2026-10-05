import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserRole } from '../types';
import { ResetPasswordModal } from '../components/ResetPasswordModal';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, getDefaultRoute } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Authenticate with Firebase Auth and fetch Firestore profile users/{uid}
      const profile = await login(data.email, data.password);

      // 2. Validate Firestore document structure
      if (!profile) {
        throw new Error('Your account is not configured. Please contact the administrator.');
      }

      showToast(
        'success',
        'Signed In Successfully',
        `Welcome back, ${profile.name || 'User'}!`
      );

      // 3. Redirect automatically based on user role
      const targetRoute = getDefaultRoute(profile.role as UserRole);
      navigate(targetRoute, { replace: true });
    } catch (err: any) {
      console.error('[LoginPage Error]:', err);
      const msg =
        err.message ||
        'Authentication failed. Please verify your credentials or contact administrator.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'Resident' | 'Security' | 'Admin') => {
    switch (role) {
      case 'Resident':
        setValue('email', 'resident@parkwise.io');
        setValue('password', 'resident123');
        break;
      case 'Security':
        setValue('email', 'security@parkwise.io');
        setValue('password', 'security123');
        break;
      case 'Admin':
        setValue('email', 'admin@parkwise.io');
        setValue('password', 'admin1234');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Subtle Background Glow Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Car className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">ParkWise</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-100">Sign in to your account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Society Parking & Visitor Management System
          </p>
        </div>

        {/* Login Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-300">Authentication Alert</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="resident@parkwise.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Firestore Profile...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Selector for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-2.5">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('Resident')}
                className="py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-indigo-500/10 text-indigo-400 border border-slate-800 hover:border-indigo-500/30 text-[11px] font-semibold transition-all cursor-pointer"
              >
                Resident
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('Security')}
                className="py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-amber-500/10 text-amber-400 border border-slate-800 hover:border-amber-500/30 text-[11px] font-semibold transition-all cursor-pointer"
              >
                Security
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('Admin')}
                className="py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-purple-500/10 text-purple-400 border border-slate-800 hover:border-purple-500/30 text-[11px] font-semibold transition-all cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>

          {/* New Account Link */}
          <div className="mt-5 text-center text-xs text-slate-400">
            Don't have a society account yet?{' '}
            <Link to="/register" className="text-indigo-400 font-bold hover:underline">
              Register Resident Account
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        defaultEmail={getValues('email')}
      />
    </div>
  );
};

