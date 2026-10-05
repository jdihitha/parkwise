import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

// Resident Pages
import { ResidentDashboard } from '../pages/resident/ResidentDashboard';
import { MyParking } from '../pages/resident/MyParking';
import { VisitorBooking } from '../pages/resident/VisitorBooking';
import { MyBookings } from '../pages/resident/MyBookings';
import { VehiclesPage } from '../pages/resident/VehiclesPage';
import { NotificationsPage } from '../pages/resident/NotificationsPage';
import { ProfilePage } from '../pages/resident/ProfilePage';

// Security Pages
import { SecurityDashboard } from '../pages/security/SecurityDashboard';
import { TodaysVisitors } from '../pages/security/TodaysVisitors';
import { EntryCheckin } from '../pages/security/EntryCheckin';
import { ExitCheckout } from '../pages/security/ExitCheckout';
import { VisitorLogs } from '../pages/security/VisitorLogs';
import { ViolationsPage } from '../pages/ViolationsPage';
import { SecurityViolations } from '../pages/security/SecurityViolations';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { SlotManagement } from '../pages/admin/SlotManagement';
import { UserManagement } from '../pages/admin/UserManagement';
import { AdminAnalytics } from '../pages/admin/AdminAnalytics';
import { AdminSettings } from '../pages/admin/AdminSettings';

import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated Dashboard Pages wrapped in DashboardLayout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Resident Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Resident', 'Admin']}>
              <ResidentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-parking"
          element={
            <ProtectedRoute allowedRoles={['Resident', 'Admin']}>
              <MyParking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visitor-booking"
          element={
            <ProtectedRoute allowedRoles={['Resident', 'Admin']}>
              <VisitorBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={['Resident', 'Admin']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Security']}>
              <VehiclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-vehicles"
          element={
            <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Security']}>
              <VehiclesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/violations"
          element={
            <ProtectedRoute allowedRoles={['Resident', 'Security', 'Admin']}>
              <ViolationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Security Routes */}
        <Route
          path="/security/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Security', 'Admin']}>
              <SecurityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/today"
          element={
            <ProtectedRoute allowedRoles={['Security', 'Admin']}>
              <TodaysVisitors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/entry"
          element={
            <ProtectedRoute allowedRoles={['Security', 'Admin']}>
              <EntryCheckin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/exit"
          element={
            <ProtectedRoute allowedRoles={['Security', 'Admin']}>
              <ExitCheckout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/logs"
          element={
            <ProtectedRoute allowedRoles={['Security', 'Admin']}>
              <VisitorLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/visitor-logs"
          element={
            <ProtectedRoute allowedRoles={['Security', 'Admin']}>
              <VisitorLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/violations"
          element={
            <ProtectedRoute allowedRoles={['Security', 'Admin']}>
              <SecurityViolations />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/slots"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <SlotManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/parking-slots"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <SlotManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/violations"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Security']}>
              <ViolationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
