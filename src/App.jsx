import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ReservationDashboard from './pages/ReservationDashboard';
import NodeManagement from './pages/NodeManagement';
import QrScannerPage from './pages/QrScannerPage';
import AdminProsumerApprovals from './pages/AdminProsumerApprovals';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3600,
            className: 'ops-toast',
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
              <ProtectedRoute allowedRoles={['Admin', 'Prosumer', 'Consumer', 'GridOperator']}>
                <ReservationDashboard />
              </ProtectedRoute>
            }
          />

          {/* Member 3 - Avishka: Microgrid Node Management */}
          <Route
            path="/nodes"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'GridOperator']}>
                <NodeManagement />
              </ProtectedRoute>
            }
          />

          {/* Member 4 - Rivinma: QR Dispatch Verification Pass Scanner */}
          <Route
            path="/scan"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'GridOperator', 'Prosumer']}>
                <QrScannerPage />
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
  );
}

export default App;
