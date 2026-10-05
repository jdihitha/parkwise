import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Loader2, X, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useToast } from '../contexts/ToastContext';

const resetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
});

type ResetFormData = z.infer<typeof resetSchema>;

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = ''
}) => {
  const { showToast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: defaultEmail
    }
  });

  // Reset internal state when modal opens/closes or defaultEmail changes
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setApiError(null);
      reset({ email: defaultEmail });
    }
  }, [isOpen, defaultEmail, reset]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const onSubmit = async (data: ResetFormData) => {
    const email = data.email.trim();
    setApiError(null);

    console.log("Reset email:", email);
    console.log("Firebase Auth:", auth);
    console.log("Firebase App:", auth.app.name);

    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Reset Success");
      setIsSuccess(true);
      showToast(
        'success',
        'Password Reset Email Sent',
        'Password reset email sent successfully. Please check your inbox and spam folder.'
      );
    } catch (error: any) {
      console.error(error);
      const code = error?.code || '';
      let friendlyError = error?.message || 'An error occurred while sending the password reset email.';

      if (code === 'auth/user-not-found') {
        friendlyError = 'No account found with this email address. (auth/user-not-found)';
      } else if (code === 'auth/invalid-email') {
        friendlyError = 'The email address format is invalid. (auth/invalid-email)';
      } else if (code === 'auth/too-many-requests') {
        friendlyError = 'Too many requests. Please try again later. (auth/too-many-requests)';
      } else if (code === 'auth/network-request-failed') {
        friendlyError = 'Network connection failed. Please check your internet connection. (auth/network-request-failed)';
      } else if (code === 'auth/missing-email') {
        friendlyError = 'Email address is missing. (auth/missing-email)';
      } else if (code) {
        friendlyError = `${error?.message || 'Firebase error'} (${code})`;
      }

      setApiError(friendlyError);
      showToast('error', 'Reset Failed', friendlyError);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-slate-900 dark:text-slate-100"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs border border-indigo-100 dark:border-indigo-900/50">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 id="reset-password-title" className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                Reset Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Enter your registered email address and we will send you a password reset link.
              </p>
            </div>
          </div>

          {/* Body Content */}
          {isSuccess ? (
            <div className="space-y-5 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">Email Sent Successfully</p>
                  <p>Password reset email sent successfully. Please check your inbox and spam folder.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              {apiError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{apiError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="resident@parkwise.io"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-600 focus:outline-none transition-colors"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Sending...' : 'Send Reset Link'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const ForgotPasswordModal = ResetPasswordModal;
