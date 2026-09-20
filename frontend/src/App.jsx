import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Ledger from './pages/Ledger';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import FinancialSetup from './pages/FinancialSetup';
import Projects from './pages/Projects';
import Categories from './pages/Categories';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import ExpenseRequests from './pages/ExpenseRequests';
import Approvals from './pages/Approvals';
import AuditLog from './pages/AuditLog';

import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

// Protected route wrapper for Admin-only pages
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<AppLayout />}>
            {/* Core Member & Admin Accessible Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/income" element={<Income />} />
            <Route path="/income/add" element={<Income />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/add" element={<Expenses />} />
            <Route path="/expense-requests" element={<ExpenseRequests />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin-Only Protected Routes */}
            <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="/approvals" element={<AdminRoute><Approvals /></AdminRoute>} />
            <Route path="/audit-log" element={<AdminRoute><AuditLog /></AdminRoute>} />
            <Route path="/financial-setup" element={<AdminRoute><FinancialSetup /></AdminRoute>} />
            <Route path="/projects" element={<AdminRoute><Projects /></AdminRoute>} />
            <Route path="/categories" element={<AdminRoute><Categories /></AdminRoute>} />
            <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
            <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
            <Route path="/documents" element={<AdminRoute><Documents /></AdminRoute>} />
            <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
