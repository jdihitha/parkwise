import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const NotFoundPage: React.FC = () => {
  const { userProfile, getDefaultRoute } = useAuth();
  const navigate = useNavigate();

  const homeRoute = userProfile ? getDefaultRoute(userProfile.role) : '/';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800/90 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            404 Error
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The page you are looking for might have been moved, deleted, or does not exist in the ParkWise portal system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to={homeRoute}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
