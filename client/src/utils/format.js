// Small helpers to show dates the way users in India expect.
 
export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
 
export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN");
}
