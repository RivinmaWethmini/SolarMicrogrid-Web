import React from 'react';
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
