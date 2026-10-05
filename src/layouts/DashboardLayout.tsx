import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ToastContainer } from '../components/Toast';

export const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
