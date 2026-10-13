import { useEffect, useMemo, useState } from "react";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { formatDate, toInputDate } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import { Field, inputClass, buttonClass, secondaryButtonClass } from "../components/ui";
 
const emptyForm = {
  client_id: "", asset_type: "", brand: "", model: "",
  serial_number: "", location: "", purchase_date: "", status: "active",
};
 
export default function Assets() {
  const user = getUser();
  const isStaff = user.role === "admin" || user.role === "staff";
 
  const [assets, setAssets] = useState([]);
  const [clients, setClients] = useState([]);
  const [filterClient, setFilterClient] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = adding
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
 
  // Staff also need the client list for the dropdowns.
  useEffect(() => {
    if (isStaff) request("/api/clients").then(setClients).catch((err) => setError(err.message));
  }, [isStaff]);
 
  async function load() {
    try {
      const query = isStaff && filterClient ? `?client_id=${filterClient}` : "";
      setAssets(await request(`/api/assets${query}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClient]);
 
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) =>
      [a.asset_type, a.brand, a.model, a.serial_number, a.location, a.client_name]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [assets, search]);
 
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  function openNew() {
    setForm({ ...emptyForm, client_id: filterClient });
    setEditingId("new");
    setError("");
    setMessage("");
  }
 
  function openEdit(a) {
    setForm({
      client_id: a.client_id,
      asset_type: a.asset_type || "",
      brand: a.brand || "",
      model: a.model || "",
      serial_number: a.serial_number || "",
      location: a.location || "",
      purchase_date: toInputDate(a.purchase_date),
      status: a.status || "active",
    });
    setEditingId(a.id);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
 
    if (!form.client_id) {
      setError("Please choose the client who owns this asset.");
      return;
    }
    if (!form.asset_type.trim()) {
      setError("Please enter the asset type, for example Desktop or Laptop.");
      return;
    }
    if (!form.serial_number.trim()) {
      setError("Please enter the serial number. It is used to track the asset's history.");
      return;
    }
 
    setSaving(true);
    try {
      const body = {
        client_id: Number(form.client_id),
        asset_type: form.asset_type.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        serial_number: form.serial_number.trim(),
        location: form.location.trim(),
        purchase_date: form.purchase_date || null,
        status: form.status,
      };
      if (editingId === "new") {
        await request("/api/assets", { method: "POST", body });
        setMessage("Asset added.");
      } else {
        await request(`/api/assets/${editingId}`, { method: "PUT", body });
        setMessage("Asset updated.");
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message); // for example: duplicate serial number
    } finally {
      setSaving(false);
    }
  }
 
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{isStaff ? "Assets" : "My assets"}</h1>
        {isStaff && editingId === null && (
          <button onClick={openNew} className={buttonClass}>Add asset</button>
        )}
      </div>
 
      {message && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
 
      {/* Add / edit form (staff only) */}
      {isStaff && editingId !== null && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-md border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">{editingId === "new" ? "Add an asset" : "Edit asset"}</h2>
 
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client (owner)">
              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                disabled={editingId !== "new"}
                className={inputClass}
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Asset type">
              <input name="asset_type" value={form.asset_type} onChange={handleChange} list="asset-types" className={inputClass} />
              <datalist id="asset-types">
                <option value="Desktop" />
                <option value="Laptop" />
                <option value="Printer" />
                <option value="Server" />
                <option value="Network device" />
              </datalist>
            </Field>
            <Field label="Brand">
              <input name="brand" value={form.brand} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Model">
              <input name="model" value={form.model} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Serial number" hint="Must be unique">
              <input name="serial_number" value={form.serial_number} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Location">
              <input name="location" value={form.location} onChange={handleChange} placeholder="For example: Front office" className={inputClass} />
            </Field>
            <Field label="Purchase date">
              <input type="date" name="purchase_date" value={form.purchase_date} onChange={handleChange} className={inputClass} />
            </Field>
            {editingId !== "new" && (
              <Field label="Status">
                <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="under_repair">Under repair</option>
                  <option value="retired">Retired</option>
                </select>
              </Field>
            )}
          </div>
 
          {error && <p className="text-sm text-red-600">{error}</p>}
 
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={buttonClass}>
              {saving ? "Saving..." : "Save asset"}
            </button>
            <button type="button" onClick={() => setEditingId(null)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      )}
 
      {editingId === null && error && <p className="mt-4 text-sm text-red-600">{error}</p>}
 
      {/* Search and filter */}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets..."
          className={`${inputClass} !mt-0 w-full sm:w-72`}
        />
        {isStaff && (
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className={`${inputClass} !mt-0 w-auto`}
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>
 
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}
 
      {!loading && (
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                {isStaff && <th className="px-4 py-3 font-semibold">Client</th>}
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Brand / model</th>
                <th className="px-4 py-3 font-semibold">Serial number</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Purchased</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {isStaff && <th className="px-4 py-3 font-semibold"></th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  {isStaff && <td className="px-4 py-3">{a.client_name}</td>}
                  <td className="px-4 py-3 font-medium">{a.asset_type}</td>
                  <td className="px-4 py-3">{[a.brand, a.model].filter(Boolean).join(" ") || "-"}</td>
                  <td className="px-4 py-3">{a.serial_number || "-"}</td>
                  <td className="px-4 py-3">{a.location || "-"}</td>
                  <td className="px-4 py-3">{formatDate(a.purchase_date)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  {isStaff && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(a)} className="text-[#0b4a34] hover:underline">Edit</button>
                    </td>
                  )}
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={isStaff ? 8 : 6} className="px-4 py-6 text-center text-slate-500">No assets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
 
