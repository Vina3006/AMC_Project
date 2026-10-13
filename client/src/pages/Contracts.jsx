import { Fragment, useEffect, useState } from "react";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { formatDate, formatMoney, toInputDate } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import { Field, inputClass, buttonClass, secondaryButtonClass } from "../components/ui";
 
const emptyForm = {
  client_id: "", plan_name: "", start_date: "", end_date: "",
  amount: "", visit_frequency_months: 3, status: "active",
};
 
export default function Contracts() {
  const user = getUser();
  const isStaff = user.role === "admin" || user.role === "staff";
 
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientAssets, setClientAssets] = useState([]); // assets of the chosen client
  const [selectedAssets, setSelectedAssets] = useState([]); // ticked asset ids
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = adding
  const [details, setDetails] = useState({}); // contract id -> contract with its assets
  const [openId, setOpenId] = useState(null); // which row is expanded
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
 
  async function load() {
    try {
      setContracts(await request("/api/contracts"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    load();
    if (isStaff) request("/api/clients").then(setClients).catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  // When a client is chosen, load that client's assets so they can be ticked.
  async function chooseClient(e) {
    const clientId = e.target.value;
    setForm({ ...form, client_id: clientId });
    setSelectedAssets([]);
    setClientAssets([]);
    if (!clientId) return;
    try {
      setClientAssets(await request(`/api/assets?client_id=${clientId}`));
    } catch (err) {
      setError(err.message);
    }
  }
 
  function toggleAsset(id) {
    setSelectedAssets(
      selectedAssets.includes(id) ? selectedAssets.filter((a) => a !== id) : [...selectedAssets, id]
    );
  }
 
  function openNew() {
    setForm(emptyForm);
    setSelectedAssets([]);
    setClientAssets([]);
    setEditingId("new");
    setError("");
    setMessage("");
  }
 
  function openEdit(c) {
    setForm({
      client_id: c.client_id,
      plan_name: c.plan_name,
      start_date: toInputDate(c.start_date),
      end_date: toInputDate(c.end_date),
      amount: c.amount,
      visit_frequency_months: c.visit_frequency_months,
      status: c.status,
    });
    setEditingId(c.id);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
 
  async function toggleDetails(id) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!details[id]) {
      try {
        const data = await request(`/api/contracts/${id}`);
        setDetails({ ...details, [id]: data });
      } catch (err) {
        setError(err.message);
      }
    }
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const isNew = editingId === "new";
 
    if (isNew && !form.client_id) return setError("Please choose a client.");
    if (!form.plan_name.trim()) return setError("Please enter the plan name.");
    if (isNew && !form.start_date) return setError("Please choose the start date.");
    if (!form.end_date) return setError("Please choose the end date.");
    if (isNew && form.end_date <= form.start_date) return setError("The end date must be after the start date.");
    if (!(Number(form.amount) > 0)) return setError("The amount must be more than 0.");
    if (isNew && selectedAssets.length === 0) return setError("Please tick at least one asset covered by this contract.");
 
    setSaving(true);
    try {
      if (isNew) {
        await request("/api/contracts", {
          method: "POST",
          body: {
            client_id: Number(form.client_id),
            plan_name: form.plan_name.trim(),
            start_date: form.start_date,
            end_date: form.end_date,
            amount: Number(form.amount),
            visit_frequency_months: Number(form.visit_frequency_months),
            asset_ids: selectedAssets,
          },
        });
        setMessage("Contract created.");
      } else {
        await request(`/api/contracts/${editingId}`, {
          method: "PUT",
          body: {
            plan_name: form.plan_name.trim(),
            end_date: form.end_date,
            amount: Number(form.amount),
            visit_frequency_months: Number(form.visit_frequency_months),
            status: form.status,
          },
        });
        setMessage("Contract updated.");
        setDetails({});
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
 
  const isNew = editingId === "new";
 
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{isStaff ? "AMC contracts" : "My contracts"}</h1>
        {isStaff && editingId === null && (
          <button onClick={openNew} className={buttonClass}>New contract</button>
        )}
      </div>
 
      {message && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
 
      {/* Create / edit form (staff only) */}
      {isStaff && editingId !== null && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-md border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">{isNew ? "Create a contract" : "Edit contract"}</h2>
 
          <div className="grid gap-4 sm:grid-cols-2">
            {isNew && (
              <Field label="Client">
                <select value={form.client_id} onChange={chooseClient} className={inputClass}>
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Plan name">
              <input name="plan_name" value={form.plan_name} onChange={handleChange} placeholder="For example: Annual Maintenance" className={inputClass} />
            </Field>
            {isNew && (
              <Field label="Start date">
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className={inputClass} />
              </Field>
            )}
            <Field label="End date">
              <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Amount (₹)">
              <input type="number" min="1" name="amount" value={form.amount} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Preventive visit every" hint="Used later by the maintenance scheduler">
              <select name="visit_frequency_months" value={form.visit_frequency_months} onChange={handleChange} className={inputClass}>
                <option value={1}>1 month</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </Field>
            {!isNew && (
              <Field label="Status">
                <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
            )}
          </div>
 
          {isNew && (
            <div>
              <p className="text-sm font-medium text-slate-800">Assets covered</p>
              {!form.client_id ? (
                <p className="mt-1 text-sm text-slate-500">Choose a client to see their assets.</p>
              ) : clientAssets.length === 0 ? (
                <p className="mt-1 text-sm text-amber-700">This client has no assets yet. Add assets first.</p>
              ) : (
                <div className="mt-2 space-y-2 rounded-md border border-slate-200 p-3">
                  {clientAssets.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(a.id)}
                        onChange={() => toggleAsset(a.id)}
                      />
                      {a.asset_type} {a.brand} {a.model} ({a.serial_number})
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
 
          {!isNew && (
            <p className="text-xs text-slate-500">
              The client, start date and covered assets cannot be changed after a contract is created.
            </p>
          )}
 
          {error && <p className="text-sm text-red-600">{error}</p>}
 
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={buttonClass}>
              {saving ? "Saving..." : "Save contract"}
            </button>
            <button type="button" onClick={() => setEditingId(null)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      )}
 
      {editingId === null && error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}
 
      {!loading && (
        <div className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                {isStaff && <th className="px-4 py-3 font-semibold">Client</th>}
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Assets</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <Fragment key={c.id}>
                  <tr className="border-b border-slate-100">
                    {isStaff && <td className="px-4 py-3">{c.client_name}</td>}
                    <td className="px-4 py-3 font-medium">
                      {c.plan_name}
                      <span className="block text-xs font-normal text-slate-500">
                        Visit every {c.visit_frequency_months} months
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(c.start_date)} to {formatDate(c.end_date)}</td>
                    <td className="px-4 py-3">{formatMoney(c.amount)}</td>
                    <td className="px-4 py-3">{c.asset_count}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.effective_status} /></td>
                    <td className="space-x-3 px-4 py-3 text-right">
                      <button onClick={() => toggleDetails(c.id)} className="text-[#0b4a34] hover:underline">
                        {openId === c.id ? "Hide" : "Assets"}
                      </button>
                      {isStaff && (
                        <button onClick={() => openEdit(c)} className="text-[#0b4a34] hover:underline">Edit</button>
                      )}
                    </td>
                  </tr>
 
                  {openId === c.id && (
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td colSpan={isStaff ? 7 : 6} className="px-4 py-3">
                        {!details[c.id] ? (
                          <p className="text-sm text-slate-500">Loading...</p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {details[c.id].assets.map((a) => (
                              <li key={a.id}>
                                {a.asset_type} {a.brand} {a.model} ({a.serial_number}) at {a.location || "no location"}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={isStaff ? 7 : 6} className="px-4 py-6 text-center text-slate-500">No contracts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
 
