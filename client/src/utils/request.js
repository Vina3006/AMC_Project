import { getToken, logout } from "./auth";
 
// The server address lives in ONE place. When you deploy, set VITE_API_URL
// in your hosting settings and nothing else needs to change.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
 
// Use this instead of writing fetch(...) in every page.
// It adds the token, reads the JSON reply and throws an Error with the
// server's message when something goes wrong.
//
//   const data = await request("/api/tickets");
//   await request("/api/tickets", { method: "POST", body: { asset_id: 1, title: "..." } });
export async function request(path, options = {}) {
  const token = getToken();
 
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });
 
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
 
  // Token invalid or expired: log out and go to the login page.
  if (res.status === 401) {
    logout();
    window.location.href = "/login";
    throw new Error("Your session has expired. Please log in again.");
  }
 
  if (!res.ok) {
    throw new Error((data && data.message) || "Something went wrong");
  }
 
  return data;
}
 