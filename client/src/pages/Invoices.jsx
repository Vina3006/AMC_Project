import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { formatDate, formatMoney } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import { Field, inputClass, buttonClass, secondaryButtonClass } from "../components/ui";
 
const emptyForm = {
  client_id: "", kind: "contract", contract_id: "", ticket_id: "",
  amount: "", description: "", due_date: "",
};
 
// 15 days from today, as "YYYY-MM-DD"
function defaultDueDate() {
  const d = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
 
export default function Invoices() {
  const user = getUser();
  const isStaff = user.role === "admin" || user.role === "staff";
 
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [payingId, setPayingId] = useState(null);
 
  // create-invoice form (staff only)
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [saving, setSaving] = useState(false);
 
  async function load() {
    try {
      setInvoices(await request(`/api/invoices${status ? `?status=${status}` : ""}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
 
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) =>
      [i.invoice_number, i.client_name, i.description, i.ticket_number, i.plan_name]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [invoices, search]);
 
  // ---------- customer: pay an unpaid invoice ----------
  async function payNow(inv) {
    const ok = window.confirm(`Pay ${formatMoney(inv.amount)} for ${inv.invoice_number}? (This is a simulated payment.)`);
    if (!ok) return;
 
    setPayingId(inv.id);
    setError("");
    setMessage("");
    try {
      const data = await request(`/api/invoices/${inv.id}/pay`, { method: "POST" });
      setMessage(`${data.message}. Transaction reference: ${data.transaction_ref}`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPayingId(null);
    }
  }
 
  // ---------- staff: create an invoice ----------
  async function openForm() {
    setForm({ ...emptyForm, due_date: defaultDueDate() });
    setShowForm(true);
    setError("");
    setMessage("");
    try {
      const [clientList, ticketList] = await Promise.all([request("/api/clients"), request("/api/tickets")]);
      setClients(clientList);
      setTickets(ticketList);
    } catch (err) {
      setError(err.message);
    }
  }
 
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  async function chooseClient(e) {
    const clientId = e.target.value;
    setForm({ ...form, client_id: clientId, contract_id: "", ticket_id: "", amount: "" });
    setContracts([]);
    if (!clientId) return;
    try {
      setContracts(await request(`/api/contracts?client_id=${clientId}`));
    } catch (err) {
      setError(err.message);
    }
  }
 
  function chooseContract(e) {
    const contract = contracts.find((c) => String(c.id) === e.target.value);
    // fill in the contract amount, the staff member can still change it
    setForm({ ...form, contract_id: e.target.value, amount: contract ? contract.amount : "" });
  }
 
  // Resolved or closed tickets of this client that have no invoice yet.
  const billedTicketIds = new Set(invoices.filter((i) => i.ticket_id).map((i) => i.ticket_id));
  const billableTickets = tickets.filter(
    (t) =>
      String(t.client_id) === String(form.client_id) &&
      ["resolved", "closed"].includes(t.status) &&
      !billedTicketIds.has(t.id)
  );
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
 
    if (!form.client_id) return setError("Please choose a client.");
    if (form.kind === "contract" && !form.contract_id) return setError("Please choose the contract.");
    if (form.kind === "ticket" && !form.ticket_id) return setError("Please choose the ticket.");
    if (!(Number(form.amount) > 0)) return setError("The amount must be more than 0.");
 
    setSaving(true);
    try {
      const data = await request("/api/invoices", {
        method: "POST",
        body: {
          client_id: Number(form.client_id),
          contract_id: form.kind === "contract" ? Number(form.contract_id) : undefined,
          ticket_id: form.kind === "ticket" ? Number(form.ticket_id) : undefined,
          amount: Number(form.amount),
          description: form.description.trim(),
          due_date: form.due_date || undefined,
        },
      });
      setMessage(`Invoice ${data.invoice_number} created.`);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
 
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{isStaff ? "Invoices" : "My invoices"}</h1>
        {isStaff && !showForm && (
          <button onClick={openForm} className={buttonClass}>Create invoice</button>
        )}
      </div>
 
      {message && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
 
      {/* Create invoice form (staff only) */}
      {isStaff && showForm && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-md border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Create an invoice</h2>
 
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client">
              <select value={form.client_id} onChange={chooseClient} className={inputClass}>
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
 
            <Field label="Invoice for">
              <select name="kind" value={form.kind} onChange={handleChange} className={inputClass}>
                <option value="contract">An AMC contract (yearly fee)</option>
                <option value="ticket">A resolved ticket (service charge)</option>
              </select>
            </Field>
 
            {form.kind === "contract" ? (
              <Field label="Contract">
                <select value={form.contract_id} onChange={chooseContract} className={inputClass}>
                  <option value="">Select a contract</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>{c.plan_name} ({formatMoney(c.amount)})</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Ticket" hint="Only resolved or closed tickets without an invoice are listed">
                <select name="ticket_id" value={form.ticket_id} onChange={handleChange} className={inputClass}>
                  <option value="">Select a ticket</option>
                  {billableTickets.map((t) => (
                    <option key={t.id} value={t.id}>{t.ticket_number}: {t.title}</option>
                  ))}
                </select>
              </Field>
            )}
 
            <Field label="Amount (₹)">
              <input type="number" min="1" name="amount" value={form.amount} onChange={handleChange} className={inputClass} />
            </Field>
 
            <Field label="Due date">
              <input type="date" name="due_date" value={form.due_date} onChange={handleChange} className={inputClass} />
            </Field>
 
            <Field label="Description (optional)" hint="Leave empty to use an automatic description">
              <input name="description" value={form.description} onChange={handleChange} maxLength={255} className={inputClass} />
            </Field>
          </div>
 
          {error && <p className="text-sm text-red-600">{error}</p>}
 
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={buttonClass}>
              {saving ? "Saving..." : "Create invoice"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      )}
 
      {!showForm && error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
 
      {/* Search and filter */}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices..."
          className={`${inputClass} !mt-0 w-full sm:w-72`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} !mt-0 w-auto`}>
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
      </div>
 
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}
 
      {!loading && (
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Invoice</th>
                {isStaff && <th className="px-4 py-3 font-semibold">Client</th>}
                <th className="px-4 py-3 font-semibold">For</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/invoices/${inv.id}`} className="text-[#0b4a34] hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  {isStaff && <td className="px-4 py-3">{inv.client_name || "-"}</td>}
                  <td className="px-4 py-3">{inv.description || "-"}</td>
                  <td className="px-4 py-3">{formatDate(inv.created_at)}</td>
                  <td className="px-4 py-3">{inv.due_date ? formatDate(inv.due_date) : "-"}</td>
                  <td className="px-4 py-3">{formatMoney(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                    {inv.is_overdue && (
                      <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isStaff && inv.status === "unpaid" ? (
                      <button onClick={() => payNow(inv)} disabled={payingId === inv.id} className={buttonClass}>
                        {payingId === inv.id ? "Paying..." : "Pay now"}
                      </button>
                    ) : (
                      <Link to={`/invoices/${inv.id}`} className="text-[#0b4a34] hover:underline">
                        {inv.status === "paid" ? "Receipt" : "View"}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={isStaff ? 8 : 7} className="px-4 py-6 text-center text-slate-500">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
