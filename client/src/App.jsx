import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import ServicePage from './pages/ServicePage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services/:id" element={<ServicePage />} />
      </Routes>
    </div>
  );
}