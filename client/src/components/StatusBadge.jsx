const styles = {
  open: "bg-blue-100 text-blue-800",
  assigned: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-slate-200 text-slate-700",
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-slate-200 text-slate-700",
  active: "bg-green-100 text-green-800",
  expired: "bg-amber-100 text-amber-800",
  under_repair: "bg-amber-100 text-amber-800",
  retired: "bg-slate-200 text-slate-700",
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-amber-100 text-amber-800",
};
 
export default function StatusBadge({ status }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {String(status).replace("_", " ")}
    </span>
  );
}
