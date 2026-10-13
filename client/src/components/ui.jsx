export const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0b4a34] focus:outline-none";
 
export const buttonClass =
  "rounded-md bg-[#0b4a34] px-4 py-2 text-sm font-medium text-white hover:bg-[#083a29] disabled:opacity-60";
 
export const secondaryButtonClass =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50";
 
// A label wrapped around its input, with an optional hint under it.
export function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {children}
      </label>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}