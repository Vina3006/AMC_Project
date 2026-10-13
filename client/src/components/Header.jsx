import { Link, useNavigate } from "react-router-dom";
import {getUser,logout as clearLogin} from "../utils/auth";
// Shared header used on every page.
export default function Header() {
  const navigate = useNavigate();
  const token = getUser();

 
  function logout() {
    clearLogin();
    navigate("/");
  }
 
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="leading-tight">
          <p className="text-xl font-bold text-[#0b4a34]">Divine Grace</p>
          <p className="text-xs text-slate-500">AMC System</p>
        </Link>
 
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/" className="text-slate-700 hover:text-[#0b4a34]">Home</Link>
          {token && (
            <Link to="/dashboard" className="text-slate-700 hover:text-[#0b4a34]">My Dashboard</Link>
          )}
          {token ? (
            <button
              onClick={logout}
              className="rounded-md border border-[#0b4a34] px-4 py-2 font-medium text-[#0b4a34] hover:bg-slate-50"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-[#0b4a34] px-4 py-2 font-medium text-white hover:bg-[#083a29]"
            >
              Customer Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}