import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { formatDate, formatDateTime, formatMoney } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import { buttonClass, secondaryButtonClass } from "../components/ui";
 
export default function InvoiceDetail() {
  const { id } = useParams();
  const user = getUser();
 
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
 
  async function load() {
    try {
      setInvoice(await request(`/api/invoices/${id}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
 
  async function payNow() {
    const ok = window.confirm(`Pay ${formatMoney(invoice.amount)} now? (This is a simulated payment.)`);
    if (!ok) return;
 
    setPaying(true);
    setError("");
    try {
      const data = await request(`/api/invoices/${id}/pay`, { method: "POST" });
      setMessage(`${data.message}. Transaction reference: ${data.transaction_ref}`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }
 
  if (loading) return <p className="text-slate-600">Loading...</p>;
  if (!invoice) {
    return (
      <div>
        <p className="text-red-600">{error || "Invoice not found."}</p>
        <Link to="/invoices" className="mt-3 inline-block text-sm text-[#0b4a34] hover:underline">Back to invoices</Link>
      </div>
    );
  }
 
  const isPaid = invoice.status === "paid";
 
  return (
    <div className="max-w-2xl">
      <Link to="/invoices" className="text-sm text-[#0b4a34] hover:underline print:hidden">
        Back to invoices
      </Link>
 
      {message && <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800 print:hidden">{message}</p>}
      {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 print:hidden">{error}</p>}
 
      {/* The printable invoice / receipt */}
      <div className="mt-4 rounded-md border border-slate-200 bg-white p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xl font-bold text-[#0b4a34]">Divine Grace</p>
            <p className="text-xs text-slate-500">AMC System</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">
              {isPaid ? "Payment receipt" : "Invoice"} {invoice.invoice_number}
            </p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <StatusBadge status={invoice.status} />
              {invoice.is_overdue && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
              )}
            </div>
          </div>
        </div>
 
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Billed to</dt>
            <dd className="mt-0.5 font-medium">{invoice.client_name || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Invoice date</dt>
            <dd className="mt-0.5">{formatDate(invoice.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Due date</dt>
            <dd className="mt-0.5">{invoice.due_date ? formatDate(invoice.due_date) : "-"}</dd>
          </div>
          {invoice.ticket_number && (
            <div>
              <dt className="text-xs text-slate-500">Ticket</dt>
              <dd className="mt-0.5">
                {user.role === "customer" || user.role === "admin" || user.role === "staff" ? (
                  <Link to={`/tickets/${invoice.ticket_id}`} className="text-[#0b4a34] hover:underline print:no-underline">
                    {invoice.ticket_number}
                  </Link>
                ) : (
                  invoice.ticket_number
                )}
              </dd>
            </div>
          )}
          {invoice.plan_name && (
            <div>
              <dt className="text-xs text-slate-500">Contract</dt>
              <dd className="mt-0.5">{invoice.plan_name}</dd>
            </div>
          )}
        </dl>
 
        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3">{invoice.description}</td>
              <td className="py-3 text-right">{formatMoney(invoice.amount)}</td>
            </tr>
            <tr>
              <td className="py-3 text-right font-semibold">Total</td>
              <td className="py-3 text-right text-lg font-bold">{formatMoney(invoice.amount)}</td>
            </tr>
          </tbody>
        </table>
 
        {isPaid && (
          <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold">Payment received</p>
            <p className="mt-1">
              Paid on {formatDateTime(invoice.paid_at || invoice.created_at)}
              {invoice.transaction_ref ? `, transaction reference ${invoice.transaction_ref}` : ""}
            </p>
            <p className="mt-1 text-xs text-green-800">This was a simulated payment (no real money moved).</p>
          </div>
        )}
      </div>
 
      <div className="mt-4 flex gap-2 print:hidden">
        {user.role === "customer" && invoice.status === "unpaid" && (
          <button onClick={payNow} disabled={paying} className={buttonClass}>
            {paying ? "Paying..." : "Pay now"}
          </button>
        )}
        <button onClick={() => window.print()} className={secondaryButtonClass}>
          Print
        </button>
      </div>
    </div>
  );
}
