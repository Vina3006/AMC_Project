import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
 
export default function ServicePage() {
  const { id } = useParams(); // the :id from the URL /services/:id
  const navigate = useNavigate();
 
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
 
  // Load all services and pick the one whose id matches the URL.
  useEffect(() => {
    fetch("http://localhost:5000/api/services")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.services || [];
        setService(list.find((s) => String(s.id) === String(id)) || null);
      })
      .catch(() => setError("Could not load this service."))
      .finally(() => setLoading(false));
  }, [id]);
 
  async function handlePay() {
    setError("");
    setSuccess("");
 
    const token = localStorage.getItem("token");
 
    // Not logged in: go to login, and remember where to come back to.
    if (!token) {
      navigate("/login", { state: { from: `/services/${id}` } });
      return;
    }
 
    setPaying(true);
    try {
      const res = await fetch("http://localhost:5000/api/payments/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ service_id: service.id }),
      });
      const data = await res.json();
 
      if (!res.ok) {
        setError(data.message || "Payment failed. Please try again.");
      } else {
        setSuccess(data.message || "Payment successful. Your invoice has been created.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPaying(false);
    }
  }
 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header />
 
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="text-sm text-[#0b4a34] hover:underline">
          Back to services
        </Link>
 
        {loading && <p className="mt-6 text-slate-600">Loading...</p>}
 
        {!loading && !service && (
          <p className="mt-6 text-slate-600">{error || "Service not found."}</p>
        )}
 
        {service && (
          <div className="mt-4 rounded-md border border-slate-200 bg-white p-8">
            <h1 className="text-2xl font-bold text-slate-900">{service.name}</h1>
            <p className="mt-4 leading-relaxed text-slate-600">{service.description}</p>
 
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-3xl font-bold text-slate-900">₹{service.price}</p>
              </div>
 
              <button
                onClick={handlePay}
                disabled={paying}
                className="rounded-md bg-[#0b4a34] px-8 py-3 font-medium text-white hover:bg-[#083a29] disabled:opacity-60"
              >
                {paying ? "Processing..." : "Pay now"}
              </button>
            </div>
 
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
 
            {success && (
              <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-800">
                {success}{" "}
                <Link to="/invoices" className="font-medium underline">
                  View my invoices
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}