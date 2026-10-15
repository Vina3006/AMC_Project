import { Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ServicePage from './pages/ServicePage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
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
import Reports from './pages/Reports';
import Contact from './pages/Contact';
import ServicesAdmin from './pages/ServicesAdmin';
import Messages from './pages/Messages';
 
export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Routes>
        {/* ---------- public pages ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/services/:id" element={<ServicePage />} />
        <Route path="/contact" element={<Contact />} />
 
        {/* ---------- logged-in area (menu on the side) ---------- */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
 
          <Route path="/invoices" element={<ProtectedRoute roles={["admin", "staff", "customer"]}><Invoices /></ProtectedRoute>} />
          <Route path="/invoices/:id" element={<ProtectedRoute roles={["admin", "staff", "customer"]}><InvoiceDetail /></ProtectedRoute>} />
 
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/new" element={<ProtectedRoute roles={["customer", "admin", "staff"]}><NewTicket /></ProtectedRoute>} />
          <Route path="/tickets/:id" element={<TicketDetails />} />
 
          <Route path="/reports" element={<ProtectedRoute roles={["admin", "staff"]}><Reports /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute roles={["admin", "staff"]}><Clients /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute roles={["admin", "staff", "customer"]}><Assets /></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute roles={["admin", "staff", "customer"]}><Contracts /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute roles={["admin", "staff"]}><Messages /></ProtectedRoute>} />
 
          <Route path="/users" element={<ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>} />
          <Route path="/manage-services" element={<ProtectedRoute roles={["admin"]}><ServicesAdmin /></ProtectedRoute>} />
        </Route>
 
        {/* ---------- any other address ---------- */}
        <Route
          path="*"
          element={
            <div className="p-12 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
              <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
              <Link to="/" className="mt-4 inline-block text-[#0b4a34] hover:underline">
                Go to the home page
              </Link>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
