import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ReservationManagement from './pages/ReservationManagement';
import AdminProsumerApprovals from './pages/AdminProsumerApprovals';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              'font-sans font-semibold text-xs rounded-2xl bg-[#16171E] text-white border border-white/10 shadow-xl',
          }}
        />
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Energy Slot Queue (Admin, Prosumer, Consumer) */}
          <Route
            path="/reservations"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Prosumer', 'Consumer']}>
                <ReservationManagement />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Prosumer Verification & Approvals Suite */}
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminProsumerApprovals />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/approvals" replace />} />

          {/* Default and Wildcard Fallbacks */}
          <Route path="/" element={<Navigate to="/reservations" replace />} />
          <Route path="*" element={<Navigate to="/reservations" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
import ReservationDashboard from './pages/ReservationDashboard';
import NodeManagement from './pages/NodeManagement';
import QrScannerPage from './pages/QrScannerPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/reservations" replace />} />
        <Route path="/reservations" element={<ReservationDashboard />} />
        {/* Member 3 - Avishka: Node Management */}
        <Route path="/nodes" element={<NodeManagement />} />
        {/* Member 4 - QR Dispatch Verification */}
        <Route path="/scan" element={<QrScannerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
