import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { formatDateTime } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
 
const PAGE_SIZE = 10;
 
export default function Tickets() {
  const user = getUser();
  const isStaff = user.role === "admin" || user.role === "staff";
  const canRaise = isStaff || user.role === "customer";
 
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState(""); // status filter
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  // Load again whenever the status filter changes. The server filters by status
  // and by role (a customer only receives their own tickets).
  useEffect(() => {
    setLoading(true);
    setError("");
    request(`/api/tickets${status ? `?status=${status}` : ""}`)
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status]);
 
  // Text search done in the browser over the loaded tickets.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      [t.ticket_number, t.title, t.client_name, t.asset_type, t.serial_number, t.technician_name]
        .some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [tickets, search]);
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
 
  const inputClass =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0b4a34] focus:outline-none";
 
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {isStaff ? "Tickets" : "My tickets"}
        </h1>
        {canRaise && (
          <Link
            to="/tickets/new"
            className="rounded-md bg-[#0b4a34] px-4 py-2 text-sm font-medium text-white hover:bg-[#083a29]"
          >
            Raise a ticket
          </Link>
        )}
      </div>
 
      {/* Search and filter */}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search ticket, problem, asset..."
          className={`${inputClass} w-full sm:w-72`}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
 
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
 
      {!loading && !error && filtered.length === 0 && (
        <p className="mt-6 rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No tickets found.
        </p>
      )}
 
      {visible.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Ticket</th>
                <th className="px-4 py-3 font-semibold">Problem</th>
                {isStaff && <th className="px-4 py-3 font-semibold">Client</th>}
                <th className="px-4 py-3 font-semibold">Asset</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/tickets/${t.id}`} className="text-[#0b4a34] hover:underline">
                      {t.ticket_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{t.title}</td>
                  {isStaff && <td className="px-4 py-3">{t.client_name}</td>}
                  <td className="px-4 py-3">
                    {t.asset_type}
                    <span className="block text-xs text-slate-500">{t.serial_number}</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{t.priority}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
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
 
      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-600">
            Page {currentPage} of {totalPages} ({filtered.length} tickets)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
 