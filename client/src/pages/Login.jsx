import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
 
// One page for both Login and Register. "mode" decides which form is shown.
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
 
  // If the user came from the Pay button, this holds the page to return to.
  const returnTo = location.state?.from || "/";
 
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
 
  // Update one field of the form while typing.
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser from reloading the page
    setError("");
    setInfo("");
    setLoading(true);
 
    const url =
      mode === "login"
        ? "http://localhost:5000/api/auth/login"
        : "http://localhost:5000/api/auth/register";
 
    // Login only needs email + password. Register also sends name.
    const body =
      mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
 
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
 
      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }
 
      if (mode === "register") {
        // Account created: ask the user to log in now.
        setMode("login");
        setForm({ name: "", email: form.email, password: "" });
        setInfo("Account created. Please log in.");
      } else {
        // Login worked: save the token, then go back where the user came from.
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        navigate(returnTo === "/" ? "/dashboard" : returnTo,{ replace: true });
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }
 
  const inputClass =
    "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0b4a34] focus:outline-none";
 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header />
 
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-md border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Customer login" : "Create an account"}
          </h1>
          {returnTo !== "/" && (
            <p className="mt-2 text-sm text-slate-500">
              Please log in to continue with your payment.
            </p>
          )}
 
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm font-medium">Full name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            )}
 
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
 
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className={inputClass}
              />
            </div>
 
            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-green-700">{info}</p>}
 
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#0b4a34] py-2.5 font-medium text-white hover:bg-[#083a29] disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
            </button>
          </form>
 
          <p className="mt-6 text-center text-sm text-slate-600">
            {mode === "login" ? "New customer? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setInfo("");
              }}
              className="font-medium text-[#0b4a34] hover:underline"
            >
              {mode === "login" ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}