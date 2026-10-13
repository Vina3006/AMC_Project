// Small helpers to show dates the way users in India expect.
 
export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
 
export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN");
}
 
export function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}
 
// Turns a date from the server into "2026-10-15", the format <input type="date"> needs.
export function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}