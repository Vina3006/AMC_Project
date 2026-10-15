import { useEffect, useState } from "react";
import { request } from "../utils/request";
import { formatMoney } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import { Field, inputClass, buttonClass, secondaryButtonClass } from "../components/ui";
 
const emptyForm = {
  name: "", summary: "", description: "", price: "",
  whats_included: "", not_included: "",
  duration_months: "", visit_frequency_months: "",
  response_time: "", suitable_for: "",
};
 
const th = "px-4 py-3 font-semibold";
const td = "px-4 py-3";
 
export default function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = adding
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
 
  async function load() {
    try {
      setServices(await request("/api/services/manage/all"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    load();
  }, []);
 
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  function openNew() {
    setForm(emptyForm);
    setEditingId("new");
    setError("");
    setMessage("");
  }
 
  function openEdit(s) {
    setForm({
      name: s.name,
      summary: s.summary || "",
      description: s.description || "",
      price: s.price,
      whats_included: s.whats_included.join("\n"),
      not_included: s.not_included.join("\n"),
      duration_months: s.duration_months || "",
      visit_frequency_months: s.visit_frequency_months || "",
      response_time: s.response_time || "",
      suitable_for: s.suitable_for || "",
    });
    setEditingId(s.id);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
 
    if (form.name.trim().length < 3) return setError("Please enter the service name.");
    if (!form.summary.trim()) return setError("Please add a short summary.");
    if (!(Number(form.price) > 0)) return setError("The price must be more than 0.");
    if (!form.whats_included.trim()) return setError("Add at least one item under 'What is included'.");
 
    setSaving(true);
    try {
      const body = {
        ...form,
        price: Number(form.price),
        duration_months: form.duration_months === "" ? null : Number(form.duration_months),
        visit_frequency_months: form.visit_frequency_months === "" ? null : Number(form.visit_frequency_months),
      };
      if (editingId === "new") {
        await request("/api/services", { method: "POST", body });
        setMessage("Service added.");
      } else {
        await request(`/api/services/${editingId}`, { method: "PUT", body });
        setMessage("Service updated.");
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
 
  async function toggleActive(service) {
    setError("");
    setMessage("");
    try {
      const data = await request(`/api/services/${service.id}/active`, {
        method: "PUT",
        body: { active: !service.is_active },
      });
      setMessage(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }
 
  if (loading) return <p className="text-slate-600">Loading...</p>;
 
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Services</h1>
        {editingId === null && (
          <button onClick={openNew} className={buttonClass}>Add service</button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">
        These are the plans customers see on the Home page. A hidden service disappears from the website,
        but old invoices that used it stay correct.
      </p>
 
      {message && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
 
      {editingId !== null && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-md border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">{editingId === "new" ? "Add a service" : "Edit service"}</h2>
 
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service name">
              <input name="name" value={form.name} onChange={handleChange} maxLength={100} className={inputClass} />
            </Field>
            <Field label="Price (₹)">
              <input type="number" min="1" name="price" value={form.price} onChange={handleChange} className={inputClass} />
            </Field>
          </div>
 
          <Field label="Short summary" hint="One line shown on the Home page card">
            <input name="summary" value={form.summary} onChange={handleChange} maxLength={255} className={inputClass} />
          </Field>
 
          <Field label="Full description (optional)">
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} maxLength={2000} className={inputClass} />
          </Field>
 
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What is included" hint="One item per line. The first three show on the Home page card.">
              <textarea name="whats_included" value={form.whats_included} onChange={handleChange} rows={6} className={inputClass} />
            </Field>
            <Field label="What is not included (optional)" hint="One item per line">
              <textarea name="not_included" value={form.not_included} onChange={handleChange} rows={6} className={inputClass} />
            </Field>
          </div>
 
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Duration (months)">
              <input type="number" min="1" max="60" name="duration_months" value={form.duration_months} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Preventive visit every">
              <select name="visit_frequency_months" value={form.visit_frequency_months} onChange={handleChange} className={inputClass}>
                <option value="">No scheduled visits</option>
                <option value={1}>1 month</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </Field>
            <Field label="Response time">
              <input name="response_time" value={form.response_time} onChange={handleChange} maxLength={100} placeholder="Within 24 hours" className={inputClass} />
            </Field>
            <Field label="Suitable for">
              <input name="suitable_for" value={form.suitable_for} onChange={handleChange} maxLength={150} placeholder="Offices with 1 to 10 PCs" className={inputClass} />
            </Field>
          </div>
 
          {error && <p className="text-sm text-red-600">{error}</p>}
 
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={buttonClass}>
              {saving ? "Saving..." : "Save service"}
            </button>
            <button type="button" onClick={() => setEditingId(null)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      )}
 
      {editingId === null && error && <p className="mt-4 text-sm text-red-600">{error}</p>}
 
      <div className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
            <tr>
              <th className={th}>Service</th>
              <th className={th}>Price</th>
              <th className={th}>Included items</th>
              <th className={th}>Visits</th>
              <th className={th}>Shown on website</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className={`${td} font-medium`}>
                  {s.name}
                  <span className="block text-xs font-normal text-slate-500">{s.summary || "No summary yet"}</span>
                </td>
                <td className={td}>{formatMoney(s.price)}</td>
                <td className={td}>{s.whats_included.length}</td>
                <td className={td}>{s.visit_frequency_months ? `Every ${s.visit_frequency_months} months` : "-"}</td>
                <td className={td}><StatusBadge status={s.is_active ? "active" : "retired"} /></td>
                <td className="space-x-3 px-4 py-3 text-right">
                  <button onClick={() => openEdit(s)} className="text-[#0b4a34] hover:underline">Edit</button>
                  <button onClick={() => toggleActive(s)} className="text-[#0b4a34] hover:underline">
                    {s.is_active ? "Hide" : "Show"}
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No services yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
 