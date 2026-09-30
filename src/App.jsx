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
          <Route path="/" element={<Onboarding />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/reservations"
            element={
              <ProtectedRoute
                allowedRoles={['Admin', 'Prosumer', 'Consumer', 'GridOperator']}
              >
                <ReservationDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nodes"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'GridOperator']}>
                <NodeManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scan"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'GridOperator']}>
                <QrScannerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminProsumerApprovals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={<Navigate to="/admin/approvals" replace />}
          />

          <Route
            path="/admin/*"
            element={<Navigate to="/admin/approvals" replace />}
          />

          <Route
            path="*"
            element={<Navigate to="/reservations" replace />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;