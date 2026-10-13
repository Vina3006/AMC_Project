import { useEffect, useMemo, useState } from "react";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { inputClass } from "../components/ui";
 
const roles = ["admin", "staff", "technician", "customer"];
 
export default function Users() {
  const me = getUser();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
 
  useEffect(() => {
    request("/api/users")
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
 
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!roleFilter || u.role === roleFilter) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, search, roleFilter]);
 
  async function changeRole(user, role) {
    setError("");
    setMessage("");
    try {
      await request(`/api/users/${user.id}/role`, { method: "PUT", body: { role } });
      // update the list on screen; a non-customer loses any client link
      setUsers(
        users.map((u) =>
          u.id === user.id
            ? { ...u, role, client_id: role === "customer" ? u.client_id : null, client_name: role === "customer" ? u.client_name : null }
            : u
        )
      );
      setMessage(`${user.name} is now ${role}.`);
    } catch (err) {
      setError(err.message);
    }
  }
 
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <p className="mt-1 text-sm text-slate-600">
        New people register themselves on the login page. Here you give them their role. To link a
        customer to a client, open the Clients page.
      </p>
 
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className={`${inputClass} !mt-0 w-full sm:w-72`}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={`${inputClass} !mt-0 w-auto`}
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
 
      {message && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}
 
      {!loading && (
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Linked client</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      disabled={u.id === me.id}
                      title={u.id === me.id ? "You cannot change your own role" : ""}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-60"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{u.client_name || "-"}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
 
