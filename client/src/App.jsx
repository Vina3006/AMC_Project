import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ServicePage from './pages/ServicePage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Dashboardlayout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Tickets from './pages/Tickets';
import NewTicket from './pages/NewTicket';
import TicketDetails from './pages/TicketDetail';
import Users from './pages/Users';
import Clients from './pages/Clients';
import Assets from './pages/Assets';
import Contracts from './pages/Contracts';
import InvoiceDetail from './pages/InvoiceDetail';









export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/services/:id" element={<ServicePage />} />

  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/invoices" element={<ProtectedRoute roles={["admin", "staff", "customer"]}><Invoices /></ProtectedRoute>} />
<Route path="/invoices/:id" element={<ProtectedRoute roles={["admin", "staff", "customer"]}><InvoiceDetail /></ProtectedRoute>} />
    <Route path="/tickets" element={<Tickets />} />
    <Route path="/clients" element={<ProtectedRoute roles={["admin", "staff"]}><Clients /></ProtectedRoute>} />
<Route path="/assets" element={<ProtectedRoute roles={["admin", "staff", "customer"]}><Assets /></ProtectedRoute>} />
<Route path="/contracts" element={<ProtectedRoute roles={["admin", "staff", "customer"]}><Contracts /></ProtectedRoute>} />
<Route path="/users" element={<ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>} />
    <Route
  path="/tickets/new"
  element={
    <ProtectedRoute roles={["customer", "admin", "staff"]}>
      <NewTicket />
    </ProtectedRoute>
  }
/>
<Route path="/tickets/:id" element={<TicketDetails />} />
  </Route>
</Routes>
    </div>
  );
}