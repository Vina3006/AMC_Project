import { Routes, Route } from 'react-router-dom';
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
    <Route path="/tickets" element={<Tickets />} />
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