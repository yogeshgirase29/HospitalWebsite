import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ViewAppointment from './pages/ViewAppointment';
import DoctorLeaveManagement from './pages/DoctorLeaveManagement';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CompounderLogin from './pages/CompounderLogin';
import CompounderDashboard from './pages/CompounderDashboard';
import ValidateAppointment from './pages/ValidateAppointment';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/appointments/:id" element={<ViewAppointment />} />
          <Route path="/admin/doctors/:id/leave" element={<DoctorLeaveManagement />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/compounder/login" element={<CompounderLogin />} />
          <Route path="/compounder/dashboard" element={<CompounderDashboard />} />
          <Route path="/appointment/validate/:id" element={<ValidateAppointment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
