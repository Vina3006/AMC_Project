import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
 
export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    const token = localStorage.getItem("token");
 
    fetch("http://localhost:5000/api/payments/my-invoices", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        // Token expired or invalid: log the user out and ask to log in again.
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { state: { from: "/invoices" } });
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setInvoices(Array.isArray(data) ? data : data.invoices || []);
      })
      .catch(() => setError("Could not load your invoices."))
      .finally(() => setLoading(false));
  }, [navigate]);
 
  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN");
  }
 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header />
 
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900">My invoices</h1>
        <p className="mt-1 text-sm text-slate-600">
          Payments you have made for AMC services.
        </p>
 
        {loading && <p className="mt-6 text-slate-600">Loading...</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
 
        {!loading && !error && invoices.length === 0 && (
          <p className="mt-6 rounded-md border border-slate-200 bg-white p-6 text-slate-600">
            You have no invoices yet.
          </p>
        )}
 
        {invoices.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice no.</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Transaction ref</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">INV-{inv.id}</td>
                    <td className="px-4 py-3">{inv.service}</td>
                    <td className="px-4 py-3">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3">₹{inv.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded px-2 py-0.5 text-xs font-medium " +
                          (String(inv.status).toLowerCase() === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800")
                        }
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inv.transaction_ref || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
 