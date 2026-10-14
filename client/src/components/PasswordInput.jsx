import { useState } from "react";
import { inputClass } from "./ui";
 
function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}
 
// A password box with a show/hide button on the right.
export default function PasswordInput({ name, value, onChange, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
 
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${inputClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 mt-1 flex w-11 items-center justify-center text-slate-500 hover:text-[#0b4a34]"
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  );
}
