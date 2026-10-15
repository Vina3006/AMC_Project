import { Link } from "react-router-dom";
import { company } from "../utils/company";
 
// Footer for the public pages (Home, Service, Contact, Login).
export default function Footer() {
  return (
    <footer className="bg-[#0b3d2e] text-slate-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">{company.name}</p>
          <p className="text-xs text-slate-300">{company.tagline}</p>
          <p className="mt-3 max-w-xs text-sm text-slate-300">
            Computer AMC and IT support for businesses. We look after your computers so you can focus on work.
          </p>
        </div>
 
        <div>
          <p className="text-sm font-semibold text-white">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white hover:underline">Home</Link></li>
            <li><a href="/#services" className="hover:text-white hover:underline">Services</a></li>
            <li><Link to="/contact" className="hover:text-white hover:underline">Contact us</Link></li>
            <li><Link to="/login" className="hover:text-white hover:underline">Customer login</Link></li>
          </ul>
        </div>
 
        <div>
          <p className="text-sm font-semibold text-white">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>{company.phone}</li>
            <li>{company.email}</li>
            <li>{company.address}</li>
            <li>{company.hours}</li>
          </ul>
        </div>
      </div>
 
      <div className="border-t border-white/15 px-6 py-4 text-center text-xs text-slate-400">
        &copy; 2026 {company.name} {company.tagline}. All rights reserved.
      </div>
    </footer>
  );
}
 
