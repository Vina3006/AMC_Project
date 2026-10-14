import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../utils/request";
import { formatDate, formatMoney, toInputDate } from "../utils/format";
import { Field, inputClass, buttonClass, secondaryButtonClass } from "../components/ui";
 
// Turns minutes into a friendly text like "5h 20m" or "2d 3h".
function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return "-";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
 
// Quick date ranges. Each returns { from, to } as "YYYY-MM-DD".
const presets = [
  { label: "Last 30 days", range: () => ({ from: toInputDate(new Date(Date.now() - 30 * 86400000)), to: toInputDate(new Date()) }) },
  { label: "This month", range: () => { const n = new Date(); return { from: toInputDate(new Date(n.getFullYear(), n.getMonth(), 1)), to: toInputDate(n) }; } },
  { label: "Last 6 months", range: () => { const n = new Date(); return { from: toInputDate(new Date(n.getFullYear(), n.getMonth() - 5, 1)), to: toInputDate(n) }; } },
  { label: "This year", range: () => { const n = new Date(); return { from: toInputDate(new Date(n.getFullYear(), 0, 1)), to: toInputDate(n) }; } },
];
 
function Card({ label, value, note, tone }) {
  const color = tone === "bad" ? "text-red-600" : tone === "good" ? "text-green-700" : "text-slate-900";
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
 
function Section({ title, children }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
 
const th = "px-4 py-3 font-semibold";
const td = "px-4 py-3";
const tableWrap = "overflow-x-auto rounded-md border border-slate-200 bg-white";
const head = "border-b border-slate-200 bg-slate-100 text-slate-700";
 
export default function Reports() {
  const initial = presets[0].range();
  const [range, setRange] = useState(initial); // what the inputs show
  const [applied, setApplied] = useState(initial); // what the report is built for
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    setLoading(true);
    setError("");
    request(`/api/reports?from=${applied.from}&to=${applied.to}`)
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [applied]);
 
  function applyDates(e) {
    e.preventDefault();
    if (range.from > range.to) {
      setError("The start date must not be after the end date.");
      return;
    }
    setApplied(range);
  }
 
  function usePreset(p) {
    const r = p.range();
    setRange(r);
    setApplied(r);
  }
 
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <button onClick={() => window.print()} className={`${secondaryButtonClass} print:hidden`}>Print report</button>
      </div>
 
      {/* Date range */}
      <form onSubmit={applyDates} className="mt-5 rounded-md border border-slate-200 bg-white p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="From">
            <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className={inputClass} />
          </Field>
          <Field label="To">
            <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className={inputClass} />
          </Field>
          <button type="submit" className={buttonClass}>Show report</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.label} type="button" onClick={() => usePreset(p)} className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50">
              {p.label}
            </button>
          ))}
        </div>
      </form>
 
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}
 
      {report && !loading && (
        <div>
          <p className="mt-4 text-sm text-slate-600">
            Report for {formatDate(report.range.from)} to {formatDate(report.range.to)}
          </p>
 
          {/* ---------------- Tickets ---------------- */}
          <Section title="Tickets and SLA">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card label="Tickets raised" value={report.tickets.total} />
              <Card label="Resolved or closed" value={report.tickets.resolved} />
              <Card
                label="Resolved within SLA"
                value={report.tickets.sla_percent === null ? "-" : `${report.tickets.sla_percent}%`}
                note={`${report.tickets.within_sla} of ${report.tickets.sla_measured} measured`}
                tone={report.tickets.sla_percent === null ? undefined : report.tickets.sla_percent >= 80 ? "good" : "bad"}
              />
              <Card label="Average time to resolve" value={formatDuration(report.tickets.avg_minutes)} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Tickets from this period that are overdue right now:{" "}
              <span className={report.tickets.overdue_now > 0 ? "font-semibold text-red-600" : "font-semibold"}>
                {report.tickets.overdue_now}
              </span>
            </p>
 
            <div className={`${tableWrap} mt-4`}>
              <table className="w-full text-left text-sm">
                <thead className={head}>
                  <tr>
                    <th className={th}>Priority</th>
                    <th className={th}>Raised</th>
                    <th className={th}>Resolved</th>
                    <th className={th}>Missed the deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {report.by_priority.map((r) => (
                    <tr key={r.priority} className="border-b border-slate-100 last:border-0">
                      <td className={`${td} capitalize`}>{r.priority}</td>
                      <td className={td}>{r.total}</td>
                      <td className={td}>{r.resolved}</td>
                      <td className={td}>{r.breached}</td>
                    </tr>
                  ))}
                  {report.by_priority.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No tickets in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
 
          {/* ---------------- Technicians ---------------- */}
          <Section title="Technician performance">
            <div className={tableWrap}>
              <table className="w-full text-left text-sm">
                <thead className={head}>
                  <tr>
                    <th className={th}>Technician</th>
                    <th className={th}>Tickets assigned</th>
                    <th className={th}>Resolved</th>
                    <th className={th}>Average time</th>
                    <th className={th}>Overdue now</th>
                  </tr>
                </thead>
                <tbody>
                  {report.by_technician.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0">
                      <td className={`${td} font-medium`}>{r.name}</td>
                      <td className={td}>{r.assigned}</td>
                      <td className={td}>{r.resolved}</td>
                      <td className={td}>{formatDuration(r.avg_minutes)}</td>
                      <td className={td}>{r.overdue}</td>
                    </tr>
                  ))}
                  {report.by_technician.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No assigned tickets in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
 
          {/* ---------------- Assets ---------------- */}
          <Section title="Assets with the most tickets">
            <div className={tableWrap}>
              <table className="w-full text-left text-sm">
                <thead className={head}>
                  <tr>
                    <th className={th}>Asset</th>
                    <th className={th}>Serial number</th>
                    <th className={th}>Client</th>
                    <th className={th}>Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_assets.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0">
                      <td className={td}>{a.asset_type} {a.brand} {a.model}</td>
                      <td className={td}>{a.serial_number}</td>
                      <td className={td}>{a.client_name}</td>
                      <td className={`${td} font-medium`}>{a.ticket_count}</td>
                    </tr>
                  ))}
                  {report.top_assets.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No tickets in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
 
          {/* ---------------- Money ---------------- */}
          <Section title="Billing and revenue">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card label="Billed" value={formatMoney(report.invoices.billed)} note={`${report.invoices.count} invoices`} />
              <Card label="Collected" value={formatMoney(report.invoices.collected)} tone="good" />
              <Card label="Outstanding" value={formatMoney(report.invoices.outstanding)} />
              <Card label="Overdue amount" value={formatMoney(report.invoices.overdue_amount)} tone={report.invoices.overdue_amount > 0 ? "bad" : undefined} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Check: billed {formatMoney(report.invoices.billed)} = collected {formatMoney(report.invoices.collected)} + outstanding{" "}
              {formatMoney(report.invoices.outstanding)}. Invoices are counted by the date they were created.
            </p>
 
            <div className={`${tableWrap} mt-4`}>
              <table className="w-full text-left text-sm">
                <thead className={head}>
                  <tr>
                    <th className={th}>Month</th>
                    <th className={th}>Billed</th>
                    <th className={th}>Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {report.revenue_by_month.map((r) => (
                    <tr key={r.month} className="border-b border-slate-100 last:border-0">
                      <td className={td}>{r.month}</td>
                      <td className={td}>{formatMoney(r.billed)}</td>
                      <td className={td}>{formatMoney(r.collected)}</td>
                    </tr>
                  ))}
                  {report.revenue_by_month.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">No invoices in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
 
            <div className={`${tableWrap} mt-4`}>
              <table className="w-full text-left text-sm">
                <thead className={head}>
                  <tr>
                    <th className={th}>Invoice type</th>
                    <th className={th}>Invoices</th>
                    <th className={th}>Billed</th>
                    <th className={th}>Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {report.by_invoice_type.map((r) => (
                    <tr key={r.invoice_type} className="border-b border-slate-100 last:border-0">
                      <td className={`${td} capitalize`}>{r.invoice_type}</td>
                      <td className={td}>{r.invoices}</td>
                      <td className={td}>{formatMoney(r.billed)}</td>
                      <td className={td}>{formatMoney(r.collected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
 
          {/* ---------------- Contracts ---------------- */}
          <Section title="Contracts (as of today)">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card label="Active" value={report.contracts.active} tone="good" />
              <Card label="Expired" value={report.contracts.expired} />
              <Card label="Cancelled" value={report.contracts.cancelled} />
            </div>
 
            <h3 className="mt-5 text-sm font-semibold text-slate-900">Expiring in the next 30 days</h3>
            <div className={`${tableWrap} mt-2`}>
              <table className="w-full text-left text-sm">
                <thead className={head}>
                  <tr>
                    <th className={th}>Client</th>
                    <th className={th}>Plan</th>
                    <th className={th}>Ends on</th>
                    <th className={th}>Days left</th>
                    <th className={th}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {report.contracts.expiring_soon.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className={td}>{c.client_name}</td>
                      <td className={td}>{c.plan_name}</td>
                      <td className={td}>{formatDate(c.end_date)}</td>
                      <td className={`${td} ${c.days_left <= 7 ? "font-semibold text-red-600" : ""}`}>{c.days_left}</td>
                      <td className={td}>{formatMoney(c.amount)}</td>
                    </tr>
                  ))}
                  {report.contracts.expiring_soon.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No contracts are about to expire.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500 print:hidden">
              To renew a contract, open <Link to="/contracts" className="text-[#0b4a34] hover:underline">Contracts</Link> and create a new one for the client.
            </p>
          </Section>
        </div>
      )}
    </div>
  );
}
 
