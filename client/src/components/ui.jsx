export const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0b4a34] focus:outline-none";
 
export const buttonClass =
  "rounded-md bg-[#0b4a34] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#083a29] hover:shadow active:translate-y-px disabled:opacity-60 disabled:hover:shadow-sm";
 
export const secondaryButtonClass =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm transition hover:border-[#0b4a34] hover:bg-slate-50 hover:text-[#0b4a34] active:translate-y-px";
 
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
