import { useEffect, useMemo, useState } from "react";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { Field, inputClass, buttonClass, secondaryButtonClass } from "../components/ui";
 
const emptyForm = { name: "", contact_person: "", phone: "", email: "", address: "", user_id: "" };
 
export default function Clients() {
  const user = getUser();
  const isAdmin = user.role === "admin"; // only admins can see the user list
 
  const [clients, setClients] = useState([]);
  const [customerUsers, setCustomerUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = form closed, "new" = adding
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
 
  async function load() {
    try {
      setClients(await request("/api/clients"));
      if (isAdmin) setCustomerUsers(await request("/api/users?role=customer"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.contact_person, c.phone, c.email].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [clients, search]);
 
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  function openNew() {
    setForm(emptyForm);
    setEditingId("new");
    setError("");
    setMessage("");
  }
 
  function openEdit(c) {
    setForm({
      name: c.name,
      contact_person: c.contact_person || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      user_id: c.user_id || "",
    });
    setEditingId(c.id);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
 
    if (form.name.trim().length < 2) {
      setError("Please enter the client name.");
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
 
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        contact_person: form.contact_person.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        user_id: form.user_id ? Number(form.user_id) : null,
      };
      if (editingId === "new") {
        await request("/api/clients", { method: "POST", body });
        setMessage("Client added.");
      } else {
        await request(`/api/clients/${editingId}`, { method: "PUT", body });
        setMessage("Client updated.");
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
 
  // Logins that can be chosen: customers with no client yet, plus the one already linked here.
  const loginOptions = customerUsers.filter((u) => !u.client_id || u.client_id === editingId);
 
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        {editingId === null && (
          <button onClick={openNew} className={buttonClass}>Add client</button>
        )}
      </div>
 
      {message && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
 
      {/* Add / edit form */}
      {editingId !== null && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-md border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">
            {editingId === "new" ? "Add a client" : "Edit client"}
          </h2>
 
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client / company name">
              <input name="name" value={form.name} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Contact person">
              <input name="contact_person" value={form.contact_person} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Phone" hint="10 digits">
              <input name="phone" value={form.phone} onChange={handleChange} maxLength={10} className={inputClass} />
            </Field>
            <Field label="Email">
              <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
            </Field>
          </div>
 
          <Field label="Address">
            <textarea name="address" value={form.address} onChange={handleChange} rows={2} className={inputClass} />
          </Field>
 
          {isAdmin && (
            <Field
              label="Customer login for this client"
              hint="Optional. The customer must register first, then you can link their account here."
            >
              <select name="user_id" value={form.user_id} onChange={handleChange} className={inputClass}>
                <option value="">No login yet</option>
                {loginOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </Field>
          )}
 
          {error && <p className="text-sm text-red-600">{error}</p>}
 
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={buttonClass}>
              {saving ? "Saving..." : "Save client"}
            </button>
            <button type="button" onClick={() => setEditingId(null)} className={secondaryButtonClass}>
              Cancel
            </button>
          </div>
        </form>
      )}
 
      {editingId === null && error && <p className="mt-4 text-sm text-red-600">{error}</p>}
 
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clients..."
        className={`${inputClass} w-full sm:w-72`}
      />
 
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}
 
      {!loading && (
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Assets</th>
                <th className="px-4 py-3 font-semibold">Login</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {c.name}
                    <span className="block text-xs font-normal text-slate-500">{c.email}</span>
                  </td>
                  <td className="px-4 py-3">{c.contact_person || "-"}</td>
                  <td className="px-4 py-3">{c.phone || "-"}</td>
                  <td className="px-4 py-3">{c.asset_count}</td>
                  <td className="px-4 py-3">{c.user_id ? "Linked" : "Not linked"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="text-[#0b4a34] hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
 
