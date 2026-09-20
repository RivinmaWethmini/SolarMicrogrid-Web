import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReservationManagement from './pages/ReservationManagement';
import { Toaster } from 'react-hot-toast';

// TODO (Member 2): When Login page is ready, import and wrap protected routes:
// import PrivateRoute from './components/PrivateRoute';
// import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/reservations" replace />} />

        {/* TODO (Member 2): Replace with protected route when auth is integrated:
            <Route path="/reservations" element={<PrivateRoute><ReservationManagement /></PrivateRoute>} />
        */}
        <Route path="/reservations" element={<ReservationManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
