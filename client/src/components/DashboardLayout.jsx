import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUser, logout, roleLabels } from "../utils/auth";
 
// The menu for each role. Only pages that exist are listed.
// When we build a new page, we add one line here.
const menus = {
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tickets", label: "Tickets" },
  ],
  staff: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tickets", label: "Tickets" },
  ],
  technician: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tickets", label: "My tickets" },
  ],
  customer: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tickets", label: "My tickets" },
    { to: "/tickets/new", label: "Raise a ticket" },
    { to: "/invoices", label: "My invoices" },
  ],
};
export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = getUser();
  const links = menus[user.role] || [];
 
  function handleLogout() {
    logout();
    navigate("/");
  }
 
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 md:flex-row">
      {/* Sidebar (becomes a top strip on phones) */}
      <aside className="flex flex-col bg-[#0b3d2e] text-white md:min-h-screen md:w-60 md:shrink-0">
        <Link to="/" className="block px-6 py-5 leading-tight">
          <p className="text-lg font-bold">Divine Grace</p>
          <p className="text-xs text-slate-300">AMC System</p>
        </Link>
 
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                "whitespace-nowrap rounded-md px-3 py-2 text-sm " +
                (isActive ? "bg-white/15 font-semibold" : "text-slate-200 hover:bg-white/10")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
 
        <div className="hidden border-t border-white/15 px-6 py-4 text-sm md:block">
          <p className="font-medium">{user.name || roleLabels[user.role]}</p>
          <p className="text-xs text-slate-300">{roleLabels[user.role]}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-md border border-white/40 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </aside>
 
      {/* The page content goes here */}
      <main className="flex-1 p-6 md:p-8">
        {/* Logout for phones, where the sidebar footer is hidden */}
        <div className="mb-4 flex justify-end md:hidden">
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            Logout
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
 