import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { formatDateTime } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
 
// Turns one history row into a readable sentence.
function historyText(h) {
  if (h.action === "created") return "Ticket created";
  if (h.action === "assigned") return "Assigned to a technician";
  if (h.action === "visit_scheduled") return "Visit scheduled";
  if (h.action === "visit_completed") return "Visit completed";
  if (h.action === "status_changed") {
    return `Status changed: ${String(h.old_status).replace("_", " ")} to ${String(h.new_status).replace("_", " ")}`;
  }
  return h.action;
}
 
export default function TicketDetail() {
  const { id } = useParams();
  const user = getUser();
  const isStaff = user.role === "admin" || user.role === "staff";
  const isTech = user.role === "technician";
  const isCustomer = user.role === "customer";
 
  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [visits, setVisits] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  // state for the action forms
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [completeForm, setCompleteForm] = useState({ work_done: "", notes: "", mark_resolved: true });
 
  // Loads everything about this ticket. We call it again after every action.
  const load = useCallback(async () => {
    try {
      const [t, h, v] = await Promise.all([
        request(`/api/tickets/${id}`),
        request(`/api/tickets/${id}/history`),
        request(`/api/visits?ticket_id=${id}`),
      ]);
      setTicket(t);
      setHistory(h);
      setVisits(v);
      if (isStaff) setTechnicians(await request("/api/tickets/technicians"));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, isStaff]);
 
  useEffect(() => {
    load();
  }, [load]);
 
  // Runs one action (an API call), shows a message, then reloads the data.
  async function act(fn, successMessage) {
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      await fn();
      setMessage(successMessage);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }
 
  function assign() {
    if (!technicianId) {
      setActionError("Please choose a technician.");
      return;
    }
    act(
      () => request(`/api/tickets/${id}/assign`, { method: "PUT", body: { technician_id: Number(technicianId) } }),
      "Technician assigned."
    );
  }
 
  function changeStatus(status) {
    act(
      () => request(`/api/tickets/${id}/status`, { method: "PUT", body: { status } }),
      `Ticket marked as ${status.replace("_", " ")}.`
    );
  }
 
  function scheduleVisit() {
    if (!visitTime) {
      setActionError("Please choose the visit date and time.");
      return;
    }
    // the date picker gives "2026-10-15T11:00", the server wants "2026-10-15 11:00:00"
    const scheduled_at = visitTime.replace("T", " ") + ":00";
    act(async () => {
      await request("/api/visits", { method: "POST", body: { ticket_id: Number(id), scheduled_at } });
      setVisitTime("");
    }, "Visit scheduled.");
  }
 
  function completeVisit(visitId) {
    if (completeForm.work_done.trim().length < 3) {
      setActionError("Please write what work was done.");
      return;
    }
    act(async () => {
      await request(`/api/visits/${visitId}/complete`, {
        method: "PUT",
        body: {
          work_done: completeForm.work_done.trim(),
          notes: completeForm.notes.trim(),
          mark_resolved: completeForm.mark_resolved,
        },
      });
      setCompletingId(null);
      setCompleteForm({ work_done: "", notes: "", mark_resolved: true });
    }, "Visit completed.");
  }
 
  if (loading) return <p className="text-slate-600">Loading...</p>;
  if (error) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <Link to="/tickets" className="mt-3 inline-block text-sm text-[#0b4a34] hover:underline">
          Back to tickets
        </Link>
      </div>
    );
  }
 
  // What this user is allowed to do right now
  const finished = ["resolved", "closed"].includes(ticket.status);
  const canAssign = isStaff && !finished;
  const canSchedule =
    (isStaff || (isTech && ticket.assigned_to === user.id)) && ticket.assigned_to && !finished;
  const canStart = isTech && ticket.status === "assigned";
  const canClose = isCustomer && ticket.status === "resolved";
  const canCompleteVisit = isStaff || isTech;
  const hasActions = canAssign || canSchedule || canStart || canClose || isStaff;
 
  const inputClass =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0b4a34] focus:outline-none";
  const buttonClass =
    "rounded-md bg-[#0b4a34] px-4 py-2 text-sm font-medium text-white hover:bg-[#083a29] disabled:opacity-60";
 
  const info = [
    ["Client", ticket.client_name],
    ["Asset", `${ticket.asset_type} ${ticket.brand || ""} ${ticket.model || ""}`],
    ["Serial number", ticket.serial_number],
    ["Priority", ticket.priority],
    ["Raised on", formatDateTime(ticket.created_at)],
    ["Due by (SLA)", formatDateTime(ticket.due_at)],
    ["Technician", ticket.technician_name || "Not assigned yet"],
    ["Resolved on", formatDateTime(ticket.resolved_at)],
    ["Type", ticket.ticket_type === "preventive" ? "Preventive maintenance" : "Repair request"],
  ];
 
  return (
    <div className="max-w-4xl">
      <Link to="/tickets" className="text-sm text-[#0b4a34] hover:underline">
        Back to tickets
      </Link>
 
      {/* Title row */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {ticket.ticket_number}: {ticket.title}
        </h1>
        <StatusBadge status={ticket.status} />
        {ticket.is_overdue && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
        )}
      </div>
 
      {/* Details */}
      <div className="mt-5 rounded-md border border-slate-200 bg-white p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          {info.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="mt-0.5 text-sm">{value || "-"}</dd>
            </div>
          ))}
        </dl>
        {ticket.description && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">Details</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{ticket.description}</p>
          </div>
        )}
      </div>
 
      {/* Actions */}
      {hasActions && (
        <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Actions</h2>
 
          {message && <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
          {actionError && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
 
          <div className="mt-4 space-y-5">
            {canAssign && (
              <div>
                <p className="text-sm font-medium">{ticket.assigned_to ? "Change technician" : "Assign a technician"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className={inputClass}>
                    <option value="">Select technician</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.open_tickets} open)
                      </option>
                    ))}
                  </select>
                  <button onClick={assign} disabled={busy} className={buttonClass}>
                    Assign
                  </button>
                </div>
                {technicians.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">No technicians found. Give a user the technician role first.</p>
                )}
              </div>
            )}
 
            {canStart && (
              <div>
                <button onClick={() => changeStatus("in_progress")} disabled={busy} className={buttonClass}>
                  Start work
                </button>
              </div>
            )}
 
            {canSchedule && (
              <div>
                <p className="text-sm font-medium">Schedule a visit</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="datetime-local"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className={inputClass}
                  />
                  <button onClick={scheduleVisit} disabled={busy} className={buttonClass}>
                    Schedule visit
                  </button>
                </div>
              </div>
            )}
 
            {canClose && (
              <div>
                <p className="text-sm text-slate-600">The work is done. Please confirm and close the ticket.</p>
                <button onClick={() => changeStatus("closed")} disabled={busy} className={`${buttonClass} mt-2`}>
                  Confirm and close
                </button>
              </div>
            )}
 
            {isStaff && (
              <div>
                <p className="text-sm font-medium">Change status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={inputClass}>
                    <option value="">Select status</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    onClick={() => (newStatus ? changeStatus(newStatus) : setActionError("Please choose a status."))}
                    disabled={busy}
                    className={buttonClass}
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
 
      {/* Visits */}
      <div className="mt-6">
        <h2 className="font-semibold text-slate-900">Technician visits</h2>
        {visits.length === 0 ? (
          <p className="mt-3 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No visits yet.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {visits.map((v) => (
              <div key={v.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {formatDateTime(v.scheduled_at)} with {v.technician_name}
                  </p>
                  <StatusBadge status={v.status} />
                </div>
 
                {v.status === "completed" && (
                  <div className="mt-2 text-sm text-slate-700">
                    <p>
                      <span className="text-slate-500">Work done: </span>
                      {v.work_done}
                    </p>
                    {v.notes && (
                      <p>
                        <span className="text-slate-500">Notes: </span>
                        {v.notes}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">Completed on {formatDateTime(v.completed_at)}</p>
                  </div>
                )}
 
                {v.status === "scheduled" && canCompleteVisit && (
                  <div className="mt-3">
                    {completingId === v.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={completeForm.work_done}
                          onChange={(e) => setCompleteForm({ ...completeForm, work_done: e.target.value })}
                          rows={3}
                          placeholder="What work was done?"
                          className={`${inputClass} w-full`}
                        />
                        <input
                          value={completeForm.notes}
                          onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                          placeholder="Notes (optional)"
                          className={`${inputClass} w-full`}
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={completeForm.mark_resolved}
                            onChange={(e) => setCompleteForm({ ...completeForm, mark_resolved: e.target.checked })}
                          />
                          The problem is solved (mark the ticket as resolved)
                        </label>
                        <div className="flex gap-2">
                          <button onClick={() => completeVisit(v.id)} disabled={busy} className={buttonClass}>
                            Save visit
                          </button>
                          <button
                            onClick={() => setCompletingId(null)}
                            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setCompletingId(v.id)} className={buttonClass}>
                        Complete this visit
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* History */}
      <div className="mt-6">
        <h2 className="font-semibold text-slate-900">History</h2>
        {history.length === 0 ? (
          <p className="mt-3 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No history recorded for this ticket.
          </p>
        ) : (
          <ol className="mt-3 space-y-4 border-l-2 border-slate-200 pl-5">
            {history.map((h) => (
              <li key={h.id}>
                <p className="text-sm font-medium text-slate-900">{historyText(h)}</p>
                {h.note && <p className="text-sm text-slate-600">{h.note}</p>}
                <p className="text-xs text-slate-500">
                  {formatDateTime(h.created_at)}
                  {h.changed_by ? ` by ${h.changed_by}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
 
