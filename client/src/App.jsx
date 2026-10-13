import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ServicePage from './pages/ServicePage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/services/:id" element={<ServicePage />} />

  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/invoices" element={<Invoices />} />
  </Route>
</Routes>
    </div>
  );
}