import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import ServicePage from './pages/ServicePage';
import ProtectedRoute from './components/ProtectedRoute';
import Invoices from './pages/Invoices';
export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      
      <Routes>
       
        <Route path="/" element={<Home />} />
        <Route path="/services/:id" element={<ServicePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path='/invoices' element={
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}