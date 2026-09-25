import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReservationDashboard from './pages/ReservationDashboard';
import NodeManagement from './pages/NodeManagement';
import QrScannerPage from './pages/QrScannerPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/reservations" replace />}
        />

        <Route
          path="/reservations"
          element={<ReservationDashboard />}
        />

        <Route
          path="/nodes"
          element={<NodeManagement />}
        />

        <Route
          path="/scan"
          element={<QrScannerPage />}
        />
      </Routes>
    </Router>
  );
}

export default App;