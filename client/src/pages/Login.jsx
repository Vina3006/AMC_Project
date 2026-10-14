import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import PasswordInput from "../components/PasswordInput";
import { Field, inputClass, buttonClass } from "../components/ui";
import { passwordRules, validatePassword } from "../utils/passwordRules";
 
// One page for both Login and Register. "mode" decides which form is shown.
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
 
  // If the user came from the Pay button, this holds the page to return to.
  const returnTo = location.state?.from || "/";
 
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
 
  const isRegister = mode === "register";
 
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
 
  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setForm({ ...form, password: "", confirmPassword: "" });
    setError("");
    setInfo("");
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
 
    // ---- checks in the browser (fast feedback; the server checks again) ----
    if (isRegister) {
      if (form.name.trim().length < 2) return setError("Please enter your full name.");
      const problem = validatePassword(form.password, { name: form.name, email: form.email });
      if (problem) return setError(problem);
      if (form.password !== form.confirmPassword) return setError("The two passwords do not match.");
    }
 
    setLoading(true);
 
    const url = isRegister
      ? "http://localhost:5000/api/auth/register"
      : "http://localhost:5000/api/auth/login";
 
    const body = isRegister
      ? {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirm_password: form.confirmPassword,
        }
      : { email: form.email.trim(), password: form.password };
 
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
 
      if (isRegister) {
        // Account created: ask the user to log in now.
        setMode("login");
        setForm({ name: "", email: form.email, password: "", confirmPassword: "" });
        setInfo("Account created. Please log in.");
      } else {
        // Login worked: save the token, then go to the dashboard (or back where the user came from).
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        navigate(returnTo === "/" ? "/dashboard" : returnTo, { replace: true });
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }
 
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsDiffer = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header />
 
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {isRegister ? "Create an account" : "Customer login"}
          </h1>
          {returnTo !== "/" && !isRegister && (
            <p className="mt-2 text-sm text-slate-500">Please log in to continue with your payment.</p>
          )}
 
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {isRegister && (
              <Field label="Full name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className={inputClass}
                />
              </Field>
            )}
 
            <Field label="Email">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
                className={inputClass}
              />
            </Field>
 
            <Field label="Password">
              <PasswordInput
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </Field>
 
            {/* Live checklist while choosing a password */}
            {isRegister && form.password.length > 0 && (
              <ul className="space-y-1 rounded-md bg-slate-50 p-3 text-xs">
                {passwordRules.map((rule) => {
                  const ok = rule.test(form.password);
                  return (
                    <li key={rule.id} className={`flex items-center gap-2 ${ok ? "text-green-700" : "text-slate-500"}`}>
                      <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-600" : "bg-slate-300"}`} />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
 
            {isRegister && (
              <div>
                <Field label="Confirm password">
                  <PasswordInput
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </Field>
                {passwordsMatch && <p className="mt-1 text-xs text-green-700">The passwords match.</p>}
                {passwordsDiffer && <p className="mt-1 text-xs text-red-600">The passwords do not match yet.</p>}
              </div>
            )}
 
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {info && <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{info}</p>}
 
            <button type="submit" disabled={loading} className={`${buttonClass} w-full py-2.5`}>
              {loading ? "Please wait..." : isRegister ? "Register" : "Log in"}
            </button>
          </form>
 
          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? "Already have an account? " : "New customer? "}
            <button
              type="button"
              onClick={switchMode}
              className="font-medium text-[#0b4a34] hover:underline"
            >
              {isRegister ? "Log in" : "Create an account"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
 
