import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PhoneIcon, MailIcon, PinIcon, ClockIcon } from "../components/Icons";
import { Field, inputClass, buttonClass } from "../components/ui";
import { request } from "../utils/request";
import { company } from "../utils/company";
 
const subjects = ["General question", "Request a quote", "Support request", "Other"];
const emptyForm = { name: "", email: "", phone: "", subject: "", message: "", website: "" };
 
export default function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
 
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
 
    // checks in the browser (the server checks again)
    if (form.name.trim().length < 2) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError("Please enter a valid email address.");
    if (form.phone && !/^\d{10}$/.test(form.phone)) return setError("Phone number must be exactly 10 digits.");
    if (!form.subject) return setError("Please choose a subject.");
    if (form.message.trim().length < 10) return setError("Please write a little more in your message (at least 10 characters).");
 
    setSending(true);
    try {
      await request("/api/contact", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject,
          message: form.message.trim(),
          website: form.website, // hidden spam trap
        },
      });
      setSent(true);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }
 
  const details = [
    { icon: PhoneIcon, label: "Phone", value: company.phone },
    { icon: MailIcon, label: "Email", value: company.email },
    { icon: PinIcon, label: "Address", value: company.address },
    { icon: ClockIcon, label: "Working hours", value: company.hours },
  ];
 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header />
 
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Contact us</h1>
        <p className="mt-2 max-w-xl text-slate-600">
          Have a question about a plan, or need a quote? Send us a message and we will get back to you.
        </p>
 
        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          {/* Company details */}
          <div className="space-y-5 lg:col-span-2">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b4a34] text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
 
          {/* The form */}
          <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm lg:col-span-3">
            {sent ? (
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Message sent</h2>
                <p className="mt-2 text-slate-600">Thank you. We have received your message and will reply by email soon.</p>
                <button onClick={() => setSent(false)} className={`${buttonClass} mt-5`}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name">
                    <input name="name" value={form.name} onChange={handleChange} autoComplete="name" className={inputClass} />
                  </Field>
                  <Field label="Email">
                    <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" className={inputClass} />
                  </Field>
                  <Field label="Phone (optional)" hint="10 digits">
                    <input name="phone" value={form.phone} onChange={handleChange} maxLength={10} autoComplete="tel" className={inputClass} />
                  </Field>
                  <Field label="Subject">
                    <select name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
                      <option value="">Select a subject</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
 
                <Field label="Message" hint={`${form.message.length} of 1000 characters`}>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={5} maxLength={1000} className={inputClass} />
                </Field>
 
                {/* Hidden trap for spam robots. People never see or fill this. */}
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
 
                {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
 
                <button type="submit" disabled={sending} className={buttonClass}>
                  {sending ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
 
      <Footer />
    </div>
  );
}
 
