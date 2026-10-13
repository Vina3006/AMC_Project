// Small helpers for the login token. Everything about "who is logged in" lives here.
 
export function getToken() {
  return localStorage.getItem("token");
}
 
// The token is three parts joined by dots. The middle part holds the user's
// id and role (and the expiry time) as encoded text, so we can read it here.
function decodeToken(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
 
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
 
// Returns { id, role, name } or null when nobody is logged in (or the token expired).
export function getUser() {
  const token = getToken();
  if (!token) return null;
 
  const payload = decodeToken(token);
  if (!payload) return null;
 
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    logout(); // expired
    return null;
  }
 
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    saved = {};
  }
 
  return { id: payload.id, role: payload.role, name: saved.name || "" };
}
 
export const roleLabels = {
  admin: "Administrator",
  staff: "Staff",
  technician: "Technician",
  customer: "Customer",
};
 