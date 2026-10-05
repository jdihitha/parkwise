import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto py-1">
      <Link
        to="/"
        className="flex items-center hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        const formattedName = value
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300 dark:text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {formattedName}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
              >
                {formattedName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
