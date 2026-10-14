import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
 
// ---- Simple line icons (SVG), so we don't need any image files or emojis ----
function Icon({ children, className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
 
const icons = {
  monitor: (
    <Icon>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </Icon>
  ),
  wrench: (
    <Icon>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.5 17.2a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.1-.5-.5-2.1z" />
    </Icon>
  ),
  network: (
    <Icon>
      <rect x="9" y="3" width="6" height="5" rx="1" />
      <rect x="3" y="16" width="6" height="5" rx="1" />
      <rect x="15" y="16" width="6" height="5" rx="1" />
      <path d="M12 8v4M6 16v-4h12v4" />
    </Icon>
  ),
  shield: (
    <Icon>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  ),
  apps: (
    <Icon>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </Icon>
  ),
  clock: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  people: (
    <Icon>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.5a3 3 0 0 1 0 5M18 14.5c1.7.7 3 2.5 3 5.5" />
    </Icon>
  ),
  tag: (
    <Icon>
      <path d="M3 12V4h8l10 10-8 8z" />
      <circle cx="7.5" cy="8.5" r="1" />
    </Icon>
  ),
};
 
// Choose an icon for a service based on words in its name.
function serviceIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("network")) return icons.network;
  if (n.includes("software")) return icons.apps;
  if (n.includes("hardware") || n.includes("repair")) return icons.wrench;
  if (n.includes("preventive")) return icons.shield;
  return icons.monitor;
}
 
const highlights = [
  { icon: icons.clock, title: "Quick response", text: "Fast on-site and remote support" },
  { icon: icons.people, title: "Skilled technicians", text: "Experienced, trained team" },
  { icon: icons.tag, title: "Flexible plans", text: "AMC options for every budget" },
  { icon: icons.shield, title: "Long-term support", text: "We stay with you after the fix" },
];
 
export default function Home() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
 
  useEffect(() => {
    fetch("http://localhost:5000/api/services")
      .then((res) => res.json())
      .then((data) => setServices(Array.isArray(data) ? data : data.services || []))
      .catch(() => setError("Could not load services. Please check that the server is running."));
  }, []);
 
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="leading-tight">
            <p className="text-xl font-bold text-[#0b4a34]">Divine Grace</p>
            <p className="text-xs text-slate-500">AMC System</p>
          </div>
 
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <Link to="/" className="font-semibold text-[#0b4a34]">Home</Link>
            <a href="#services" className="text-slate-700 hover:text-[#0b4a34]">Services</a>
            <a href="#contact" className="text-slate-700 hover:text-[#0b4a34]">Contact</a>
          </nav>
 
          <Link
            to="/login"
            className="rounded-md bg-[#0b4a34] px-4 py-2 text-sm font-medium text-white hover:bg-[#083a29]"
          >
            Customer Login
          </Link>
        </div>
      </header>
 
      {/* Hero */}
      <section className="bg-[#0b3d2e] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            Computer AMC and IT support for your business
          </h2>
          <p className="mt-5 max-w-xl text-base text-slate-200">
            We look after your computers, networks and software so your team can
            keep working. Choose a service, pay online and track every request
            in one place.
          </p>
 
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#services" className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#0b3d2e] hover:bg-slate-100">
              View services
            </a>
            <a href="#contact" className="rounded-md border border-white/60 px-5 py-3 text-sm font-semibold hover:bg-white/10">
              Contact us
            </a>
          </div>
 
          <div className="mt-14 grid grid-cols-1 gap-6 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h) => (
              <div key={h.title} className="flex gap-3">
                <span className="mt-0.5 text-green-300">{h.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-sm text-slate-300">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Services */}
      <section id="services" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold text-slate-900">Our services</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Pick a service to see the details and book it.
          </p>
 
          {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
 
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col rounded-md border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#0b4a34]/40 hover:shadow-lg"
              >
                <span className="text-[#0b4a34]">{serviceIcon(service.name)}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{service.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {service.description}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-lg font-semibold text-slate-900">₹{service.price}</p>
                  <Link
                    to={`/services/${service.id}`}
                    className="text-sm font-medium text-[#0b4a34] hover:underline"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Footer */}
      <footer id="contact" className="bg-[#0b3d2e] text-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm md:flex-row md:justify-between">
          <p>&copy; 2026 Divine Grace AMC System. All rights reserved.</p>
          <p className="text-slate-400">Computer AMC and IT support</p>
        </div>
      </footer>
    </div>
  );
}