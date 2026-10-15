import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckIcon } from "../components/Icons";
import { request } from "../utils/request";
import { formatMoney } from "../utils/format";
 
const steps = [
  { title: "Choose a plan", text: "Pick the AMC service that fits your computers and your budget." },
  { title: "Register and pay", text: "Create your account and pay online. You get an invoice at once." },
  { title: "Raise tickets", text: "When something breaks, tell us which computer and what happened." },
  { title: "Track and relax", text: "Follow every ticket, see our visit notes and download your receipts." },
];
 
export default function Home() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    request("/api/services")
      .then(setServices)
      .catch(() => setError("Could not load the services. Please try again in a moment."))
      .finally(() => setLoading(false));
  }, []);
 
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <Header />
 
      {/* Hero */}
      <section className="bg-[#0b3d2e] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            Computer AMC and IT support for your business
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-200">
            We look after your computers, networks and software so your team can keep working. Choose a
            service, pay online and track every request in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#services"
              className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#0b3d2e] transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg"
            >
              View services
            </a>
            <Link
              to="/contact"
              className="rounded-md border border-white/60 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
 
      {/* Services */}
      <section id="services" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold text-slate-900">Our services</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Every plan lists exactly what you get. Open a plan to see the details.
          </p>
 
          {loading && <p className="mt-6 text-slate-600">Loading services...</p>}
          {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
 
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col rounded-md border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#0b4a34]/40 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{service.summary || service.description}</p>
 
                {service.whats_included.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm">
                    {service.whats_included.slice(0, 3).map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0b4a34]" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {service.whats_included.length > 3 && (
                      <li className="pl-6 text-xs text-slate-500">
                        and {service.whats_included.length - 3} more
                      </li>
                    )}
                  </ul>
                )}
 
                <p className="mt-4 flex-1 text-xs text-slate-500">
                  {service.duration_months ? `${service.duration_months} months` : ""}
                  {service.duration_months && service.visit_frequency_months ? " | " : ""}
                  {service.visit_frequency_months ? `Visit every ${service.visit_frequency_months} months` : ""}
                </p>
 
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-xl font-semibold text-slate-900">{formatMoney(service.price)}</p>
                  <Link
                    to={`/services/${service.id}`}
                    className="rounded-md border border-[#0b4a34] px-4 py-2 text-sm font-medium text-[#0b4a34] transition hover:bg-[#0b4a34] hover:text-white"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b4a34] text-sm font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
 
      <Footer />
    </div>
  );
}
 
