import { useEffect, useState } from "react";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { formatDate, formatDateTime, toInputDate } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import { Field, inputClass, buttonClass, secondaryButtonClass } from "../components/ui";
 
const th = "px-4 py-3 font-semibold";
const td = "px-4 py-3";
const head = "border-b border-slate-200 bg-slate-100 text-slate-700";
const tableWrap = "overflow-x-auto rounded-md border border-slate-200 bg-white";
 
export default function Maintenance() {
  const user = getUser();
  const isAdmin = user.role === "admin";
  const todayText = toInputDate(new Date());
 
  const [schedules, setSchedules] = useState([]);
  const [runs, setRuns] = useState([]);
  const [asOf, setAsOf] = useState(todayText);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(""); // "", "preview" or "run"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
 
  async function load() {
    try {
      const [s, r] = await Promise.all([
        request("/api/maintenance/schedules"),
        request("/api/maintenance/runs"),
      ]);
      setSchedules(s);
      setRuns(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    load();
  }, []);
 
  async function runScheduler(dryRun) {
    setError("");
    setMessage("");
 
    if (!dryRun) {
      const ok = window.confirm(
        `This creates real preventive-maintenance tickets for visits due on or before ${formatDate(asOf)}. Continue?`
      );
      if (!ok) return;
    }
 
    setRunning(dryRun ? "preview" : "run");
    try {
      const summary = await request("/api/maintenance/run", {
        method: "POST",
        body: { as_of: asOf, dry_run: dryRun },
      });
      setResult(summary);
      if (!dryRun) {
        setMessage(`${summary.tickets_created} preventive ticket(s) created.`);
        await load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning("");
    }
  }
 
  async function togglePause(schedule) {
    setError("");
    setMessage("");
    const pause = schedule.schedule_status !== "paused";
    try {
      await request(`/api/maintenance/schedules/${schedule.contract_id}`, {
        method: "PUT",
        body: { paused: pause },
      });
      setMessage(pause ? "Schedule paused." : "Schedule resumed.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }
 
  if (loading) return <p className="text-slate-600">Loading...</p>;
 
  const simulated = result && result.as_of !== todayText;
 
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Preventive maintenance</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Each contract has a visit schedule (for example every 3 months). Every day at 6:00 AM the system
        checks which visits are due and creates one ticket for every covered asset. It gives each ticket to
        the technician with the lightest workload.
      </p>
 
      {message && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
 
      {/* Run panel (admin only) */}
      {isAdmin && (
        <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Run the scheduler</h2>
          <p className="mt-1 text-sm text-slate-600">
            Normally this runs by itself. For a demo you can run it now, and you can choose a date to pretend
            that time has passed (a simulation).
          </p>
 
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="Run as if today is">
              <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className={inputClass} />
            </Field>
            <button onClick={() => runScheduler(true)} disabled={!asOf || running !== ""} className={secondaryButtonClass}>
              {running === "preview" ? "Checking..." : "Preview (changes nothing)"}
            </button>
            <button onClick={() => runScheduler(false)} disabled={!asOf || running !== ""} className={buttonClass}>
              {running === "run" ? "Running..." : "Run now"}
            </button>
          </div>
 
          {result && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900">
                {result.dry_run ? "Preview" : "Run completed"} for {formatDate(result.as_of)}
                {simulated && (
                  <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Simulated date
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {result.contracts_checked} contracts checked, {result.contracts_due} with a visit due,{" "}
                {result.dry_run ? `${result.items.length} tickets would be created` : `${result.tickets_created} tickets created`}
                {result.skipped_existing > 0 ? `, ${result.skipped_existing} skipped because they already existed` : ""}.
              </p>
              {result.errors.length > 0 && (
                <p className="mt-2 text-sm text-red-600">{result.errors.join(" ")}</p>
              )}
 
              {result.items.length > 0 && (
                <div className={`${tableWrap} mt-3`}>
                  <table className="w-full text-left text-sm">
                    <thead className={head}>
                      <tr>
                        <th className={th}>Ticket</th>
                        <th className={th}>Client</th>
                        <th className={th}>Asset</th>
                        <th className={th}>Visit date</th>
                        <th className={th}>Technician</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100 last:border-0">
                          <td className={td}>{item.ticket_number || "-"}</td>
                          <td className={td}>{item.client_name}</td>
                          <td className={td}>{item.asset_label}</td>
                          <td className={td}>{formatDate(item.scheduled_for)}</td>
                          <td className={td}>{item.technician_name || (result.dry_run ? "Chosen when run" : "Not assigned")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
 
      {/* Schedules */}
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Visit schedules</h2>
      <div className={`${tableWrap} mt-3`}>
        <table className="w-full text-left text-sm">
          <thead className={head}>
            <tr>
              <th className={th}>Client</th>
              <th className={th}>Contract</th>
              <th className={th}>Visit every</th>
              <th className={th}>Assets</th>
              <th className={th}>Last visit cycle</th>
              <th className={th}>Next visit due</th>
              <th className={th}>Schedule</th>
              {isAdmin && <th className={th}></th>}
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.contract_id} className="border-b border-slate-100 last:border-0">
                <td className={`${td} font-medium`}>{s.client_name}</td>
                <td className={td}>{s.plan_name}</td>
                <td className={td}>{s.frequency_months} months</td>
                <td className={td}>{s.asset_count}</td>
                <td className={td}>{s.last_cycle_date ? formatDate(s.last_cycle_date) : "-"}</td>
                <td className={td}>
                  {s.next_due_date ? (
                    <>
                      {formatDate(s.next_due_date)}
                      <span className="block text-xs text-slate-500">
                        {s.days_until_next === 0 ? "today" : `in ${s.days_until_next} days`}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500">No more visits</span>
                  )}
                </td>
                <td className={td}><StatusBadge status={s.schedule_status} /></td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => togglePause(s)} className="text-[#0b4a34] hover:underline">
                      {s.schedule_status === "paused" ? "Resume" : "Pause"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-6 text-center text-slate-500">
                  No active contracts to schedule.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
 
      {/* Run history */}
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Recent runs</h2>
      <div className={`${tableWrap} mt-3`}>
        <table className="w-full text-left text-sm">
          <thead className={head}>
            <tr>
              <th className={th}>Run at</th>
              <th className={th}>Date used</th>
              <th className={th}>Started by</th>
              <th className={th}>Contracts due</th>
              <th className={th}>Tickets created</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className={td}>{formatDateTime(r.run_at)}</td>
                <td className={td}>{formatDate(r.as_of)}</td>
                <td className={td}>{r.triggered_by}</td>
                <td className={td}>{r.contracts_due}</td>
                <td className={td}>{r.tickets_created}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">The scheduler has not run yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
 
