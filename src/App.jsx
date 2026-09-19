import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReservationManagement from './pages/ReservationManagement';
import NodeManagement from './pages/NodeManagement';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/reservations" replace />} />
        <Route path="/reservations" element={<ReservationManagement />} />
        <Route path="/nodes" element={<NodeManagement />} />
      </Routes>
    </Router>
  );
}

export default App;