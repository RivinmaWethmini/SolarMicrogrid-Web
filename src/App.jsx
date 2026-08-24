import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReservationManagement from './pages/ReservationManagement';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/reservations" replace />} />
        <Route path="/reservations" element={<ReservationManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
