import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useToast, ToastMessage } from '../contexts/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-teal-500 shrink-0" />;
    }
  };

  const getBorder = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
      case 'warning':
        return 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
      case 'error':
        return 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
      case 'info':
      default:
        return 'border-teal-500/30 bg-teal-50/90 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl border shadow-lg backdrop-blur-md ${getBorder(
              toast.type
            )}`}
          >
            {getIcon(toast.type)}
            <div className="flex-1 text-sm">
              <h4 className="font-semibold leading-tight">{toast.title}</h4>
              {toast.message && <p className="mt-1 opacity-90">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-60 hover:opacity-100 p-1 transition-opacity rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
