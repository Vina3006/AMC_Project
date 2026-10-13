import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
 
export default function NewTicket() {
  const navigate = useNavigate();
  const user = getUser();
  const isStaff = user.role === "admin" || user.role === "staff";
 
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ asset_id: "", title: "", description: "", priority: "medium" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
 
  // The server sends a customer only their own assets.
  useEffect(() => {
    request("/api/assets")
      .then(setAssets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
 
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
 
    if (!form.asset_id) {
      setError("Please choose the computer that has the problem.");
      return;
    }
    if (form.title.trim().length < 3) {
      setError("Please describe the problem in a few words.");
      return;
    }
 
    setSaving(true);
    try {
      const data = await request("/api/tickets", {
        method: "POST",
        body: {
          asset_id: Number(form.asset_id),
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
        },
      });
      navigate(`/tickets/${data.id}`);
    } catch (err) {
      // For example: "This asset is not covered by an active AMC contract"
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
 
  const inputClass =
    "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0b4a34] focus:outline-none";
 
  return (
    <div className="max-w-xl">
      <Link to="/tickets" className="text-sm text-[#0b4a34] hover:underline">
        Back to tickets
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Raise a ticket</h1>
      <p className="mt-1 text-sm text-slate-600">
        Tell us which computer has a problem. Only computers covered by an active AMC contract can
        be raised.
      </p>
 
      {loading ? (
        <p className="mt-6 text-slate-600">Loading...</p>
      ) : assets.length === 0 ? (
        <p className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          No assets found. Please ask the administrator to add your computers first.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-md border border-slate-200 bg-white p-6">
          <div>
            <label className="text-sm font-medium">Computer / asset</label>
            <select name="asset_id" value={form.asset_id} onChange={handleChange} className={inputClass}>
              <option value="">Select an asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {isStaff && a.client_name ? `${a.client_name} - ` : ""}
                  {a.asset_type} {a.brand} {a.model} ({a.serial_number})
                </option>
              ))}
            </select>
          </div>
 
          <div>
            <label className="text-sm font-medium">Problem (short)</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={200}
              placeholder="For example: Computer not starting"
              className={inputClass}
            />
          </div>
 
          <div>
            <label className="text-sm font-medium">Details (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className={inputClass}
            />
          </div>
 
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
              <option value="high">High - fix within 4 hours</option>
              <option value="medium">Medium - fix within 24 hours</option>
              <option value="low">Low - fix within 72 hours</option>
            </select>
          </div>
 
          {error && <p className="text-sm text-red-600">{error}</p>}
 
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#0b4a34] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#083a29] disabled:opacity-60"
          >
            {saving ? "Submitting..." : "Submit ticket"}
          </button>
        </form>
      )}
    </div>
  );
}
 