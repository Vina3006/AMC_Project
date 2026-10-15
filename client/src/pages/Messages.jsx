import { Fragment, useEffect, useState } from "react";
import { request } from "../utils/request";
import { formatDateTime } from "../utils/format";
import { inputClass } from "../components/ui";
 
const tabs = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "", label: "All" },
];
 
const badgeStyle = {
  new: "bg-blue-100 text-blue-800",
  read: "bg-slate-200 text-slate-700",
  replied: "bg-green-100 text-green-800",
};
 
const th = "px-4 py-3 font-semibold";
const td = "px-4 py-3";
 
export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("new");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  async function load() {
    try {
      setMessages(await request(`/api/contact${status ? `?status=${status}` : ""}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    setLoading(true);
    setError("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
 
  async function setMessageStatus(id, newStatus) {
    setError("");
    try {
      await request(`/api/contact/${id}/status`, { method: "PUT", body: { status: newStatus } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }
 
  // Opening a new message marks it as read.
  function toggleOpen(m) {
    if (openId === m.id) {
      setOpenId(null);
      return;
    }
    setOpenId(m.id);
    if (m.status === "new") setMessageStatus(m.id, "read");
  }
 
  const q = search.trim().toLowerCase();
  const visible = q
    ? messages.filter((m) =>
        [m.name, m.email, m.subject, m.message].some((v) => String(v || "").toLowerCase().includes(q))
      )
    : messages;
 
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
      <p className="mt-1 text-sm text-slate-600">Messages sent from the Contact page of the website.</p>
 
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.label}
              onClick={() => setStatus(t.value)}
              className={`rounded px-3 py-1.5 text-sm ${
                status === t.value ? "bg-[#0b4a34] text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages..."
          className={`${inputClass} !mt-0 w-full sm:w-64`}
        />
      </div>
 
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-6 text-slate-600">Loading...</p>}
 
      {!loading && (
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th className={th}>Received</th>
                <th className={th}>From</th>
                <th className={th}>Subject</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <Fragment key={m.id}>
                  <tr onClick={() => toggleOpen(m)} className="cursor-pointer border-b border-slate-100">
                    <td className={td}>{formatDateTime(m.created_at)}</td>
                    <td className={`${td} ${m.status === "new" ? "font-semibold" : ""}`}>
                      {m.name}
                      <span className="block text-xs font-normal text-slate-500">{m.email}</span>
                    </td>
                    <td className={td}>{m.subject}</td>
                    <td className={td}>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeStyle[m.status]}`}>{m.status}</span>
                    </td>
                  </tr>
 
                  {openId === m.id && (
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td colSpan={4} className="px-4 py-4">
                        <p className="whitespace-pre-line text-sm text-slate-800">{m.message}</p>
                        <p className="mt-3 text-xs text-slate-500">
                          {m.email}
                          {m.phone ? ` | ${m.phone}` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`}
                            className="rounded-md bg-[#0b4a34] px-4 py-2 text-sm font-medium text-white hover:bg-[#083a29]"
                          >
                            Reply by email
                          </a>
                          {m.status !== "replied" && (
                            <button
                              onClick={() => setMessageStatus(m.id, "replied")}
                              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                            >
                              Mark as replied
                            </button>
                          )}
                          {m.status !== "new" && (
                            <button
                              onClick={() => setMessageStatus(m.id, "new")}
                              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                            >
                              Mark as new
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No messages here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
 