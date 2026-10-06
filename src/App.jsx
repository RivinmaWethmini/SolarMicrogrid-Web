import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ReservationDashboard from './pages/ReservationDashboard';
import NodeManagement from './pages/NodeManagement';
import QrScannerPage from './pages/QrScannerPage';
import BackofficeDashboard from './pages/BackofficeDashboard';
import ProsumerManagement from './pages/ProsumerManagement';
import AdminProsumerApprovals from './pages/AdminProsumerApprovals';

// Main Application Component for Solar Microgrid Operations Portal:
// - Wraps application in AuthProvider to give child routes access to user state, login, and token methods
// - Configures React Router with public authentication pages and role-protected dashboards
function App() {
  return (
    // 1. Global AuthProvider provides session hydration, token management, and RBAC helpers
    <AuthProvider>
      <Router>
        {/* Global Toast Notification System */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3600,
            className: 'ops-toast',
          }}
        />
        <Routes>
          {/* Public Onboarding & Authentication Routes (accessible to unauthenticated guests) */}
          <Route path="/" element={<Onboarding />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Member 2 - Manuga: Backoffice Administration & Prosumer Management */}
          <Route
            path="/backoffice"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Backoffice']}>
                <BackofficeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prosumers"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Backoffice']}>
                <ProsumerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/prosumers"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Backoffice']}>
                <AdminProsumerApprovals />
              </ProtectedRoute>
            }
          />

          {/* Protected Energy Slot Queue (Admin, Backoffice, Prosumer, Consumer, GridOperator) */}
          <Route
            path="/reservations"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Backoffice', 'Prosumer', 'Consumer', 'GridOperator']}>
                <ReservationDashboard />
              </ProtectedRoute>
            }
          />

          {/* Member 3 - Avishka: Microgrid Node Management */}
          <Route
            path="/nodes"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Backoffice', 'GridOperator', 'Prosumer']}>
                <NodeManagement />
              </ProtectedRoute>
            }
          />

          {/* Member 4 - QR Dispatch Verification Pass Scanner */}
          <Route
            path="/scan"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Backoffice', 'GridOperator', 'Prosumer']}>
                <QrScannerPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Prosumer Verification & Approvals (Admin Only) */}
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Backoffice']}>
                <AdminProsumerApprovals />
              </ProtectedRoute>
            }
          />

          {/* Admin Operations Console Fallback */}
          <Route path="/admin" element={<Navigate to="/backoffice" replace />} />
          <Route path="/admin/*" element={<Navigate to="/backoffice" replace />} />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
