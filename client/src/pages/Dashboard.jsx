import { useEffect, useState } from "react";
import { request } from "../utils/request";
import { getUser, roleLabels } from "../utils/auth";
import {Link} from "react-router-dom";
// Which numbers to show for each role. "key" is the field name from GET /api/dashboard.
// danger = turn red when the value is above 0, warn = turn amber.
const cardsByRole = {
  admin: [
    { key: "clients", label: "Clients" },
    { key: "assets", label: "Assets" },
    { key: "active_contracts", label: "Active contracts" },
    { key: "open_tickets", label: "Open tickets" },
    { key: "unassigned_tickets", label: "Waiting for assignment", warn: true },
    { key: "overdue_tickets", label: "Overdue tickets", danger: true },
    { key: "resolved_this_month", label: "Resolved this month" },
    { key: "visits_today", label: "Visits today" },
    { key: "total_revenue", label: "Revenue collected", money: true },
  ],
  technician: [
    { key: "assigned_tickets", label: "Assigned to me" },
    { key: "in_progress_tickets", label: "In progress" },
    { key: "overdue_tickets", label: "Overdue", danger: true },
    { key: "resolved_tickets", label: "Resolved" },
    { key: "upcoming_visits", label: "Upcoming visits" },
  ],
  customer: [
    { key: "my_assets", label: "My assets" },
    { key: "active_contracts", label: "Active contracts" },
    { key: "open_tickets", label: "Open tickets" },
    { key: "resolved_tickets", label: "Resolved tickets" },
    { key: "total_paid", label: "Total paid", money: true },
  ],
};
cardsByRole.staff = cardsByRole.admin;
 
const statusStyles = {
  open: "bg-blue-100 text-blue-800",
  assigned: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-slate-200 text-slate-700",
};
 
const statusOrder = ["open", "assigned", "in_progress", "resolved", "closed"];
 
function StatCard({ card, value }) {
  const number = Number(value) || 0;
  let color = "text-slate-900";
  if (card.danger && number > 0) color = "text-red-600";
  if (card.warn && number > 0) color = "text-amber-600";
 
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{card.label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>
        {card.money ? `₹${number.toLocaleString("en-IN")}` : number}
      </p>
    </div>
  );
}
 
function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
 
export default function Dashboard() {
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    // Ask for the numbers and the ticket list at the same time.
    Promise.all([request("/api/dashboard"), request("/api/tickets")])
      .then(([dashboard, ticketList]) => {
        setStats(dashboard);
        setTickets(ticketList.slice(0, 6)); // newest 6
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
 
  if (loading) return <p className="text-slate-600">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
 
  const cards = cardsByRole[user.role] || [];
  const isStaffSide = user.role === "admin" || user.role === "staff";
  const byStatus = stats.tickets_by_status || [];
  const maxCount = Math.max(1, ...byStatus.map((s) => s.n));
 
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        {user.name ? `Welcome, ${user.name}` : `Signed in as ${roleLabels[user.role]}`}
      </p>
 
      {stats.linked === false && (
        <p className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          Your account is not linked to a client yet. Please ask the administrator to link it.
        </p>
      )}
 
      {/* Number cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.key} card={card} value={stats[card.key]} />
        ))}
      </div>
 
      {/* Tickets by status (admin and staff only) */}
      {isStaffSide && byStatus.length > 0 && (
        <div className="mt-8 rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Tickets by status</h2>
          <div className="mt-4 space-y-3">
            {statusOrder.map((status) => {
              const row = byStatus.find((s) => s.status === status);
              const n = row ? row.n : 0;
              return (
                <div key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-slate-600">{status.replace("_", " ")}</span>
                  <div className="h-3 flex-1 rounded bg-slate-100">
                    <div
                      className="h-3 rounded bg-[#0b4a34]"
                      style={{ width: `${(n / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
 
      {/* Recent tickets */}
      <div className="mt-8">
        <h2 className="font-semibold text-slate-900">Recent tickets</h2>
 
        {tickets.length === 0 ? (
          <p className="mt-3 rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
            No tickets yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ticket</th>
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold">Asset</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Due</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0">
                   <td className="px-4 py-3 font-medium">
  <Link to={`/tickets/${t.id}`} className="text-[#0b4a34] hover:underline">
    {t.ticket_number}
  </Link>
</td>
                    <td className="px-4 py-3">{t.title}</td>
                    <td className="px-4 py-3">{t.asset_type}</td>
                    <td className="px-4 py-3 capitalize">{t.priority}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyles[t.status]}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {formatDateTime(t.due_at)}
                      {t.is_overdue && (
                        <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Overdue
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
 