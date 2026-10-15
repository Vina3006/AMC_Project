import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckIcon, CrossIcon } from "../components/Icons";
import { buttonClass } from "../components/ui";
import { request } from "../utils/request";
import { getUser } from "../utils/auth";
import { formatMoney } from "../utils/format";
 
export default function ServicePage() {
  const { id } = useParams(); // the :id from the URL /services/:id
  const navigate = useNavigate();
  const user = getUser();
  const canBuy = !user || user.role === "customer"; // staff accounts do not buy services
 
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
 
  useEffect(() => {
    request(`/api/services/${id}`)
      .then(setService)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);
 
  async function handlePay() {
    setError("");
    setSuccess("");
 
    // Not logged in: go to login, and come back here afterwards.
    if (!getUser()) {
      navigate("/login", { state: { from: `/services/${id}` } });
      return;
    }
 
    setPaying(true);
    try {
      const data = await request("/api/payments/pay", {
        method: "POST",
        body: { serviceId: service.id },
      });
      setSuccess(data.message || "Payment successful. Your invoice has been created.");
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }
 
  // The small facts shown in the "Service details" box. Empty ones are left out.
  const facts = service
    ? [
        ["Duration", service.duration_months ? `${service.duration_months} months` : null],
        ["Preventive visits", service.visit_frequency_months ? `Every ${service.visit_frequency_months} months` : null],
        ["Response time", service.response_time],
        ["Suitable for", service.suitable_for],
      ].filter(([, value]) => value)
    : [];
 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header />
 
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/" className="text-sm text-[#0b4a34] hover:underline">
          Back to services
        </Link>
 
        {loading && <p className="mt-6 text-slate-600">Loading...</p>}
        {!loading && !service && <p className="mt-6 text-slate-600">{error || "Service not found."}</p>}
 
        {service && (
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            {/* Left: the details */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-md border border-slate-200 bg-white p-8">
                <h1 className="text-2xl font-bold text-slate-900">{service.name}</h1>
                <p className="mt-2 text-slate-600">{service.summary}</p>
                {service.description && (
                  <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-700">{service.description}</p>
                )}
              </div>
 
              <div className="rounded-md border border-slate-200 bg-white p-8">
                <h2 className="text-lg font-semibold text-slate-900">What is included</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {service.whats_included.map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#0b4a34]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
 
                {service.not_included.length > 0 && (
                  <>
                    <h2 className="mt-8 text-lg font-semibold text-slate-900">What is not included</h2>
                    <ul className="mt-4 space-y-3 text-sm">
                      {service.not_included.map((item) => (
                        <li key={item} className="flex gap-3">
                          <CrossIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                          <span className="text-slate-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
 
              {facts.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-white p-8">
                  <h2 className="text-lg font-semibold text-slate-900">Service details</h2>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    {facts.map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="mt-0.5 text-sm font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
 
            {/* Right: price and pay */}
            <div>
              <div className="rounded-md border border-slate-200 bg-white p-6 lg:sticky lg:top-6">
                <p className="text-sm text-slate-500">Price</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{formatMoney(service.price)}</p>
 
                {canBuy ? (
                  <button onClick={handlePay} disabled={paying} className={`${buttonClass} mt-5 w-full py-3`}>
                    {paying ? "Processing..." : "Pay now"}
                  </button>
                ) : (
                  <p className="mt-5 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    You are logged in with a staff account. Services are bought from customer accounts.
                  </p>
                )}
 
                {!user && (
                  <p className="mt-3 text-xs text-slate-500">You will be asked to log in or register first.</p>
                )}
 
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
            </div>
          </div>
        )}
      </main>
 
      <Footer />
    </div>
  );
}
 
